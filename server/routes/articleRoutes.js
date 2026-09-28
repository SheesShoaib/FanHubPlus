const express = require("express");
const Content = require("../models/Content");
const Submission = require("../models/Submission");
const { protect, adminOnly, optionalAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { searchRegex, exactRegex, resolveCategoryId, incrementViews, parseContentBody, toBool, SORTS } = require("../utils/queryHelpers");

const router = express.Router();

async function fillSubmissionImages(docs) {
  const missing = docs.filter((d) => !d.imageUrl && d.submittedBy);
  if (!missing.length) return docs;

  const subs = await Submission.find({
    publishedContent: { $in: missing.map((d) => d._id) },
    imageUrl: { $ne: "" },
  }).select("publishedContent imageUrl");

  for (const sub of subs) {
    const doc = missing.find((d) => d._id.equals(sub.publishedContent));
    doc.imageUrl = sub.imageUrl;
    Content.updateOne({ _id: doc._id, imageUrl: "" }, { imageUrl: sub.imageUrl }).catch(() => {});
  }
  return docs;
}

router.get("/", optionalAuth, async (req, res) => {
  try {
    const { category, search, sort, genre, year, featured, all } = req.query;
    const q = { type: "article" };

    if (!(toBool(all) && req.user?.role === "admin")) q.status = "published";

    const categoryId = await resolveCategoryId(category);
    if (categoryId) q.category = categoryId;

    if (search) {
      const rx = searchRegex(search);
      q.$or = [{ title: rx }, { description: rx }, { author: rx }, { tags: rx }];
    }
    if (genre) q.genre = exactRegex(genre);
    if (year) {
      q.releaseDate = { $gte: new Date(`${year}-01-01`), $lt: new Date(`${Number(year) + 1}-01-01`) };
    }
    if (featured !== undefined) q.featured = toBool(featured);

    const data = await Content.find(q)
      .populate("category", "name slug")
      .sort(SORTS[sort] || SORTS.latest);
    res.json(await fillSubmissionImages(data));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const data = await Content.findById(req.params.id).populate("category", "name slug");
    if (!data || (data.status !== "published" && req.user?.role !== "admin")) {
      return res.status(404).json({ msg: "Not found" });
    }
    incrementViews(Content, data._id);
    await fillSubmissionImages([data]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post("/", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const data = parseContentBody(req.body);
    if (!data.title || !data.category) return res.status(400).json({ msg: "Title and category are required" });
    if (req.file) data.imageUrl = upload.fileUrl(req.file);

    const item = await Content.create({ ...data, type: "article" });
    const populated = await Content.findById(item._id).populate("category", "name slug");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/:id", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const updateData = parseContentBody(req.body);
    delete updateData.type;
    if (req.file) updateData.imageUrl = upload.fileUrl(req.file);

    const updated = await Content.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate("category", "name slug");
    if (!updated) return res.status(404).json({ msg: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Content.findByIdAndDelete(req.params.id);
    res.json({ msg: "Deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
