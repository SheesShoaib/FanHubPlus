const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    type: { type: String, enum: ["bug", "suggestion", "query"], required: true },
    subject: { type: String, default: "" },
    message: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["open", "in-progress", "resolved"], default: "open" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
