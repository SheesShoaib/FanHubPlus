const mongoose = require("mongoose");

const EVENT_TYPES = ["Convention", "Meetup", "Screening", "Premiere", "Release", "Concert", "Tournament", "Other"];

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    eventType: { type: String, enum: EVENT_TYPES, default: "Convention" },
    date: { type: String, required: true },
    time: { type: String, default: "" },
    venue: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "", trim: true },
    country: { type: String, default: "", trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    ticketUrl: { type: String, default: "" },
    description: { type: String, default: "" },
    highlight: { type: String, default: "" },
    capacity: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

eventSchema.statics.EVENT_TYPES = EVENT_TYPES;

module.exports = mongoose.model("Event", eventSchema);
