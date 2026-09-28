const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNote: { type: String, default: "" },
    publishedContent: { type: mongoose.Schema.Types.ObjectId, ref: "Content", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
