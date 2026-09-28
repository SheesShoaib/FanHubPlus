const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function generateAuthToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function createOneTimeToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

function generateOTP() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(6);
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += chars[bytes[i] % chars.length];
  }
  return otp;
}

module.exports = { generateAuthToken, createOneTimeToken, hashToken, generateOTP };
