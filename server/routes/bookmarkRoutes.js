const express = require("express");
const Bookmark = require("../models/Bookmark");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const ITEM_TYPES = ["Content", "Character", "Event", "Merchandise"];

router.get("/", protect, async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (ITEM_TYPES.includes(req.query.itemType)) filter.itemType = req.query.itemType;

    const list = await Bookmark.find(filter).populate("item").sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/check", protect, async (req, res) => {
  try {
    const { itemType, item } = req.query;
    const bookmark = await Bookmark.findOne({ user: req.user.id, itemType, item });
    res.json({ bookmarked: Boolean(bookmark), bookmark });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { itemType, item, note } = req.body;
    if (!ITEM_TYPES.includes(itemType) || !item) {
      return res.status(400).json({ msg: "A valid itemType and item are required" });
    }

    const existing = await Bookmark.findOne({ user: req.user.id, itemType, item });
    if (existing) return res.status(200).json(existing);

    const bm = await Bookmark.create({ user: req.user.id, itemType, item, note: note || "" });
    res.status(201).json(bm);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const bm = await Bookmark.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { note: String(req.body.note || "").slice(0, 1000) },
      { new: true }
    ).populate("item");
    if (!bm) return res.status(404).json({ msg: "Bookmark not found" });
    res.json(bm);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    await Bookmark.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ msg: "Removed" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/", protect, async (req, res) => {
  try {
    const { itemType, item } = req.body;
    await Bookmark.findOneAndDelete({ user: req.user.id, itemType, item });
    res.json({ msg: "Removed" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
