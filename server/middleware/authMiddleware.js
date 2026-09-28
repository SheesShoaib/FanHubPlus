const jwt = require("jsonwebtoken");
const User = require("../models/User");

const ACTIVE_TOUCH_MS = 5 * 60 * 1000;

function readToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.split(" ")[1];
}

function touchActivity(user) {
  if (!user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > ACTIVE_TOUCH_MS) {
    User.updateOne({ _id: user._id }, { lastActiveAt: new Date() }).catch(() => {});
  }
}

const protect = async (req, res, next) => {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ msg: "Please log in to continue" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ msg: "User not found" });

    if (user.isBlocked) {
      return res.status(403).json({ msg: "Account blocked", blocked: true });
    }

    touchActivity(user);
    req.user = { id: user._id.toString(), role: user.role, name: user.name, email: user.email };
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Session expired, please log in again" });
  }
};

const optionalAuth = async (req, res, next) => {
  const token = readToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && !user.isBlocked) {
      touchActivity(user);
      req.user = { id: user._id.toString(), role: user.role, name: user.name, email: user.email };
    }
  } catch (err) {
  }
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ msg: "Admin only" });
  }
};

module.exports = { protect, optionalAuth, adminOnly };
