import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "leaflet/dist/leaflet.css";

import "./styles/global/variables.css";
import "./styles/global/global.css";
import "./styles/global/animations.css";
import "./styles/theme.css";

import App from "./App.jsx";
import "./styles/orange-ui.css";
import "./styles/features.css";
import "./styles/light-theme.css";
import "./styles/light-theme-fixes.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { PreferencesProvider } from "./context/PreferencesContext.jsx";
import { BreadcrumbProvider } from "./context/BreadcrumbContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <PreferencesProvider>
            <BreadcrumbProvider>
              <App />
            </BreadcrumbProvider>
          </PreferencesProvider>
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>
);
