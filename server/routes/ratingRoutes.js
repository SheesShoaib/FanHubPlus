const express = require("express");
const mongoose = require("mongoose");
const Rating = require("../models/Rating");
const Content = require("../models/Content");
const { protect, optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

async function refreshContentRating(contentId) {
  const [stats] = await Rating.aggregate([
    { $match: { content: new mongoose.Types.ObjectId(contentId) } },
    { $group: { _id: "$content", avg: { $avg: "$value" }, count: { $sum: 1 } } },
  ]);

  const ratingAverage = stats ? Math.round(stats.avg * 10) / 10 : 0;
  const ratingCount = stats ? stats.count : 0;
  await Content.updateOne({ _id: contentId }, { ratingAverage, ratingCount });
  return { ratingAverage, ratingCount };
}

router.get("/:contentId", optionalAuth, async (req, res) => {
  try {
    const { contentId } = req.params;
    const content = await Content.findById(contentId).select("ratingAverage ratingCount");
    if (!content) return res.status(404).json({ msg: "Content not found" });

    const distribution = await Rating.aggregate([
      { $match: { content: new mongoose.Types.ObjectId(contentId) } },
      { $group: { _id: "$value", count: { $sum: 1 } } },
    ]);

    const mine = req.user ? await Rating.findOne({ user: req.user.id, content: contentId }) : null;

    res.json({
      ratingAverage: content.ratingAverage,
      ratingCount: content.ratingCount,
      distribution: Object.fromEntries([1, 2, 3, 4, 5].map((v) => [v, distribution.find((d) => d._id === v)?.count || 0])),
      myRating: mine?.value || 0,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { content, value } = req.body;
    const score = Number(value);

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({ msg: "Rating must be a whole number from 1 to 5" });
    }
    if (!(await Content.exists({ _id: content }))) return res.status(404).json({ msg: "Content not found" });

    await Rating.findOneAndUpdate(
      { user: req.user.id, content },
      { value: score },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const summary = await refreshContentRating(content);
    res.json({ ...summary, myRating: score });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/:contentId", protect, async (req, res) => {
  try {
    await Rating.findOneAndDelete({ user: req.user.id, content: req.params.contentId });
    const summary = await refreshContentRating(req.params.contentId);
    res.json({ ...summary, myRating: 0 });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
