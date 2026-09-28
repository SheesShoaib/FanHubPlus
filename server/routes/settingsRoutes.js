const express = require("express");
const Settings = require("../models/Settings");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { clearSettingsCache } = require("../middleware/maintenanceMiddleware");

const router = express.Router();

const BOOLEAN_FIELDS = ["siteLock", "chatbotEnabled", "darkModeDefault", "emailAlerts"];
const TEXT_FIELDS = ["siteName", "supportEmail", "maintenanceMessage"];

router.get("/public", async (req, res) => {
  try {
    const s = await Settings.getSingleton();
    res.json({
      siteName: s.siteName,
      supportEmail: s.supportEmail,
      maintenanceMode: s.maintenanceMode,
      maintenanceUntil: s.maintenanceUntil,
      maintenanceMessage: s.maintenanceMessage,
      registrationOpen: !s.siteLock,
      chatbotEnabled: s.chatbotEnabled,
      darkModeDefault: s.darkModeDefault,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    res.json(await Settings.getSingleton());
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/", protect, adminOnly, async (req, res) => {
  try {
    const settings = await Settings.getSingleton();

    if (req.body.maintenanceAction !== undefined) {
      const { maintenanceAction, maintenanceDurationMinutes } = req.body;
      if (maintenanceAction === "start" || maintenanceAction === "reset") {
        const duration = Number(maintenanceDurationMinutes);
        if (!Number.isInteger(duration) || duration < 1 || duration > 10080) {
          return res.status(400).json({ msg: "Maintenance duration must be from 1 to 10080 minutes" });
        }
        settings.maintenanceMode = true;
        settings.maintenanceUntil = new Date(Date.now() + duration * 60 * 1000);
      } else if (maintenanceAction === "stop") {
        settings.maintenanceMode = false;
        settings.maintenanceUntil = null;
      } else {
        return res.status(400).json({ msg: "Invalid maintenance action" });
      }
    }

    BOOLEAN_FIELDS.forEach((key) => {
      if (typeof req.body[key] === "boolean") settings[key] = req.body[key];
    });
    TEXT_FIELDS.forEach((key) => {
      if (typeof req.body[key] === "string") settings[key] = req.body[key].trim();
    });

    await settings.save();
    clearSettingsCache();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
