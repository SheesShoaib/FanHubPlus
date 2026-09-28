const express = require("express");
const PageView = require("../models/PageView");
const Submission = require("../models/Submission");
const Feedback = require("../models/Feedback");
const { protect, adminOnly, optionalAuth } = require("../middleware/authMiddleware");
const { trackLimiter } = require("../middleware/rateLimitMiddleware");
const { detectDevice, getOverview, getRecentActivity } = require("../services/analyticsService");

const router = express.Router();

router.post("/track", optionalAuth, trackLimiter, async (req, res) => {
  try {
    const path = String(req.body.path || "").slice(0, 200);
    if (!path.startsWith("/") || path.startsWith("/admin")) return res.json({ ok: true });

    await PageView.create({
      path,
      user: req.user?.id || null,
      visitorId: String(req.body.visitorId || "").slice(0, 64),
      device: detectDevice(req.headers["user-agent"]),
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/overview", protect, adminOnly, async (req, res) => {
  try {
    const days = [7, 30, 90, 365].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    res.json(await getOverview(days));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/pending", protect, adminOnly, async (req, res) => {
  try {
    const [pendingSubmissions, openFeedback] = await Promise.all([
      Submission.countDocuments({ status: "pending" }),
      Feedback.countDocuments({ status: "open" }),
    ]);
    res.json({ pendingSubmissions, openFeedback });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/activity", protect, adminOnly, async (req, res) => {
  try {
    res.json(await getRecentActivity(Number(req.query.limit) || 10));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
