const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    from: { type: String, enum: ["user", "bot"], required: true },
    text: { type: String, required: true },
    links: { type: [{ label: String, to: String, _id: false }], default: [] },
    suggestions: { type: [String], default: [] },
    intent: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const chatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestId: { type: String, default: "" },
    title: { type: String, default: "New conversation" },
    messages: { type: [messageSchema], default: [] },
    onboardingStep: { type: Number, default: -1 },
    onboardingCompleted: { type: Boolean, default: false },
    lastCategory: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatSession", chatSessionSchema);
