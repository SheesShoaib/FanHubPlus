import { useEffect, useRef, useState } from "react";
import { Moon, Sun, Type } from "lucide-react";

import { FONT_SIZES, usePreferences } from "../../context/PreferencesContext";

const SIZE_LABELS = { small: "Small", medium: "Default", large: "Large", xlarge: "Extra large" };

function AccessibilityControls({ showTheme = false }) {
  const { theme, fontSize, toggleTheme, setPreference } = usePreferences();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="fh-a11y" ref={wrapRef}>
      {showTheme && (
        <button
          type="button"
          className="nav-icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch the whole site to light mode" : "Switch the whole site to dark mode"}
          title={theme === "dark" ? "Light mode (whole site)" : "Dark mode (whole site)"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      )}

      <button
        type="button"
        className="nav-icon-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change text size"
        aria-expanded={open}
        title="Text size"
      >
        <Type size={18} />
      </button>

      {open && (
        <div className="fh-a11y-menu" role="menu">
          <p>Text size</p>
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              role="menuitemradio"
              aria-checked={fontSize === size}
              className={fontSize === size ? "active" : ""}
              onClick={() => {
                setPreference({ fontSize: size });
                setOpen(false);
              }}
            >
              <span className={`fh-a11y-sample size-${size}`}>A</span>
              {SIZE_LABELS[size]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default AccessibilityControls;
