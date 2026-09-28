const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    category: { type: String, default: "General" },
    keywords: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    hits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Faq", faqSchema);
