const express = require("express");
const Category = require("../models/Category");
const Content = require("../models/Content");
const Character = require("../models/Character");
const Merchandise = require("../models/Merchandise");
const Event = require("../models/Event");
const Release = require("../models/Release");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 });

    const [contentCounts, articleCounts, characterCounts] = await Promise.all([
      Content.aggregate([
        { $match: { status: "published" } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Content.aggregate([
        { $match: { status: "published", type: "article" } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Character.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);
    const contentCountMap = Object.fromEntries(contentCounts.map((c) => [String(c._id), c.count]));
    const articleCountMap = Object.fromEntries(articleCounts.map((c) => [String(c._id), c.count]));
    const characterCountMap = Object.fromEntries(characterCounts.map((c) => [String(c._id), c.count]));

    res.json(categories.map((c) => ({
      ...c.toObject(),
      contentCount: contentCountMap[String(c._id)] || 0,
      articles: articleCountMap[String(c._id)] || 0,
      characters: characterCountMap[String(c._id)] || 0,
    })));
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug.toLowerCase(), status: "active" });
    if (!category) return res.status(404).json({ msg: "Category not found" });

    const today = new Date().toISOString().slice(0, 10);
    const [articles, media, characters, merchandise, events, totals] = await Promise.all([
      Content.find({ category: category._id, type: "article", status: "published" }).sort({ createdAt: -1 }).limit(4),
      Content.find({ category: category._id, type: { $ne: "article" }, status: "published" }).sort({ createdAt: -1 }).limit(4),
      Character.find({ category: category._id }).sort({ popularity: -1 }).limit(6),
      Merchandise.find({ category: category._id }).sort({ createdAt: -1 }).limit(4),
      Event.find({ category: category._id, date: { $gte: today } }).sort({ date: 1 }).limit(3),
      Promise.all([
        Content.countDocuments({ category: category._id, type: "article", status: "published" }),
        Content.countDocuments({ category: category._id, type: { $ne: "article" }, status: "published" }),
        Character.countDocuments({ category: category._id }),
        Merchandise.countDocuments({ category: category._id }),
        Event.countDocuments({ category: category._id }),
      ]),
    ]);

    res.json({
      category,
      articles,
      media,
      characters,
      merchandise,
      events,
      counts: {
        articles: totals[0],
        media: totals[1],
        characters: totals[2],
        merchandise: totals[3],
        events: totals[4],
      },
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, description, status, accent } = req.body;
    if (!name?.trim()) return res.status(400).json({ msg: "Name is required" });

    const slug = slugify(req.body.slug || name);
    const exists = await Category.findOne({ $or: [{ slug }, { name: name.trim() }] });
    if (exists) return res.status(400).json({ msg: "A category with that name or slug already exists" });

    const newCategory = await Category.create({ name: name.trim(), slug, description, status, accent });
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { name, slug, description, status, accent } = req.body;
    const update = { description, status, accent };
    if (name) update.name = name.trim();
    if (slug || name) update.slug = slugify(slug || name);

    const updated = await Category.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ msg: "Category not found" });
    res.json(updated);
  } catch (error) {
    const msg = error.code === 11000 ? "Another category already uses that name or slug" : error.message;
    res.status(error.code === 11000 ? 400 : 500).json({ msg });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const inUse = await Promise.all([
      Content.countDocuments({ category: req.params.id }),
      Character.countDocuments({ category: req.params.id }),
      Merchandise.countDocuments({ category: req.params.id }),
      Event.countDocuments({ category: req.params.id }),
      Release.countDocuments({ category: req.params.id }),
    ]);
    if (inUse.some((n) => n > 0)) {
      return res.status(400).json({
        msg: "This category still has content, characters or merchandise. Move or delete them first, or set the category to inactive.",
        msg: "This category is still used by content, characters, merchandise or events. Move or delete them first, or set the category to inactive.",
        msg: "This category is still used by content, characters, merchandise, events or releases. Move or delete them first, or set the category to inactive.",
      });
    }

    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Category not found" });
    res.json({ msg: "Category deleted" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
