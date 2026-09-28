const express = require("express");
const Release = require("../models/Release");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { searchRegex, resolveCategoryId } = require("../utils/queryHelpers");

const router = express.Router();

function parseReleaseBody(body) {
  const data = {};
  ["title", "category", "releaseType", "fandom", "platform", "tag", "description"].forEach((key) => {
    if (body[key] !== undefined) data[key] = body[key];
  });
  if (data.category === "") data.category = null;
  if (body.releaseDate) data.releaseDate = new Date(body.releaseDate);
  return data;
}

router.get("/", async (req, res) => {
  try {
    const { type, category, search, include } = req.query;
    const q = {};

    if (include !== "all") q.releaseDate = { $gte: new Date(new Date().toDateString()) };
    if (type && type !== "all") q.releaseType = type;
    const categoryId = await resolveCategoryId(category);
    if (categoryId) q.category = categoryId;
    if (search) {
      const rx = searchRegex(search);
      q.$or = [{ title: rx }, { fandom: rx }, { description: rx }];
    }

    const releases = await Release.find(q).populate("category", "name slug").sort({ releaseDate: 1 });
    res.json(releases);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.post("/", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const data = parseReleaseBody(req.body);
    if (!data.title || !data.releaseDate) return res.status(400).json({ msg: "Title and release date are required" });
    if (req.file) data.imageUrl = upload.fileUrl(req.file);

    const release = await Release.create(data);
    res.status(201).json(await release.populate("category", "name slug"));
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.put("/:id", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const data = parseReleaseBody(req.body);
    if (req.file) data.imageUrl = upload.fileUrl(req.file);

    const updated = await Release.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
      .populate("category", "name slug");
    if (!updated) return res.status(404).json({ msg: "Release not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Release.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Release not found" });
    res.json({ msg: "Release deleted" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
