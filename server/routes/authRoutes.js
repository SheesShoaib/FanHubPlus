const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const LoginHistory = require("../models/LoginHistory");
const Settings = require("../models/Settings");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimitMiddleware");
const { generateAuthToken, createOneTimeToken, hashToken, generateOTP } = require("../utils/generateToken");
const { sendPasswordResetOTPEmail, sendVerificationEmail, isEmailConfigured } = require("../services/emailService");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CLIENT_URL = () => process.env.CLIENT_URL || "http://localhost:5173";
const canExposeDevLinks = () => process.env.NODE_ENV !== "production" && !isEmailConfigured();

function logLogin(req, user, email, status) {
  return LoginHistory.create({
    user: user?._id,
    name: user?.name || "",
    email: email || user?.email || "",
    role: user?.role || "user",
    status,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || "",
  });
}

async function issueVerification(user) {
  const { raw, hash } = createOneTimeToken();
  user.verifyToken = hash;
  user.verifyExpiry = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  const link = `${CLIENT_URL()}/verify-email?token=${raw}`;
  await sendVerificationEmail(user, link).catch((err) => console.error("Verification email failed:", err.message));
  return link;
}

router.post("/register", authLimiter, async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (settings?.siteLock) {
      return res.status(403).json({ msg: "Registration is currently disabled" });
    }

    const { name, password, favoriteFandom, favoriteFandoms } = req.body;
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!name?.trim() || !email || !password) {
      return res.status(400).json({ msg: "Name, email and password are required" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ msg: "Please enter a valid email address" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPwd = await bcrypt.hash(password, salt);

    const fandoms = Array.isArray(favoriteFandoms) ? favoriteFandoms : [];
    const newUser = new User({
      name: name.trim(),
      email,
      password: hashPwd,
      favoriteFandom: favoriteFandom || "Anime",
      favoriteFandoms: fandoms,
    });
    await newUser.save();

    const verifyLink = await issueVerification(newUser);
    await logLogin(req, newUser, email, "success");

    res.status(201).json({
      msg: "Registered successfully",
      token: generateAuthToken(newUser),
      user: newUser.toSafeJSON(),
      ...(canExposeDevLinks() ? { devVerifyLink: verifyLink } : {}),
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const { password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      await logLogin(req, null, email, "failed");
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    if (user.isBlocked) {
      await logLogin(req, user, email, "failed");
      return res.status(403).json({ msg: "Account blocked. Contact support.", blocked: true });
    }

    const isMatch = await bcrypt.compare(String(password || ""), user.password);
    if (!isMatch) {
      await logLogin(req, user, email, "failed");
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    await logLogin(req, user, email, "success");
    user.lastActiveAt = new Date();
    await user.save();

    res.json({
      msg: "Login successful",
      token: generateAuthToken(user),
      user: user.toSafeJSON(),
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ msg: "User not found" });
  res.json({ user: user.toSafeJSON() });
});

router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const user = await User.findOne({ email });

    const genericMsg = "If that email is registered, a reset code has been sent.";
    if (!user) return res.json({ msg: genericMsg });

    const otp = generateOTP();
    user.resetToken = hashToken(otp);
    user.resetExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendPasswordResetOTPEmail(user, otp);

    res.json({
      msg: genericMsg,
      ...(canExposeDevLinks() ? { devOTP: otp } : {}),
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post("/verify-reset-otp", authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim().toUpperCase();

    if (!email || !otp) {
      return res.status(400).json({ msg: "Email and OTP are required" });
    }

    const user = await User.findOne({
      email,
      resetToken: hashToken(otp),
      resetExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    const { raw, hash } = createOneTimeToken();
    user.resetToken = hash;
    user.resetExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    res.json({ msg: "OTP verified", resetToken: raw });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post("/reset-password", authLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) return res.status(400).json({ msg: "Reset link is missing its token" });
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ resetToken: hashToken(token), resetExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ msg: "This reset link is invalid or has expired" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = null;
    user.resetExpiry = null;
    user.isVerified = true;
    await user.save();

    res.json({ msg: "Password reset done. Login now." });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ msg: "Verification token missing" });

    const user = await User.findOne({ verifyToken: hashToken(token), verifyExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ msg: "This verification link is invalid or has expired" });

    user.isVerified = true;
    user.verifyToken = null;
    user.verifyExpiry = null;
    await user.save();

    res.json({ msg: "Email verified. Thanks!", user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post("/resend-verification", protect, authLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.isVerified) return res.json({ msg: "Your email is already verified" });

    const link = await issueVerification(user);
    res.json({
      msg: "Verification email sent",
      ...(canExposeDevLinks() ? { devVerifyLink: link } : {}),
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
