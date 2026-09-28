import { createContext, useContext, useEffect, useState } from "react";

import api from "../services/api";

const DEFAULTS = {
  siteName: "FanHub+",
  supportEmail: "support@fanhubplus.com",
  maintenanceMode: false,
  maintenanceMessage: "",
  registrationOpen: true,
  chatbotEnabled: true,
  darkModeDefault: true,
};

const SettingsContext = createContext({ settings: DEFAULTS, loaded: false, refresh: () => {} });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  const refresh = () =>
    api
      .get("/settings/public")
      .then((data) => setSettings({ ...DEFAULTS, ...data }))
      .catch(() => {})
      .finally(() => setLoaded(true));

  useEffect(() => {
    refresh();

    const onMaintenance = (event) =>
      setSettings((current) => ({
        ...current,
        maintenanceMode: true,
        maintenanceMessage: event.detail || current.maintenanceMessage,
      }));

    window.addEventListener("fanhub:maintenance", onMaintenance);
    return () => window.removeEventListener("fanhub:maintenance", onMaintenance);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      api
        .get("/settings/public")
        .then((data) => setSettings({ ...DEFAULTS, ...data }))
        .catch(() => {});
    }, 10000);

    return () => window.clearInterval(timer);
  }, []);

  return <SettingsContext.Provider value={{ settings, loaded, refresh }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
