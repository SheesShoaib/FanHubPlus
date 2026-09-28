const express = require("express");
const Content = require("../models/Content");
const { protect, adminOnly, optionalAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { searchRegex, exactRegex, resolveCategoryId, incrementViews, parseContentBody, toBool, SORTS } = require("../utils/queryHelpers");

const router = express.Router();
const MEDIA_TYPES = Content.MEDIA_TYPES;
const mediaUpload = upload.media.fields([
  { name: "image", maxCount: 1 },
  { name: "media", maxCount: 1 },
]);

function applyFiles(data, files = {}) {
  if (files.image?.[0]) data.imageUrl = upload.fileUrl(files.image[0]);
  if (files.media?.[0]) data.mediaUrl = upload.fileUrl(files.media[0]);
}

router.get("/", optionalAuth, async (req, res) => {
  try {
    const { type, category, search, sort, genre, tag, all } = req.query;
    const q = { type: { $in: MEDIA_TYPES } };

    if (!(toBool(all) && req.user?.role === "admin")) q.status = "published";
    if (type && MEDIA_TYPES.includes(String(type).toLowerCase())) q.type = String(type).toLowerCase();

    const categoryId = await resolveCategoryId(category);
    if (categoryId) q.category = categoryId;
    if (genre) q.genre = exactRegex(genre);
    if (tag) q.tags = exactRegex(tag);
    if (search) {
      const rx = searchRegex(search);
      q.$or = [{ title: rx }, { description: rx }, { tags: rx }, { fandom: rx }];
    }

    const items = await Content.find(q)
      .populate("category", "name slug")
      .sort(SORTS[sort] || SORTS.latest);
    res.json(items);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const item = await Content.findOne({ _id: req.params.id, type: { $in: MEDIA_TYPES } }).populate(
      "category",
      "name slug"
    );
    if (!item || (item.status !== "published" && req.user?.role !== "admin")) {
      return res.status(404).json({ msg: "Media not found" });
    }
    incrementViews(Content, item._id);
    res.json(item);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post("/", protect, adminOnly, mediaUpload, async (req, res) => {
  try {
    const data = parseContentBody(req.body);
    applyFiles(data, req.files);

    if (!data.title || !data.category) return res.status(400).json({ msg: "Title and category are required" });
    if (!MEDIA_TYPES.includes(data.type)) data.type = "video";
    if (!data.status) data.status = "published";
    if (!data.mediaUrl) return res.status(400).json({ msg: "Add a media URL (e.g. YouTube link) or upload a file" });

    const item = await Content.create(data);
    res.status(201).json(await item.populate("category", "name slug"));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/:id", protect, adminOnly, mediaUpload, async (req, res) => {
  try {
    const data = parseContentBody(req.body);
    applyFiles(data, req.files);
    if (data.type && !MEDIA_TYPES.includes(data.type)) delete data.type;

    const updated = await Content.findOneAndUpdate({ _id: req.params.id, type: { $in: MEDIA_TYPES } }, data, {
      new: true,
      runValidators: true,
    }).populate("category", "name slug");
    if (!updated) return res.status(404).json({ msg: "Media not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Content.findOneAndDelete({ _id: req.params.id, type: { $in: MEDIA_TYPES } });
    if (!deleted) return res.status(404).json({ msg: "Media not found" });
    res.json({ msg: "Media deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
