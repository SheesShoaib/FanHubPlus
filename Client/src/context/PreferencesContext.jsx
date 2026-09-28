import { createContext, useCallback, useContext, useEffect, useState } from "react";

import api from "../services/api";
import { useAuth } from "./AuthContext";
import { useSettings } from "./SettingsContext";

const STORAGE_KEY = "fanhubplus_prefs";
export const FONT_SIZES = ["small", "medium", "large", "xlarge"];

const PreferencesContext = createContext(null);

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeLocal(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
  }
}

export function PreferencesProvider({ children }) {
  const { user, isAuthenticated, isAdmin, updateUser } = useAuth();
  const { settings, refresh } = useSettings();
  const [themeOverride, setThemeOverride] = useState(null);

  const [prefs, setPrefs] = useState(() => ({ fontSize: "medium", ...readLocal() }));

  useEffect(() => {
    if (user?.preferences) {
      setPrefs((current) => ({ ...current, ...user.preferences }));
    }
  }, [user?.preferences]);

  const theme = themeOverride || (settings.darkModeDefault === false ? "light" : "dark");
  const fontSize = FONT_SIZES.includes(prefs.fontSize) ? prefs.fontSize : "medium";

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.font = fontSize;
    root.dataset.compact = prefs.compactMode ? "true" : "false";
  }, [theme, fontSize, prefs.compactMode]);

  const setPreference = useCallback(
    (patch) => {
      setPrefs((current) => {
        const next = { ...current, ...patch };
        writeLocal(next);
        return next;
      });

      if (isAuthenticated) {
        api
          .put("/users/me", { preferences: patch })
          .then((saved) => updateUser({ preferences: saved.preferences }))
          .catch(() => {});
      }
    },
    [isAuthenticated, updateUser]
  );

  const toggleTheme = async () => {
    if (!isAdmin) return;
    const next = theme === "dark" ? "light" : "dark";
    setThemeOverride(next);
    try {
      await api.put("/settings", { darkModeDefault: next === "dark" });
      await refresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setThemeOverride(null);
    }
  };

  const stepFontSize = (direction) => {
    const index = FONT_SIZES.indexOf(fontSize) + direction;
    if (index >= 0 && index < FONT_SIZES.length) setPreference({ fontSize: FONT_SIZES[index] });
  };

  return (
    <PreferencesContext.Provider value={{ theme, fontSize, prefs, setPreference, toggleTheme, stepFontSize }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences must be used within a PreferencesProvider");
  return context;
}
