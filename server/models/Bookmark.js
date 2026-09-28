const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    itemType: {
      type: String,
      enum: ["Content", "Character", "Event", "Merchandise"],
      required: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "itemType",
    },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bookmark", bookmarkSchema);