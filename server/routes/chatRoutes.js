const express = require("express");
const mongoose = require("mongoose");
const ChatSession = require("../models/ChatHistory");
const Faq = require("../models/Faq");
const User = require("../models/User");
const { protect, adminOnly, optionalAuth } = require("../middleware/authMiddleware");
const { chatLimiter } = require("../middleware/rateLimitMiddleware");
const { getSettings } = require("../middleware/maintenanceMiddleware");
const { generateReply, DEFAULT_SUGGESTIONS } = require("../services/aiService");
const { toList, toBool } = require("../utils/queryHelpers");

const router = express.Router();

const WELCOME = {
  from: "bot",
  text: "Hi! I'm the FanHub+ assistant. Ask me about the platform, get recommendations, find events, or say \"give me a tour\".",
  suggestions: DEFAULT_SUGGESTIONS,
};

function canAccess(session, req) {
  if (req.user?.role === "admin") return true;
  if (session.user) return req.user && String(session.user) === req.user.id;
  const guestId = req.body?.guestId || req.query.guestId;
  return Boolean(guestId) && session.guestId === guestId;
}

router.get("/welcome", async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({ enabled: settings.chatbotEnabled, message: WELCOME });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post("/message", optionalAuth, chatLimiter, async (req, res) => {
  try {
    const settings = await getSettings();
    if (!settings.chatbotEnabled) return res.status(503).json({ msg: "The assistant is currently turned off." });

    const message = String(req.body.message || "").trim().slice(0, 500);
    const { sessionId, guestId } = req.body;
    if (!message) return res.status(400).json({ msg: "Message can't be empty" });

    let session = null;
    if (sessionId && mongoose.isValidObjectId(sessionId)) {
      session = await ChatSession.findById(sessionId);
      if (session && !canAccess(session, req)) session = null;
    }

    if (!session) {
      session = new ChatSession({
        user: req.user?.id || null,
        guestId: req.user ? "" : String(guestId || ""),
        title: message.slice(0, 60),
      });
    } else if (!session.user && req.user) {
      session.user = req.user.id;
    }

    const user = req.user ? await User.findById(req.user.id).select("name favoriteFandoms") : null;

    session.messages.push({ from: "user", text: message });
    const reply = await generateReply({ session, message, user });
    session.messages.push({
      from: "bot",
      text: reply.text,
      links: reply.links || [],
      suggestions: reply.suggestions || [],
      intent: reply.intent || "",
    });
    await session.save();

    res.json({
      sessionId: session._id,
      reply: session.messages[session.messages.length - 1],
      onboardingStep: session.onboardingStep,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/sessions", protect, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(
      sessions.map((s) => ({
        _id: s._id,
        title: s.title,
        updatedAt: s.updatedAt,
        createdAt: s.createdAt,
        messageCount: s.messages.length,
        onboardingCompleted: s.onboardingCompleted,
        messages: s.messages,
      }))
    );
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/sessions/:id", optionalAuth, async (req, res) => {
  try {
    const session = await ChatSession.findById(req.params.id);
    if (!session || !canAccess(session, req)) return res.status(404).json({ msg: "Conversation not found" });
    res.json(session);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/sessions/:id", protect, async (req, res) => {
  try {
    const deleted = await ChatSession.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deleted) return res.status(404).json({ msg: "Conversation not found" });
    res.json({ msg: "Conversation deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/faqs", protect, adminOnly, async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ category: 1, createdAt: -1 });
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

function parseFaqBody(body) {
  const data = {};
  if (body.question !== undefined) data.question = String(body.question).trim();
  if (body.answer !== undefined) data.answer = String(body.answer).trim();
  if (body.category !== undefined) data.category = body.category;
  if (body.keywords !== undefined) data.keywords = toList(body.keywords).map((k) => k.toLowerCase());
  if (body.active !== undefined) data.active = toBool(body.active);
  return data;
}

router.post("/faqs", protect, adminOnly, async (req, res) => {
  try {
    const data = parseFaqBody(req.body);
    if (!data.question || !data.answer) return res.status(400).json({ msg: "Question and answer are required" });
    res.status(201).json(await Faq.create(data));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/faqs/:id", protect, adminOnly, async (req, res) => {
  try {
    const updated = await Faq.findByIdAndUpdate(req.params.id, parseFaqBody(req.body), { new: true });
    if (!updated) return res.status(404).json({ msg: "FAQ not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/faqs/:id", protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Faq.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "FAQ not found" });
    res.json({ msg: "FAQ deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [sessions, messageStats, intents, topFaqs] = await Promise.all([
      ChatSession.countDocuments(),
      ChatSession.aggregate([
        { $unwind: "$messages" },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            week: { $sum: { $cond: [{ $gte: ["$messages.createdAt", since] }, 1, 0] } },
          },
        },
      ]),
      ChatSession.aggregate([
        { $unwind: "$messages" },
        { $match: { "messages.from": "bot", "messages.intent": { $ne: "" } } },
        { $group: { _id: "$messages.intent", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Faq.find({ hits: { $gt: 0 } }).sort({ hits: -1 }).limit(5).select("question hits"),
    ]);

    res.json({
      sessions,
      messages: messageStats[0]?.total || 0,
      messagesThisWeek: messageStats[0]?.week || 0,
      intents,
      topFaqs,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
