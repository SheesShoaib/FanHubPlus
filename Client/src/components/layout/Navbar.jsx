import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  UserRound,
  X,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api, { assetUrl } from "../../services/api";
import AccessibilityControls from "../common/AccessibilityControls";
import NotificationBell from "./NotificationBell";
import "../../styles/components/navbar.css";

const KIND_LABELS = {
  article: "Story",
  media: "Media",
  character: "Character",
  merchandise: "Shop",
  event: "Event",
};

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 25);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && searchOpen) closeSearch();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = searchOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [searchOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate("/login");
  };

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 60);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
    setSuggestions([]);
    setSearchLoading(false);
    clearTimeout(debounceRef.current);
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);

    if (!val.trim()) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.get(
          `/content/explore?q=${encodeURIComponent(val.trim())}&limit=6`
        );
        setSuggestions(data.results || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    closeSearch();
    navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSuggestionClick = (item) => {
    closeSearch();
    navigate(item.link);
  };

  const clearQuery = () => {
    setQuery("");
    setSuggestions([]);
    searchInputRef.current?.focus();
  };

  return (
    <>
      <header className={`main-navbar ${scrolled ? "navbar-scrolled" : ""}`}>
        <div className="site-container navbar-inner">

          <Link
            className="fanhub-navbar-logo"
            to="/"
            onClick={closeMenu}
            aria-label="Fan Hub Plus Home"
          >
            <div className="fanhub-logo-mark">
              <span className="fanhub-logo-f">F</span>
              <span className="fanhub-logo-divider"></span>
              <span className="fanhub-logo-h">H</span>
            </div>
            <div className="fanhub-logo-name">
              <strong>FAN HUB</strong>
              <span>PLUS</span>
            </div>
          </Link>

          <nav
            ref={menuRef}
            className={`nav-links ${menuOpen ? "nav-open" : ""}`}
          >
            <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
            <NavLink to="/explore" onClick={closeMenu}>Explore</NavLink>
            <NavLink to="/characters" onClick={closeMenu}>Characters</NavLink>
            <NavLink to="/stories" onClick={closeMenu}>Stories</NavLink>
            <NavLink to="/events" onClick={closeMenu}>Events</NavLink>
            <NavLink to="/multimedia" onClick={closeMenu}>Media</NavLink>
            <NavLink to="/shop" onClick={closeMenu}>Shop</NavLink>
            <NavLink to="/about" onClick={closeMenu}>About</NavLink>

            {!isAuthenticated && (
              <Link to="/register" className="mobile-join-btn" onClick={closeMenu}>
                <UserRound size={16} />
                Join Hub
              </Link>
            )}
          </nav>

          <div className="navbar-actions">

            <button
              type="button"
              className="nav-icon-btn"
              aria-label="Search"
              onClick={() => { closeMenu(); openSearch(); }}
            >
              <Search size={19} />
            </button>

            <AccessibilityControls />

            {isAuthenticated && !isAdmin && <NotificationBell />}

            {isAuthenticated ? (
              <div className="nav-user-wrap" ref={dropdownRef}>
                <button
                  type="button"
                  className="nav-user-btn"
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-expanded={profileOpen}
                >
                  <span className="nav-user-avatar">
                    {user?.profilePicture ? (
                      <img src={assetUrl(user.profilePicture)} alt="" />
                    ) : (
                      (user?.name || "U").charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="nav-user-name">
                    Hi, {user?.name?.split(" ")[0] || "User"}
                  </span>
                  <ChevronDown
                    size={14}
                    className={profileOpen ? "nav-chevron open" : "nav-chevron"}
                  />
                </button>

                {profileOpen && (
                  <div className="nav-user-dropdown">
                    <Link
                      to={isAdmin ? "/admin" : "/dashboard"}
                      className="nav-dropdown-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      {isAdmin ? <ShieldCheck size={15} /> : <LayoutDashboard size={15} />}
                      {isAdmin ? "Admin Panel" : "My Dashboard"}
                    </Link>
                    {!isAdmin && (
                      <Link
                        to="/dashboard/profile"
                        className="nav-dropdown-item"
                        onClick={() => setProfileOpen(false)}
                      >
                        <UserRound size={15} />
                        My Profile
                      </Link>
                    )}
                    <div className="nav-dropdown-divider" />
                    <button
                      type="button"
                      className="nav-dropdown-item nav-dropdown-logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link className="join-btn" to="/register" onClick={closeMenu}>
                <UserRound size={17} />
                <span>Join Hub</span>
              </Link>
            )}

            <button
              ref={menuButtonRef}
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>

          </div>
        </div>
      </header>

      {searchOpen && (
        <div
          className="nav-search-overlay"
          onClick={closeSearch}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div
            className="nav-search-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <form className="nav-search-form" onSubmit={handleSearchSubmit}>
              <Search size={20} className="nav-search-icon-svg" />
              <input
                ref={searchInputRef}
                type="text"
                className="nav-search-input"
                placeholder="Search characters, stories, events, shop..."
                value={query}
                onChange={handleQueryChange}
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="nav-search-clear"
                  onClick={clearQuery}
                  aria-label="Clear"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                className="nav-search-submit"
                disabled={!query.trim()}
              >
                <ArrowRight size={16} />
              </button>
            </form>

            {query.trim() && (
              <div className="nav-search-results">
                {searchLoading && (
                  <p className="nav-search-status">Searching...</p>
                )}

                {!searchLoading && suggestions.length === 0 && (
                  <p className="nav-search-status">No results for &ldquo;{query}&rdquo;</p>
                )}

                {!searchLoading && suggestions.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="nav-search-result"
                    onClick={() => handleSuggestionClick(item)}
                  >
                    <span className={`nav-result-kind nav-kind-${item.kind}`}>
                      {KIND_LABELS[item.kind] || item.kind}
                    </span>
                    <span className="nav-result-title">{item.title}</span>
                    {item.fandom && (
                      <span className="nav-result-fandom">{item.fandom}</span>
                    )}
                  </button>
                ))}

                {!searchLoading && suggestions.length > 0 && (
                  <button
                    type="button"
                    className="nav-search-all"
                    onClick={handleSearchSubmit}
                  >
                    See all results for &ldquo;{query}&rdquo;
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
