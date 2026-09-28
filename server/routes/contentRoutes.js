const express = require("express");
const Content = require("../models/Content");
const Character = require("../models/Character");
const Merchandise = require("../models/Merchandise");
const Event = require("../models/Event");
const Category = require("../models/Category");
const { optionalAuth } = require("../middleware/authMiddleware");
const { searchRegex, exactRegex, resolveCategoryId } = require("../utils/queryHelpers");

const router = express.Router();

const CONTENT_KINDS = Content.CONTENT_TYPES;
const ALL_KINDS = [...CONTENT_KINDS, "character", "merchandise", "event"];
const PER_SOURCE_CAP = 300;

const POPULARITY_BUCKETS = {
  high: (p) => p >= 75,
  medium: (p) => p >= 40 && p < 75,
  low: (p) => p < 40,
};

function yearOf(date) {
  const d = date ? new Date(date) : null;
  return d && !isNaN(d) ? d.getFullYear() : null;
}

function fromContent(item) {
  return {
    _id: item._id,
    kind: item.type,
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    category: item.category,
    fandom: item.fandom,
    genre: item.genre,
    tags: item.tags,
    year: yearOf(item.releaseDate),
    date: item.releaseDate || item.createdAt,
    popularity: item.popularityScore || 0,
    rating: item.ratingAverage || 0,
    views: item.views || 0,
    link: item.type === "article" ? `/stories/${item._id}` : `/multimedia?item=${item._id}`,
  };
}

function fromCharacter(item) {
  return {
    _id: item._id,
    kind: "character",
    title: item.name,
    description: item.bio,
    imageUrl: item.imageUrl,
    category: item.category,
    fandom: item.fandom,
    genre: "",
    tags: item.tags,
    year: yearOf(item.createdAt),
    date: item.createdAt,
    popularity: item.popularity || 0,
    rating: 0,
    views: item.views || 0,
    link: `/characters/${item._id}`,
  };
}

function fromMerch(item) {
  return {
    _id: item._id,
    kind: "merchandise",
    title: item.name,
    description: item.description,
    imageUrl: item.imageUrl,
    category: item.category,
    fandom: item.fandom,
    genre: item.productType,
    tags: item.tag ? [item.tag] : [],
    year: yearOf(item.releaseDate || item.createdAt),
    date: item.releaseDate || item.createdAt,
    popularity: Math.round((item.rating || 0) * 20),
    rating: item.rating || 0,
    views: item.views || 0,
    link: `/shop?item=${item._id}`,
  };
}

function fromEvent(item) {
  return {
    _id: item._id,
    kind: "event",
    title: item.name,
    description: item.description,
    imageUrl: item.imageUrl,
    category: item.category,
    fandom: "",
    genre: item.eventType,
    tags: item.city ? [item.city] : [],
    year: yearOf(item.date),
    date: item.date,
    popularity: Math.min(100, item.views || 0),
    rating: 0,
    views: item.views || 0,
    link: `/events/${item._id}`,
  };
}

const SORTERS = {
  latest: (a, b) => new Date(b.date) - new Date(a.date),
  popular: (a, b) => b.popularity - a.popularity || b.views - a.views,
  alpha: (a, b) => a.title.localeCompare(b.title),
  rating: (a, b) => b.rating - a.rating,
};

router.get("/explore", optionalAuth, async (req, res) => {
  try {
    const isMember = Boolean(req.user);
    const { q = "", category, type = "all", sort = "latest" } = req.query;
    const genre = isMember ? req.query.genre : undefined;
    const year = isMember ? Number(req.query.year) || null : null;
    const popularity = isMember ? req.query.popularity : undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));

    const kinds = type === "all" ? ALL_KINDS : String(type).split(",").filter((k) => ALL_KINDS.includes(k));
    const categoryId = await resolveCategoryId(category);
    const rx = q ? searchRegex(q) : null;

    const base = {};
    if (categoryId) base.category = categoryId;

    const tasks = [];

    const contentKinds = kinds.filter((k) => CONTENT_KINDS.includes(k));
    if (contentKinds.length) {
      const filter = { ...base, status: "published", type: { $in: contentKinds } };
      if (rx) filter.$or = [{ title: rx }, { description: rx }, { tags: rx }, { fandom: rx }, { author: rx }];
      if (genre) filter.genre = exactRegex(genre);
      tasks.push(
        Content.find(filter).populate("category", "name slug").limit(PER_SOURCE_CAP).then((r) => r.map(fromContent))
      );
    }

    if (kinds.includes("character") && !genre) {
      const filter = { ...base };
      if (rx) filter.$or = [{ name: rx }, { alias: rx }, { bio: rx }, { fandom: rx }, { tags: rx }];
      tasks.push(
        Character.find(filter).populate("category", "name slug").limit(PER_SOURCE_CAP).then((r) => r.map(fromCharacter))
      );
    }

    if (kinds.includes("merchandise")) {
      const filter = { ...base };
      if (rx) filter.$or = [{ name: rx }, { description: rx }, { fandom: rx }, { tag: rx }];
      if (genre) filter.productType = exactRegex(genre);
      tasks.push(
        Merchandise.find(filter).populate("category", "name slug").limit(PER_SOURCE_CAP).then((r) => r.map(fromMerch))
      );
    }

    if (kinds.includes("event")) {
      const filter = { ...base };
      if (rx) filter.$or = [{ name: rx }, { description: rx }, { city: rx }, { venue: rx }];
      if (genre) filter.eventType = exactRegex(genre);
      tasks.push(
        Event.find(filter).populate("category", "name slug").limit(PER_SOURCE_CAP).then((r) => r.map(fromEvent))
      );
    }

    let results = (await Promise.all(tasks)).flat();

    if (year) results = results.filter((r) => r.year === year);
    if (popularity && POPULARITY_BUCKETS[popularity]) {
      results = results.filter((r) => POPULARITY_BUCKETS[popularity](r.popularity));
    }

    results.sort(SORTERS[sort] || SORTERS.latest);

    const total = results.length;
    const facets = results.reduce((acc, r) => {
      acc[r.kind] = (acc[r.kind] || 0) + 1;
      return acc;
    }, {});

    res.json({
      results: results.slice((page - 1) * limit, page * limit),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      facets,
      limited: !isMember,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/filters", async (req, res) => {
  try {
    const [categories, genres, productTypes, dates] = await Promise.all([
      Category.find({ status: "active" }).sort({ name: 1 }).select("name slug"),
      Content.distinct("genre", { status: "published" }),
      Merchandise.distinct("productType"),
      Content.distinct("releaseDate", { status: "published" }),
    ]);

    const years = [...new Set(dates.map(yearOf).filter(Boolean))].sort((a, b) => b - a);

    res.json({
      categories,
      genres: [...new Set([...genres, ...productTypes].filter(Boolean))].sort(),
      years,
      types: ALL_KINDS,
      popularity: Object.keys(POPULARITY_BUCKETS),
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/trending", async (req, res) => {
  try {
    const limit = Math.min(12, Number(req.query.limit) || 4);
    const items = await Content.find({ status: "published" })
      .populate("category", "name slug")
      .sort({ views: -1, popularityScore: -1 })
      .limit(limit);
    res.json(items.map(fromContent));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
