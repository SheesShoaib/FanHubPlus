const mongoose = require("mongoose");
const Category = require("../models/Category");

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function searchRegex(text) {
  return new RegExp(escapeRegex(String(text).trim()), "i");
}

function exactRegex(text) {
  return new RegExp(`^${escapeRegex(String(text).trim())}$`, "i");
}

async function resolveCategoryId(value) {
  if (!value || value === "all") return null;
  if (mongoose.isValidObjectId(value)) return value;
  const cat = await Category.findOne({
    $or: [{ slug: String(value).toLowerCase() }, { name: exactRegex(value) }],
  });
  return cat ? cat._id : new mongoose.Types.ObjectId();
}

function toList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function toBool(value) {
  return value === true || value === "true" || value === "1" || value === "on";
}

function parseJSON(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function incrementViews(Model, id) {
  Model.updateOne({ _id: id }, { $inc: { views: 1 } }).catch(() => {});
}

function parseContentBody(body) {
  const data = {};
  const plain = ["title", "category", "description", "body", "author", "fandom", "genre", "status", "mediaUrl", "duration", "type"];
  plain.forEach((key) => {
    if (body[key] !== undefined) data[key] = body[key];
  });

  if (body.tags !== undefined) data.tags = toList(body.tags);
  if (body.featured !== undefined) data.featured = toBool(body.featured);
  if (body.popularityScore !== undefined && body.popularityScore !== "") data.popularityScore = Number(body.popularityScore) || 0;
  if (body.releaseDate) data.releaseDate = new Date(body.releaseDate);
  if (body.timeline !== undefined) {
    const timeline = parseJSON(body.timeline, []);
    data.timeline = Array.isArray(timeline) ? timeline.filter((t) => t && t.title) : [];
  }
  if (body.imageUrl !== undefined && !String(body.imageUrl).startsWith("blob:")) data.imageUrl = body.imageUrl;
  return data;
}

const SORTS = {
  latest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  popular: { popularityScore: -1, views: -1 },
  views: { views: -1 },
  rating: { ratingAverage: -1, ratingCount: -1 },
  alpha: { title: 1 },
  release: { releaseDate: -1 },
};

module.exports = {
  escapeRegex,
  searchRegex,
  exactRegex,
  resolveCategoryId,
  toList,
  toBool,
  parseJSON,
  incrementViews,
  parseContentBody,
  SORTS,
};
