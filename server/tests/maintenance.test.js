const assert = require("node:assert/strict");
const express = require("express");
const test = require("node:test");
const jwt = require("jsonwebtoken");
const Settings = require("../models/Settings");
const { clearSettingsCache, getSettings, maintenanceGuard } = require("../middleware/maintenanceMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

process.env.JWT_SECRET ||= "maintenance-test-secret";

const originalGetSingleton = Settings.getSingleton;
const originalProtect = authMiddleware.protect;
const originalAdminOnly = authMiddleware.adminOnly;
authMiddleware.protect = (req, res, next) => {
  req.user = { id: "test-admin", role: "admin" };
  next();
};
authMiddleware.adminOnly = (req, res, next) => next();
const settingsRouter = require("../routes/settingsRoutes");
let routeServer;
let routeBase;

function mockSettings({ maintenanceMode = true, maintenanceUntil = null } = {}) {
  return {
    siteName: "FanHub+",
    supportEmail: "support@example.invalid",
    maintenanceMode,
    maintenanceUntil,
    maintenanceMessage: "Maintenance test",
    siteLock: false,
    chatbotEnabled: true,
    darkModeDefault: true,
    emailAlerts: true,
    saved: false,
    async save() {
      this.saved = true;
    },
  };
}

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function runGuard(path, authorization) {
  const req = { path, headers: authorization ? { authorization } : {} };
  const res = mockResponse();
  let continued = false;
  await maintenanceGuard(req, res, () => {
    continued = true;
  });
  return { continued, res };
}

test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use(settingsRouter);
  routeServer = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => routeServer.once("listening", resolve));
  routeBase = `http://127.0.0.1:${routeServer.address().port}`;
});

test.afterEach(() => {
  Settings.getSingleton = originalGetSingleton;
  clearSettingsCache();
});

test.after(async () => {
  routeServer.closeAllConnections();
  await new Promise((resolve, reject) => routeServer.close((error) => (error ? reject(error) : resolve())));
  authMiddleware.protect = originalProtect;
  authMiddleware.adminOnly = originalAdminOnly;
});

test("blocks visitor API requests during maintenance", async () => {
  Settings.getSingleton = async () => mockSettings();
  clearSettingsCache();

  const { continued, res } = await runGuard("/articles");

  assert.equal(continued, false);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.maintenance, true);
});

test("keeps admin login, session validation, and public settings open", async () => {
  Settings.getSingleton = async () => mockSettings();
  clearSettingsCache();

  for (const path of ["/auth/login", "/auth/me", "/settings/public"]) {
    const { continued, res } = await runGuard(path);
    assert.equal(continued, true, `${path} should bypass maintenance`);
    assert.equal(res.statusCode, 200);
  }
});

test("allows an admin through the maintenance guard", async () => {
  Settings.getSingleton = async () => mockSettings();
  clearSettingsCache();
  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET);

  const { continued, res } = await runGuard("/settings", `Bearer ${token}`);

  assert.equal(continued, true);
  assert.equal(res.statusCode, 200);
});

test("automatically disables maintenance after its deadline", async () => {
  const settings = mockSettings({ maintenanceUntil: new Date(Date.now() - 1000) });
  Settings.getSingleton = async () => settings;
  clearSettingsCache();

  const result = await getSettings();

  assert.equal(result.maintenanceMode, false);
  assert.equal(result.maintenanceUntil, null);
  assert.equal(settings.saved, true);
});

test("starts, resets, and stops timed maintenance through the settings API", async () => {
  const settings = mockSettings({ maintenanceMode: false });
  Settings.getSingleton = async () => settings;
  const update = (body) => fetch(`${routeBase}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const startedResponse = await update({ maintenanceAction: "start", maintenanceDurationMinutes: 2 });
  assert.equal(startedResponse.status, 200);
  const started = await startedResponse.json();
  assert.equal(started.maintenanceMode, true);
  const firstDeadline = new Date(started.maintenanceUntil).getTime();
  assert.ok(firstDeadline > Date.now());

  const resetResponse = await update({ maintenanceAction: "reset", maintenanceDurationMinutes: 5 });
  assert.equal(resetResponse.status, 200);
  const reset = await resetResponse.json();
  assert.ok(new Date(reset.maintenanceUntil).getTime() > firstDeadline);

  const stoppedResponse = await update({ maintenanceAction: "stop" });
  assert.equal(stoppedResponse.status, 200);
  const stopped = await stoppedResponse.json();
  assert.equal(stopped.maintenanceMode, false);
  assert.equal(stopped.maintenanceUntil, null);
});

test("rejects invalid maintenance durations", async () => {
  const settings = mockSettings({ maintenanceMode: false });
  Settings.getSingleton = async () => settings;

  const response = await fetch(`${routeBase}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ maintenanceAction: "start", maintenanceDurationMinutes: 0 }),
  });

  assert.equal(response.status, 400);
  assert.equal(settings.maintenanceMode, false);
  assert.equal(settings.saved, false);
});