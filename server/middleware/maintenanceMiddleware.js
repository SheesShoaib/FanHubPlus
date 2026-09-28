const jwt = require("jsonwebtoken");
const Settings = require("../models/Settings");

const CACHE_MS = 10 * 1000;
let cached = null;
let cachedAt = 0;

async function getSettings() {
  if (!cached || Date.now() - cachedAt > CACHE_MS) {
    cached = await Settings.getSingleton();
    if (cached.maintenanceMode && cached.maintenanceUntil && cached.maintenanceUntil.getTime() <= Date.now()) {
      cached.maintenanceMode = false;
      cached.maintenanceUntil = null;
      await cached.save();
    }
    cachedAt = Date.now();
  }
  return cached;
}

function clearSettingsCache() {
  cached = null;
}

const ALWAYS_OPEN = ["/auth/login", "/auth/me", "/settings/public"];

async function maintenanceGuard(req, res, next) {
  try {
    const settings = await getSettings();
    if (!settings.maintenanceMode || ALWAYS_OPEN.includes(req.path)) {
      return next();
    }

    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      try {
        const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
        if (decoded.role === "admin") return next();
      } catch (err) {
      }
    }

    return res.status(503).json({ msg: settings.maintenanceMessage, maintenance: true });
  } catch (err) {
    next();
  }
}

module.exports = { maintenanceGuard, getSettings, clearSettingsCache };
