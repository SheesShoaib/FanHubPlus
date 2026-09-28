const mongoose = require("mongoose");

const preferencesSchema = new mongoose.Schema(
  {
    theme: { type: String, enum: ["dark", "light"], default: "dark" },
    fontSize: { type: String, enum: ["small", "medium", "large", "xlarge"], default: "medium" },
    compactMode: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    bio: { type: String, default: "" },
    favoriteFandom: { type: String, default: "Anime" },
    favoriteFandoms: { type: [String], default: [] },
    preferences: { type: preferencesSchema, default: () => ({}) },
    profilePicture: { type: String, default: "" },
    isBlocked: { type: Boolean, default: false },
    blockedReason: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    verifyToken: { type: String, default: null },
    verifyExpiry: { type: Date, default: null },
    resetToken: { type: String, default: null },
    resetExpiry: { type: Date, default: null },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    bio: this.bio,
    favoriteFandom: this.favoriteFandom,
    favoriteFandoms: this.favoriteFandoms,
    preferences: this.preferences,
    profilePicture: this.profilePicture,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
