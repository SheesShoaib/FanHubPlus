const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const { maintenanceGuard } = require("./middleware/maintenanceMiddleware");

const app = express();

app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((o) => o.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"), { maxAge: "7d" }));

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/api", maintenanceGuard);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/content", require("./routes/contentRoutes"));
app.use("/api/articles", require("./routes/articleRoutes"));
app.use("/api/multimedia", require("./routes/multimediaRoutes"));
app.use("/api/characters", require("./routes/characterRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/merchandise", require("./routes/merchandiseRoutes"));
app.use("/api/releases", require("./routes/releaseRoutes"));
app.use("/api/bookmarks", require("./routes/bookmarkRoutes"));
app.use("/api/notes", require("./routes/noteRoutes"));
app.use("/api/ratings", require("./routes/ratingRoutes"));
app.use("/api/submissions", require("./routes/submissionRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));

app.get("/", (req, res) => {
  res.send("FanHub+ backend is running");
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
