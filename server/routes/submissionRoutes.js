const express = require("express");
const Submission = require("../models/Submission");
const Content = require("../models/Content");
const User = require("../models/User");
const Category = require("../models/Category");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { formLimiter } = require("../middleware/rateLimitMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { resolveCategoryId } = require("../utils/queryHelpers");

const router = express.Router();

router.get("/my", protect, async (req, res) => {
  try {
    const list = await Submission.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const list = await Submission.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.post("/", protect, formLimiter, upload.single("image"), async (req, res) => {
  try {
    const { title, category, content } = req.body;
    if (!title?.trim() || !category || !content?.trim()) {
      return res.status(400).json({ msg: "Title, category and content are required" });
    }

    const imageUrl = req.file ? upload.fileUrl(req.file) : "";
    const submission = await Submission.create({
      user: req.user.id,
      title: title.trim(),
      category,
      content,
      imageUrl,
    });
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ msg: "Submission not found" });

    if (status === "approved") {
      if (submission.publishedContent) {
        await Content.updateOne({ _id: submission.publishedContent }, { status: "published" });
        if (submission.imageUrl) {
          await Content.updateOne({ _id: submission.publishedContent, imageUrl: "" }, { imageUrl: submission.imageUrl });
        }
      } else {
        const categoryId = await resolveCategoryId(submission.category);
        const categoryExists = categoryId && (await Category.exists({ _id: categoryId }));
        if (!categoryExists) {
          return res.status(400).json({
            msg: `Category "${submission.category}" doesn't exist. Create it before approving this submission.`,
          });
        }

        const author = await User.findById(submission.user).select("name");
        const [firstParagraph] = submission.content.split(/\n+/);

        const article = await Content.create({
          title: submission.title,
          category: categoryId,
          type: "article",
          description: firstParagraph.slice(0, 280),
          body: submission.content,
          author: author?.name || "Fan contributor",
          status: "published",
          tags: ["fan-submission"],
          submittedBy: submission.user,
          imageUrl: submission.imageUrl || "",
        });
        submission.publishedContent = article._id;
      }
    } else if (submission.publishedContent) {
      await Content.updateOne({ _id: submission.publishedContent }, { status: "draft" });
    }

    submission.status = status;
    if (adminNote !== undefined) submission.adminNote = adminNote;
    await submission.save();

    res.json(await submission.populate("user", "name email"));
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== "admin") Object.assign(filter, { user: req.user.id, status: "pending" });

    const deleted = await Submission.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ msg: "Submission not found or already reviewed" });
    res.json({ msg: "Submission deleted" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
