const mongoose = require("mongoose");

const RELEASE_TYPES = ["Anime", "Game", "Movie", "TV Show", "Comic", "Manga", "K-Pop", "Merchandise"];

const releaseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    releaseType: { type: String, enum: RELEASE_TYPES, default: "Anime" },
    fandom: { type: String, default: "", trim: true },
    releaseDate: { type: Date, required: true },
    platform: { type: String, default: "" },
    tag: { type: String, default: "" },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

releaseSchema.statics.RELEASE_TYPES = RELEASE_TYPES;

module.exports = mongoose.model("Release", releaseSchema);
