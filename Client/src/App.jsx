import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes";
import ChatWidget from "./components/chat/ChatWidget";
import MaintenanceScreen from "./components/layout/MaintenanceScreen";
import Loader from "./components/common/Loader";
import api, { getVisitorId } from "./services/api";
import { useAuth } from "./context/AuthContext";
import { useSettings } from "./context/SettingsContext";

function usePageTracking() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (pathname.startsWith("/admin")) return;
    api.post("/analytics/track", { path: pathname, visitorId: getVisitorId() }).catch(() => {});
  }, [pathname]);
}

function App() {
  const { pathname } = useLocation();
  const { isAdmin, loading } = useAuth();
  const { settings, loaded: settingsLoaded } = useSettings();

  usePageTracking();

  const inAdmin = pathname.startsWith("/admin");

  if (!settingsLoaded || loading) {
    return <Loader label="Loading..." fullPage />;
  }

  if (settings.maintenanceMode && !isAdmin && pathname !== "/login") {
    return (
      <MaintenanceScreen
        message={settings.maintenanceMessage}
        siteName={settings.siteName}
        maintenanceUntil={settings.maintenanceUntil}
      />
    );
  }

  return (
    <>
      <AppRoutes />
      {!inAdmin && <ChatWidget />}
    </>
  );
}

export default App;
