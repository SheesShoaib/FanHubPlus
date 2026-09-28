const express = require("express");
const Feedback = require("../models/Feedback");
const Notification = require("../models/Notification");
const { protect, adminOnly, optionalAuth } = require("../middleware/authMiddleware");
const { formLimiter } = require("../middleware/rateLimitMiddleware");
const { searchRegex } = require("../utils/queryHelpers");

const router = express.Router();

const TYPES = ["bug", "suggestion", "query"];
const STATUSES = ["open", "in-progress", "resolved"];

const DETAIL_FIELDS = {
  bug: ["severity", "page", "steps", "browser"],
  suggestion: ["area", "impact"],
  query: ["topic", "orderRef"],
};

const TYPE_LABELS = { bug: "Bug report", suggestion: "Suggestion", query: "General query" };

function categoryLabel(feedback) {
  const sub = feedback.details?.area || feedback.details?.topic;
  return sub ? `${TYPE_LABELS[feedback.type]} (${sub})` : TYPE_LABELS[feedback.type];
}

router.post("/", optionalAuth, formLimiter, async (req, res) => {
  try {
    const { type, subject, message } = req.body;
    const name = String(req.body.name || req.user?.name || "").trim();
    const email = String(req.body.email || req.user?.email || "").trim();

    if (!TYPES.includes(type)) return res.status(400).json({ msg: "Choose bug, suggestion or query" });
    if (!name || !email || !String(message || "").trim()) {
      return res.status(400).json({ msg: "Name, email and message are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ msg: "Please enter a valid email" });

    const rawDetails = req.body.details || {};
    const details = {};
    DETAIL_FIELDS[type].forEach((field) => {
      if (rawDetails[field]) details[field] = String(rawDetails[field]).slice(0, 1000);
    });

    const feedback = await Feedback.create({
      user: req.user?.id || null,
      name,
      email,
      type,
      subject: String(subject || "").slice(0, 150),
      message: String(message).slice(0, 5000),
      details,
    });

    res.status(201).json({ msg: "Thanks! Your feedback has been received.", id: feedback._id });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/my", protect, async (req, res) => {
  try {
    const list = await Feedback.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const { type, status, search } = req.query;
    const q = {};
    if (TYPES.includes(type)) q.type = type;
    if (STATUSES.includes(status)) q.status = status;
    if (search) {
      const rx = searchRegex(search);
      q.$or = [{ name: rx }, { email: rx }, { subject: rx }, { message: rx }];
    }

    const list = await Feedback.find(q).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const update = {};
    if (STATUSES.includes(req.body.status)) update.status = req.body.status;
    if (req.body.adminNote !== undefined) update.adminNote = String(req.body.adminNote).slice(0, 1000);

    const previous = await Feedback.findByIdAndUpdate(req.params.id, update);
    if (!previous) return res.status(404).json({ msg: "Feedback not found" });
    const updated = await Feedback.findById(req.params.id);

    if (updated.status === "resolved" && previous.status !== "resolved" && updated.user) {
      await Notification.create({
        user: updated.user,
        title: "Feedback resolved!",
        message: `Your ${categoryLabel(updated)} feedback${updated.subject ? ` "${updated.subject}"` : ""} has been resolved.`,
        link: "/contact",
      });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Feedback not found" });
    res.json({ msg: "Feedback deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
