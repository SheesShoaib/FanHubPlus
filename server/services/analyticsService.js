const User = require("../models/User");
const PageView = require("../models/PageView");
const Content = require("../models/Content");
const Character = require("../models/Character");
const Merchandise = require("../models/Merchandise");
const Event = require("../models/Event");
const Category = require("../models/Category");
const Bookmark = require("../models/Bookmark");
const ChatSession = require("../models/ChatHistory");
const Submission = require("../models/Submission");
const Feedback = require("../models/Feedback");
const LoginHistory = require("../models/LoginHistory");

const DAY = 24 * 60 * 60 * 1000;

function detectDevice(userAgent = "") {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/.test(ua)) return "tablet";
  if (/mobi|iphone|android/.test(ua)) return "mobile";
  return "desktop";
}

function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

async function popularCategories() {
  const categories = await Category.find().select("name slug");
  const viewsBy = {};

  const sumViews = async (Model) => {
    const rows = await Model.aggregate([{ $group: { _id: "$category", views: { $sum: "$views" }, items: { $sum: 1 } } }]);
    rows.forEach((r) => {
      const key = String(r._id);
      viewsBy[key] = viewsBy[key] || { views: 0, items: 0 };
      viewsBy[key].views += r.views;
      viewsBy[key].items += r.items;
    });
  };

  await Promise.all([sumViews(Content), sumViews(Character), sumViews(Merchandise), sumViews(Event)]);

  const favouriteCounts = await User.aggregate([
    { $unwind: "$favoriteFandoms" },
    { $group: { _id: "$favoriteFandoms", fans: { $sum: 1 } } },
  ]);
  const fansBySlug = Object.fromEntries(favouriteCounts.map((f) => [f._id, f.fans]));

  return categories
    .map((c) => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      views: viewsBy[String(c._id)]?.views || 0,
      items: viewsBy[String(c._id)]?.items || 0,
      fans: fansBySlug[c.slug] || 0,
    }))
    .sort((a, b) => b.views - a.views || b.fans - a.fans);
}

async function getOverview(days = 30) {
  const now = Date.now();
  const since = new Date(now - days * DAY);
  const prevSince = new Date(now - 2 * days * DAY);

  const [
    totalUsers,
    newUsers,
    prevNewUsers,
    activeUsers,
    activeToday,
    views,
    prevViews,
    viewSeries,
    devices,
    topPages,
    chatSessions,
    chatSeries,
    logins,
    categories,
    topContent,
    counts,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: since } }),
    User.countDocuments({ createdAt: { $gte: prevSince, $lt: since } }),
    User.countDocuments({ lastActiveAt: { $gte: since } }),
    User.countDocuments({ lastActiveAt: { $gte: new Date(now - DAY) } }),
    PageView.countDocuments({ createdAt: { $gte: since } }),
    PageView.countDocuments({ createdAt: { $gte: prevSince, $lt: since } }),
    PageView.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          views: { $sum: 1 },
          visitors: { $addToSet: "$visitorId" },
        },
      },
      { $project: { views: 1, visitors: { $size: "$visitors" } } },
    ]),
    PageView.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: "$device", count: { $sum: 1 } } }]),
    PageView.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$path", views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
      { $project: { views: 1, visitors: { $size: "$visitors" } } },
      { $sort: { views: -1 } },
      { $limit: 8 },
    ]),
    ChatSession.countDocuments({ updatedAt: { $gte: since } }),
    ChatSession.aggregate([
      { $unwind: "$messages" },
      { $match: { "messages.createdAt": { $gte: since }, "messages.from": "user" } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$messages.createdAt" } }, count: { $sum: 1 } } },
    ]),
    LoginHistory.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    popularCategories(),
    Content.find({ status: "published" })
      .sort({ views: -1 })
      .limit(5)
      .populate("category", "name")
      .select("title type views ratingAverage category"),
    Promise.all([
      Content.countDocuments({ type: "article", status: "published" }),
      Content.countDocuments({ type: { $ne: "article" }, status: "published" }),
      Character.countDocuments(),
      Merchandise.countDocuments(),
      Event.countDocuments({ date: { $gte: new Date().toISOString().slice(0, 10) } }),
      Submission.countDocuments({ status: "pending" }),
      Feedback.countDocuments({ status: { $ne: "resolved" } }),
      Bookmark.countDocuments(),
    ]),
  ]);

  const seriesMap = Object.fromEntries(viewSeries.map((d) => [d._id, d]));
  const chatMap = Object.fromEntries(chatSeries.map((d) => [d._id, d.count]));
  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const key = dayKey(now - i * DAY);
    series.push({
      date: key,
      views: seriesMap[key]?.views || 0,
      visitors: seriesMap[key]?.visitors || 0,
      chats: chatMap[key] || 0,
    });
  }

  const deviceTotal = devices.reduce((sum, d) => sum + d.count, 0);
  const loginMap = Object.fromEntries(logins.map((l) => [l._id, l.count]));

  return {
    days,
    users: {
      total: totalUsers,
      new: newUsers,
      newChange: percentChange(newUsers, prevNewUsers),
      active: activeUsers,
      activeToday,
    },
    pageViews: { total: views, change: percentChange(views, prevViews) },
    series,
    devices: ["desktop", "mobile", "tablet"].map((name) => {
      const count = devices.find((d) => d._id === name)?.count || 0;
      return { name, count, percent: deviceTotal ? Math.round((count / deviceTotal) * 1000) / 10 : 0 };
    }),
    topPages,
    chatbot: {
      sessions: chatSessions,
      messages: chatSeries.reduce((sum, d) => sum + d.count, 0),
    },
    logins: { success: loginMap.success || 0, failed: loginMap.failed || 0 },
    popularCategories: categories,
    topContent,
    counts: {
      articles: counts[0],
      media: counts[1],
      characters: counts[2],
      merchandise: counts[3],
      upcomingEvents: counts[4],
      pendingSubmissions: counts[5],
      openFeedback: counts[6],
      bookmarks: counts[7],
    },
  };
}

async function getRecentActivity(limit = 10) {
  const [users, submissions, feedback, content, chats] = await Promise.all([
    User.find().sort({ createdAt: -1 }).limit(5).select("name createdAt"),
    Submission.find().sort({ createdAt: -1 }).limit(5).populate("user", "name"),
    Feedback.find().sort({ createdAt: -1 }).limit(5).select("name type createdAt"),
    Content.find().sort({ createdAt: -1 }).limit(5).select("title type status createdAt"),
    ChatSession.find().sort({ updatedAt: -1 }).limit(5).select("title updatedAt"),
  ]);

  return [
    ...users.map((u) => ({ type: "user", title: "New member joined", text: u.name, date: u.createdAt, link: "/admin/users" })),
    ...submissions.map((s) => ({
      type: "submission",
      title: `Submission ${s.status}`,
      text: `"${s.title}" by ${s.user?.name || "a fan"}`,
      date: s.createdAt,
      link: "/admin/submissions",
    })),
    ...feedback.map((f) => ({ type: "feedback", title: `New ${f.type}`, text: `from ${f.name}`, date: f.createdAt, link: "/admin/feedback" })),
    ...content.map((c) => ({
      type: "content",
      title: `${c.type === "article" ? "Article" : "Media"} ${c.status}`,
      text: c.title,
      date: c.createdAt,
      link: c.type === "article" ? "/admin/articles" : "/admin/multimedia",
    })),
    ...chats.map((c) => ({ type: "chat", title: "Chatbot conversation", text: c.title, date: c.updatedAt, link: "/admin/ai" })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
}

module.exports = { detectDevice, getOverview, getRecentActivity, popularCategories };
