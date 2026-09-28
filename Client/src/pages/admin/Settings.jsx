import { useEffect, useState } from "react";
import { Save, Bot, Bell, ShieldAlert, Palette, UserPlus, RotateCcw, Power } from "lucide-react";

import Loader from "../../components/common/Loader";
import api from "../../services/api";
import { useSettings } from "../../context/SettingsContext";
import "../../styles/admin/manager-shared.css";
import "../../styles/admin/settings.css";

const TOGGLES = [
  { key: "siteLock", icon: UserPlus, title: "Close registration", text: "Stop new accounts from being created. Existing users can still log in." },
  { key: "chatbotEnabled", icon: Bot, title: "AI chatbot", text: "Show the assistant bubble on public and member pages." },
  { key: "darkModeDefault", icon: Palette, title: "Dark theme", text: "On: the whole site uses the dark theme. Off: light theme for everyone. You can also switch it with the sun/moon button in the admin header." },
  { key: "emailAlerts", icon: Bell, title: "Email alerts", text: "Notify admins about new feedback and submissions (requires SMTP settings on the server)." },
];

function Settings() {
  const { refresh } = useSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get("/settings")
      .then(setForm)
      .catch((err) => setMessage(err.message));
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const saved = await api.put("/settings", form);
      setForm(saved);
      refresh();
      setMessage("Settings saved.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenance = async (maintenanceAction) => {
    setMaintenanceSaving(true);
    setMessage("");
    try {
      const saved = await api.put("/settings", {
        maintenanceAction,
        maintenanceDurationMinutes: Number(durationMinutes),
      });
      setForm(saved);
      await refresh();
      setMessage(
        maintenanceAction === "stop"
          ? "Maintenance ended. The website is open to everyone."
          : maintenanceAction === "reset"
            ? "Maintenance timer reset."
            : "Maintenance started."
      );
    } catch (err) {
      setMessage(err.message);
    } finally {
      setMaintenanceSaving(false);
    }
  };

  if (!form) return <Loader label="Loading settings..." />;

  return (
    <div className="manager-page">
      <div className="manager-page-top">
        <div>
          <p className="manager-label">system</p>
          <h1>Settings</h1>
          <p className="manager-subtitle">General site configuration. Changes apply to all visitors immediately.</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="settings-card">
          <h3>Site information</h3>

          <div className="manager-form-row">
            <div className="manager-form-group">
              <label htmlFor="site-name">Site name</label>
              <input id="site-name" type="text" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
            </div>

            <div className="manager-form-group">
              <label htmlFor="support-email">Support email</label>
              <input id="support-email" type="email" value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
            </div>
          </div>

          <div className="manager-form-group">
            <label htmlFor="maintenance-msg">Maintenance message</label>
            <input
              id="maintenance-msg"
              type="text"
              value={form.maintenanceMessage}
              onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
            />
          </div>
        </div>

        <div className="settings-card maintenance-settings-card">
          <h3><ShieldAlert size={17} /> Maintenance mode</h3>
          <p className="maintenance-settings-description">
            Visitors will see the maintenance screen and API requests will be paused. Admins can continue using the site.
          </p>

          <div className="maintenance-settings-status">
            <strong className={form.maintenanceMode ? "is-active" : ""}>
              {form.maintenanceMode ? "Active for visitors" : "Website is open"}
            </strong>
            {form.maintenanceMode && form.maintenanceUntil && (
              <span>Scheduled to reopen: {new Date(form.maintenanceUntil).toLocaleString()}</span>
            )}
          </div>

          <div className="maintenance-settings-controls">
            <div className="manager-form-group">
              <label htmlFor="maintenance-duration">Duration (minutes)</label>
              <input
                id="maintenance-duration"
                type="number"
                min="1"
                max="10080"
                step="1"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
              />
              <small>Choose 1 to 10080 minutes. Resetting starts this duration again.</small>
            </div>

            <div className="maintenance-settings-actions">
              {!form.maintenanceMode ? (
                <button type="button" className="manager-save-btn settings-save-btn" onClick={() => handleMaintenance("start")} disabled={maintenanceSaving}>
                  <ShieldAlert size={16} />
                  {maintenanceSaving ? "Starting..." : "Start maintenance"}
                </button>
              ) : (
                <>
                  <button type="button" className="manager-save-btn settings-save-btn" onClick={() => handleMaintenance("reset")} disabled={maintenanceSaving}>
                    <RotateCcw size={16} />
                    {maintenanceSaving ? "Updating..." : "Reset timer"}
                  </button>
                  <button type="button" className="maintenance-end-btn" onClick={() => handleMaintenance("stop")} disabled={maintenanceSaving}>
                    <Power size={16} />
                    End maintenance
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h3>Platform toggles</h3>

          {TOGGLES.map(({ key, icon: Icon, title, text }) => (
            <div className="settings-toggle-row" key={key}>
              <div>
                <strong>
                  <Icon size={15} />
                  {title}
                </strong>
                <span>{text}</span>
              </div>
              <button
                type="button"
                className={form[key] ? "settings-switch on" : "settings-switch"}
                onClick={() => setForm((current) => ({ ...current, [key]: !current[key] }))}
                aria-pressed={Boolean(form[key])}
                aria-label={title}
              >
                <span />
              </button>
            </div>
          ))}
        </div>

        {message && <p className={message === "Settings saved." ? "fh-inline-ok" : "fh-inline-error"}>{message}</p>}

        <button type="submit" className="manager-save-btn settings-save-btn" disabled={saving}>
          <Save size={16} />
          {saving ? "Saving..." : "Save settings"}
        </button>
      </form>
    </div>
  );
}

export default Settings;
