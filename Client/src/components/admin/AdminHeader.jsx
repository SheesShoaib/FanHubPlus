import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";

import ConfirmDialog from "../common/ConfirmDialog";
import AccessibilityControls from "../common/AccessibilityControls";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const SEARCH_ITEMS = [
  { label: "Dashboard", path: "/admin", keywords: "dashboard home overview" },
  { label: "Analytics", path: "/admin/analytics", keywords: "analytics reports growth stats" },
  { label: "Users", path: "/admin/users", keywords: "users members accounts" },
  { label: "Submissions", path: "/admin/submissions", keywords: "submissions uploads" },
  { label: "Feedback", path: "/admin/feedback", keywords: "feedback messages reviews" },
  { label: "Content Hub", path: "/admin/content", keywords: "content hub library" },
  { label: "Articles", path: "/admin/articles", keywords: "articles stories posts" },
  { label: "Categories", path: "/admin/categories", keywords: "categories fandom genres" },
  { label: "Characters", path: "/admin/characters", keywords: "characters people" },
  { label: "Multimedia", path: "/admin/multimedia", keywords: "multimedia video audio media" },
  { label: "Manage AI", path: "/admin/ai", keywords: "ai chatbot faq" },
  { label: "Events", path: "/admin/events", keywords: "events calendar" },
  { label: "Merchandise", path: "/admin/merchandise", keywords: "shop products merchandise" },
  { label: "Upcoming Releases", path: "/admin/releases", keywords: "releases upcoming drops launch" },
  { label: "Settings", path: "/admin/settings", keywords: "settings configuration preferences" },
];

function AdminHeader({ setMenuOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const notifyRef = useRef(null);

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [pending, setPending] = useState({ pendingSubmissions: 0, openFeedback: 0 });
  const pendingTotal = pending.pendingSubmissions + pending.openFeedback;

  useEffect(() => {
    api.get("/analytics/pending").then(setPending).catch(() => {});
    setNotifyOpen(false);
  }, [location.pathname]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_ITEMS.filter((item) =>
      `${item.label} ${item.keywords}`.toLowerCase().includes(q)
    ).slice(0, 7);
  }, [search]);

  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }

      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setNotifyOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const goToSearchResult = (item) => {
    setSearch("");
    setSearchOpen(false);
    navigate(item.path);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      setSearchOpen(false);
      return;
    }
    if (event.key === "Enter" && results[0]) {
      goToSearchResult(results[0]);
    }
  };

  const handleLogoutConfirmed = () => {
    setConfirmOpen(false);
    logout();
    navigate("/login");
  };

  const goToSettings = () => {
    setProfileOpen(false);
    navigate("/admin/settings");
  };

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button type="button" className="mobile-menu-btn" onClick={() => setMenuOpen(true)}>
          <Menu size={19} />
        </button>

        <div className="admin-search-wrap" ref={searchRef}>
          <div className="admin-search">
            <Search size={17} />
            <input
              type="text"
              placeholder="Search admin panel..."
              value={search}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
              aria-label="Search admin panel"
            />
          </div>

          {searchOpen && search.trim() && (
            <div className="admin-search-results">
              {results.length ? (
                results.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    className="admin-search-result"
                    onClick={() => goToSearchResult(item)}
                  >
                    <Search size={14} />
                    <span>{item.label}</span>
                    <small>{item.path.replace("/admin", "") || "/"}</small>
                  </button>
                ))
              ) : (
                <div className="admin-search-empty">No admin page found</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="admin-header-right">
        <div className="system-status"><span /> system online</div>
        <AccessibilityControls showTheme />

        <div className="fh-notify-wrap" ref={notifyRef}>
          <button
            type="button"
            className="notification-btn"
            aria-label={`Notifications: ${pendingTotal} items need review`}
            aria-expanded={notifyOpen}
            onClick={() => setNotifyOpen((v) => !v)}
          >
            <Bell size={18} />
            {pendingTotal > 0 && <span className="notification-count">{pendingTotal}</span>}
          </button>

          {notifyOpen && (
            <div className="profile-dropdown fh-notify-menu">
              <button type="button" onClick={() => { setNotifyOpen(false); navigate("/admin/submissions"); }}>
                {pending.pendingSubmissions} submission{pending.pendingSubmissions === 1 ? "" : "s"} awaiting review
              </button>
              <button type="button" onClick={() => { setNotifyOpen(false); navigate("/admin/feedback"); }}>
                {pending.openFeedback} open feedback item{pending.openFeedback === 1 ? "" : "s"}
              </button>
            </div>
          )}
        </div>

        <div className="admin-profile" ref={profileRef}>
          <button
            type="button"
            className="profile-btn"
            onClick={() => setProfileOpen((value) => !value)}
            aria-expanded={profileOpen}
          >
            <span className="profile-avatar">{(user?.name || "AD").slice(0, 2).toUpperCase()}</span>
            <div className="profile-text">
              <strong>{user?.name || "admin"}</strong>
              <small>administrator</small>
            </div>
            <ChevronDown size={15} />
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-user">
                <strong>{user?.name || "FanHub admin"}</strong>
                <span>{user?.email || "admin@fanhub.com"}</span>
              </div>
              <button type="button" onClick={goToSettings}>My profile</button>
              <button type="button" onClick={goToSettings}>Settings</button>
              <div className="dropdown-line" />
              <button
                type="button"
                className="logout-btn"
                onClick={() => {
                  setProfileOpen(false);
                  setConfirmOpen(true);
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Log out of the admin panel?"
        message="You'll need to sign in again to manage content, users, and settings."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        danger
        onConfirm={handleLogoutConfirmed}
        onCancel={() => setConfirmOpen(false)}
      />
    </header>
  );
}

export default AdminHeader;
