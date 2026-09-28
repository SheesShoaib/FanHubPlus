const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, default: "" },
    email: { type: String, required: true },
    role: { type: String, default: "user" },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    status: { type: String, enum: ["success", "failed"], default: "success" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoginHistory", loginHistorySchema);