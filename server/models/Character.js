const mongoose = require("mongoose");

const characterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    alias: { type: String, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    fandom: { type: String, default: "", trim: true },
    role: { type: String, default: "" },
    bio: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    power: { type: Number, default: 50 },
    intelligence: { type: Number, default: 50 },
    popularity: { type: Number, default: 50 },
    tags: { type: [String], default: [] },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Character", characterSchema);
