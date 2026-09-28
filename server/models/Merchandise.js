const mongoose = require("mongoose");

const merchandiseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    fandom: { type: String, default: "", trim: true },
    productType: { type: String, default: "Apparel" },
    price: { type: Number, default: 0 },
    oldPrice: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5 },
    reviews: { type: Number, default: 0 },
    tag: { type: String, default: "" },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    isUpcoming: { type: Boolean, default: false },
    releaseDate: { type: Date, default: null },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Merchandise", merchandiseSchema);
