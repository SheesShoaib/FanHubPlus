const express = require("express");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const [items, unread] = await Promise.all([
      Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20),
      Notification.countDocuments({ user: req.user.id, read: false }),
    ]);
    res.json({ items, unread });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.json({ msg: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
