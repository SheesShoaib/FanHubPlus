const mongoose = require("mongoose");

const pageViewSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    visitorId: { type: String, default: "" },
    device: { type: String, enum: ["desktop", "mobile", "tablet"], default: "desktop" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

pageViewSchema.index({ createdAt: -1 });

module.exports = mongoose.model("PageView", pageViewSchema);
