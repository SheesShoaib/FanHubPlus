const express = require("express");
const Note = require("../models/Note");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { title, text } = req.body;
    if (!title?.trim() || !text?.trim()) return res.status(400).json({ msg: "Title and text are required" });

    const note = await Note.create({ user: req.user.id, title: title.trim(), text });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const { title, text } = req.body;
    if (!title?.trim() || !text?.trim()) return res.status(400).json({ msg: "Title and text are required" });

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title: title.trim(), text },
      { new: true }
    );
    if (!note) return res.status(404).json({ msg: "Note not found" });
    res.json(note);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ msg: "Note deleted" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
