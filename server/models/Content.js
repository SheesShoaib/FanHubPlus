const mongoose = require("mongoose");

const CONTENT_TYPES = ["article", "video", "trailer", "audio", "image", "explainer"];
const MEDIA_TYPES = ["video", "trailer", "audio", "image", "explainer"];

const timelineSchema = new mongoose.Schema(
  {
    date: { type: String, default: "" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const contentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    type: { type: String, enum: CONTENT_TYPES, default: "article" },
    description: { type: String, default: "" },
    body: { type: String, default: "" },
    timeline: { type: [timelineSchema], default: [] },
    author: { type: String, default: "" },
    fandom: { type: String, default: "", trim: true },
    genre: { type: String, default: "", trim: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "review", "published"], default: "draft" },
    featured: { type: Boolean, default: false },
    imageUrl: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },
    duration: { type: String, default: "" },
    releaseDate: { type: Date, default: Date.now },
    popularityScore: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

contentSchema.statics.CONTENT_TYPES = CONTENT_TYPES;
contentSchema.statics.MEDIA_TYPES = MEDIA_TYPES;

module.exports = mongoose.model("Content", contentSchema);
