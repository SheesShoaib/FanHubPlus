const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Bookmark = require("../models/Bookmark");
const Note = require("../models/Note");
const Submission = require("../models/Submission");
const Rating = require("../models/Rating");
const ChatSession = require("../models/ChatHistory");
const Feedback = require("../models/Feedback");
const Category = require("../models/Category");
const Content = require("../models/Content");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

const THEMES = ["dark", "light"];
const FONT_SIZES = ["small", "medium", "large", "xlarge"];

function bookmarkLink(bookmark) {
  const id = bookmark.item?._id;
  if (!id) return null;
  if (bookmark.itemType === "Character") return `/characters/${id}`;
  if (bookmark.itemType === "Event") return `/events/${id}`;
  if (bookmark.itemType === "Merchandise") return `/shop?item=${id}`;
  return bookmark.item.type === "article" ? `/stories/${id}` : `/multimedia?item=${id}`;
}

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user.toSafeJSON());
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.put("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { name, bio, favoriteFandom, favoriteFandoms, preferences } = req.body;

    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ msg: "Name can't be empty" });
      user.name = String(name).trim();
    }
    if (bio !== undefined) user.bio = String(bio).slice(0, 300);
    if (favoriteFandom !== undefined) user.favoriteFandom = favoriteFandom;
    if (Array.isArray(favoriteFandoms)) {
      user.favoriteFandoms = favoriteFandoms.map(String);
      if (favoriteFandoms.length) user.favoriteFandom = favoriteFandoms[0];
    }

    if (preferences && typeof preferences === "object") {
      const current = user.preferences?.toObject ? user.preferences.toObject() : user.preferences || {};
      const next = { ...current };
      if (THEMES.includes(preferences.theme)) next.theme = preferences.theme;
      if (FONT_SIZES.includes(preferences.fontSize)) next.fontSize = preferences.fontSize;
      if (typeof preferences.compactMode === "boolean") next.compactMode = preferences.compactMode;
      if (typeof preferences.emailNotifications === "boolean") next.emailNotifications = preferences.emailNotifications;
      user.preferences = next;
    }

    await user.save();
    res.json(user.toSafeJSON());
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.put("/me/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    const matches = await bcrypt.compare(String(currentPassword || ""), user.password);
    if (!matches) return res.status(400).json({ msg: "Current password is incorrect" });
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ msg: "New password must be at least 6 characters" });
    }

    user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    await user.save();
    res.json({ msg: "Password updated" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.post("/upload", protect, upload.single("profilePicture"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: upload.fileUrl(req.file) },
      { new: true }
    );

    res.json({ msg: "Profile picture updated", user: user.toSafeJSON() });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get("/me/dashboard", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const [bookmarks, notes, submissions, ratings, chats, feedback, counts] = await Promise.all([
      Bookmark.find({ user: userId }).populate("item").sort({ createdAt: -1 }).limit(6),
      Note.find({ user: userId }).sort({ updatedAt: -1 }).limit(5),
      Submission.find({ user: userId }).sort({ updatedAt: -1 }).limit(5),
      Rating.find({ user: userId }).populate("content", "title type").sort({ updatedAt: -1 }).limit(5),
      ChatSession.find({ user: userId }).sort({ updatedAt: -1 }).limit(5).select("title updatedAt messages"),
      Feedback.find({ user: userId }).sort({ createdAt: -1 }).limit(3),
      Promise.all([
        Bookmark.countDocuments({ user: userId }),
        Note.countDocuments({ user: userId }),
        Submission.countDocuments({ user: userId }),
        ChatSession.countDocuments({ user: userId }),
      ]),
    ]);

    const activity = [
      ...bookmarks
        .filter((b) => b.item)
        .map((b) => ({
          type: "bookmark",
          text: `Bookmarked ${b.item.title || b.item.name}`,
          date: b.createdAt,
          link: bookmarkLink(b),
        })),
      ...notes.map((n) => ({ type: "note", text: `Wrote a note: ${n.title}`, date: n.updatedAt, link: "/dashboard/notes" })),
      ...submissions.map((s) => ({
        type: "submission",
        text: `Submission "${s.title}" is ${s.status}`,
        date: s.updatedAt,
        link: "/dashboard/submissions",
      })),
      ...ratings
        .filter((r) => r.content)
        .map((r) => ({
          type: "rating",
          text: `Rated ${r.content.title} ${r.value}/5`,
          date: r.updatedAt,
          link: r.content.type === "article" ? `/stories/${r.content._id}` : `/multimedia?item=${r.content._id}`,
        })),
      ...chats.map((c) => ({
        type: "chat",
        text: `Chatted with the assistant: ${c.title}`,
        date: c.updatedAt,
        link: "/dashboard/chat-history",
      })),
      ...feedback.map((f) => ({ type: "feedback", text: `Sent ${f.type} feedback`, date: f.createdAt, link: "/contact" })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    const favoriteCategories = await Category.find({ slug: { $in: user.favoriteFandoms } });

    const recommendFilter = { status: "published" };
    if (favoriteCategories.length) recommendFilter.category = { $in: favoriteCategories.map((c) => c._id) };
    const recommendations = await Content.find(recommendFilter)
      .populate("category", "name slug")
      .sort({ popularityScore: -1, ratingAverage: -1 })
      .limit(4);

    res.json({
      user: user.toSafeJSON(),
      counts: { bookmarks: counts[0], notes: counts[1], submissions: counts[2], chats: counts[3] },
      activity,
      favoriteCategories,
      recentBookmarks: bookmarks.filter((b) => b.item).slice(0, 4).map((b) => ({
        _id: b._id,
        itemType: b.itemType,
        title: b.item.title || b.item.name,
        imageUrl: b.item.imageUrl,
        link: bookmarkLink(b),
      })),
      recommendations,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const { search = "", role = "all", status = "all", page = 1, limit = 10 } = req.query;
    const filter = {};

    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { email: rx }];
    }
    if (role !== "all") filter.role = role;
    if (status === "blocked") filter.isBlocked = true;
    if (status === "active") filter.isBlocked = false;

    const pageNum = Math.max(1, Number(page) || 1);
    const perPage = Math.min(50, Math.max(1, Number(limit) || 10));

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -resetToken -verifyToken")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * perPage)
        .limit(perPage),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page: pageNum, pages: Math.max(1, Math.ceil(total / perPage)) });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [total, admins, blocked, activeWeek] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ isBlocked: true }),
      User.countDocuments({ lastActiveAt: { $gte: weekAgo } }),
    ]);
    res.json({ total, admins, blocked, activeWeek });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get("/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -resetToken -verifyToken");
    if (!user) return res.status(404).json({ msg: "User not found" });

    const [bookmarks, submissions, chats] = await Promise.all([
      Bookmark.countDocuments({ user: user._id }),
      Submission.countDocuments({ user: user._id }),
      ChatSession.countDocuments({ user: user._id }),
    ]);

    res.json({ ...user.toObject(), stats: { bookmarks, submissions, chats } });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user.id && (req.body.isBlocked || req.body.role === "user")) {
      return res.status(400).json({ msg: "You can't block or demote your own admin account" });
    }

    const update = {};
    if (["user", "admin"].includes(req.body.role)) update.role = req.body.role;
    if (typeof req.body.isBlocked === "boolean") {
      update.isBlocked = req.body.isBlocked;
      update.blockedReason = req.body.isBlocked ? req.body.blockedReason || "" : "";
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select(
      "-password -resetToken -verifyToken"
    );
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ msg: "You can't delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    await Promise.all([
      Bookmark.deleteMany({ user: user._id }),
      Note.deleteMany({ user: user._id }),
      Rating.deleteMany({ user: user._id }),
      ChatSession.deleteMany({ user: user._id }),
    ]);

    res.json({ msg: "User deleted" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
