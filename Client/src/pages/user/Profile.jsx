import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Save, Bell, Type, LayoutList, KeyRound, BadgeCheck, MailWarning, Sparkles } from "lucide-react";

import { CATEGORY_ICONS } from "../../components/home/CategoriesSection";
import api, { assetUrl } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { FONT_SIZES, usePreferences } from "../../context/PreferencesContext";

const FONT_LABELS = { small: "Small", medium: "Default", large: "Large", xlarge: "Extra large" };

function Toggle({ on, onClick, label }) {
  return (
    <button type="button" className={on ? "profile-switch on" : "profile-switch"} onClick={onClick} aria-pressed={on} aria-label={label}>
      <span />
    </button>
  );
}

function Profile() {
  const { user, updateUser } = useAuth();
  const { fontSize, prefs, setPreference } = usePreferences();
  const fileRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [favorites, setFavorites] = useState(user?.favoriteFandoms || []);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    api.get("/categories").then((cats) => setCategories(cats.filter((c) => c.status !== "inactive"))).catch(() => {});
    api
      .get("/users/me")
      .then((fresh) => {
        setName(fresh.name);
        setBio(fresh.bio || "");
        setFavorites(fresh.favoriteFandoms || []);
      })
      .catch(() => {});
  }, []);

  const toggleFandom = (slug) => {
    setFavorites((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: "", text: "" });
    try {
      const saved = await api.put("/users/me", { name, bio, favoriteFandoms: favorites });
      updateUser(saved);
      setStatus({ type: "ok", text: "Profile saved." });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setStatus({ type: "error", text: "Images must be 2 MB or smaller." });
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", file);
    setUploading(true);
    try {
      const res = await api.postForm("/users/upload", formData);
      updateUser(res.user);
      setStatus({ type: "ok", text: "Profile picture updated." });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      setPwStatus({ type: "error", text: "New passwords don't match." });
      return;
    }
    try {
      const res = await api.put("/users/me/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPwStatus({ type: "ok", text: res.msg });
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setPwStatus({ type: "error", text: err.message });
    }
  };

  return (
    <motion.div className="profile-page" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="dash-page-header">
        <h1>Profile</h1>
        <p>Manage your account details, favourite fandoms and display preferences.</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="dash-card">
          <div className="profile-avatar-row">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar-big">
                {user?.profilePicture ? (
                  <img src={assetUrl(user.profilePicture)} alt="Your avatar" />
                ) : name ? (
                  name.charAt(0).toUpperCase()
                ) : (
                  "F"
                )}
              </div>
              <button
                type="button"
                className="profile-avatar-edit"
                aria-label="Change avatar"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Camera size={14} />
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={handleAvatar} />
            </div>

            <div className="profile-basic-fields">
              <div className="dash-field">
                <label htmlFor="profile-name">Display name</label>
                <input id="profile-name" type="text" value={name} required onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>

              <div className="dash-field">
                <label htmlFor="profile-email">
                  Email{" "}
                  {user?.isVerified ? (
                    <span className="fh-verified">
                      <BadgeCheck size={13} /> verified
                    </span>
                  ) : (
                    <span className="fh-unverified">
                      <MailWarning size={13} /> not verified
                    </span>
                  )}
                </label>
                <input id="profile-email" type="email" value={user?.email || ""} disabled />
              </div>
            </div>
          </div>

          <div className="dash-field">
            <label htmlFor="profile-bio">Bio</label>
            <textarea id="profile-bio" rows={3} maxLength={300} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell other fans what you're into" />
            <small className="fh-muted">{bio.length}/300</small>
          </div>
        </div>

        <div className="dash-card">
          <h3>Favourite fandoms</h3>
          <p className="dash-card-subtext">These shape your dashboard recommendations and the assistant's suggestions.</p>

          <div className="profile-fandom-grid">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] || Sparkles;
              const active = favorites.includes(cat.slug);
              return (
                <button
                  key={cat._id}
                  type="button"
                  aria-pressed={active}
                  className={active ? "profile-fandom-chip active" : "profile-fandom-chip"}
                  onClick={() => toggleFandom(cat.slug)}
                >
                  <Icon size={16} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="dash-card">
          <h3>Display preferences</h3>
          <p className="dash-card-subtext">Saved to your account instantly and applied on every device you log in from.</p>

          <div className="profile-toggle-row">
            <div>
              <strong>
                <Type size={15} />
                Text size
              </strong>
              <span>Make text easier to read across the site.</span>
            </div>
            <select value={fontSize} onChange={(e) => setPreference({ fontSize: e.target.value })} aria-label="Text size">
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {FONT_LABELS[size]}
                </option>
              ))}
            </select>
          </div>

          <div className="profile-toggle-row">
            <div>
              <strong>
                <LayoutList size={15} />
                Compact mode
              </strong>
              <span>Tighter spacing so more fits on screen.</span>
            </div>
            <Toggle on={Boolean(prefs.compactMode)} label="Compact mode" onClick={() => setPreference({ compactMode: !prefs.compactMode })} />
          </div>

          <div className="profile-toggle-row">
            <div>
              <strong>
                <Bell size={15} />
                Email notifications
              </strong>
              <span>Hear about submission reviews, events and new drops.</span>
            </div>
            <Toggle
              on={prefs.emailNotifications !== false}
              label="Email notifications"
              onClick={() => setPreference({ emailNotifications: prefs.emailNotifications === false })}
            />
          </div>
        </div>

        {status.text && <p className={status.type === "ok" ? "fh-inline-ok" : "fh-inline-error"}>{status.text}</p>}

        <button type="submit" className="dash-save-btn" disabled={saving}>
          <Save size={16} />
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>

      <form className="dash-card fh-password-card" onSubmit={handlePassword}>
        <h3>
          <KeyRound size={16} /> Change password
        </h3>
        <div className="fh-form-grid">
          <div className="dash-field">
            <label htmlFor="pw-current">Current password</label>
            <input id="pw-current" type="password" required autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <div className="dash-field">
            <label htmlFor="pw-new">New password</label>
            <input id="pw-new" type="password" required minLength={6} autoComplete="new-password" value={passwords.newPassword} onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))} />
          </div>
          <div className="dash-field">
            <label htmlFor="pw-confirm">Confirm new password</label>
            <input id="pw-confirm" type="password" required minLength={6} autoComplete="new-password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} />
          </div>
        </div>
        {pwStatus.text && <p className={pwStatus.type === "ok" ? "fh-inline-ok" : "fh-inline-error"}>{pwStatus.text}</p>}
        <button type="submit" className="dash-save-btn">
          Update password
        </button>
      </form>
    </motion.div>
  );
}

export default Profile;
