const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: "FanHub+" },
    supportEmail: { type: String, default: "support@fanhubplus.com" },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceUntil: { type: Date, default: null },
    maintenanceMessage: { type: String, default: "We'll be back soon!" },
    siteLock: { type: Boolean, default: false },
    chatbotEnabled: { type: Boolean, default: true },
    darkModeDefault: { type: Boolean, default: true },
    emailAlerts: { type: Boolean, default: true },
  },
  { timestamps: true }
);

settingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

module.exports = mongoose.model("Settings", settingsSchema);
