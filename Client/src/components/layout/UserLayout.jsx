import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UserRound,
  Bookmark,
  StickyNote,
  Upload,
  MessageSquare,
  LogOut,
} from "lucide-react";

import Navbar from "./Navbar";
import Footer from "./Footer";
import ConfirmDialog from "../common/ConfirmDialog";
import Breadcrumbs from "../common/Breadcrumbs";
import { useAuth } from "../../context/AuthContext";
import { assetUrl } from "../../services/api";

import "../../styles/pages/user-dashboard.css";

const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/profile", label: "Profile", icon: UserRound },
  { to: "/dashboard/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/dashboard/notes", label: "Notes", icon: StickyNote },
  { to: "/dashboard/submissions", label: "Submissions", icon: Upload },
  { to: "/dashboard/chat-history", label: "Chat History", icon: MessageSquare },
];

function UserLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogoutConfirmed = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="user-dashboard-shell">
      <Navbar />
      <Breadcrumbs />

      <div className="user-dashboard-body">
        <div className="user-dashboard-container">
          <aside className="user-dashboard-sidebar">
            <div className="user-dashboard-profile-card">
              <div className="user-dashboard-avatar">
                {user?.profilePicture ? (
                  <img src={assetUrl(user.profilePicture)} alt="" />
                ) : (
                  (user?.name || "F").charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <strong>{user?.name || "Fan"}</strong>
                <small>{user?.email}</small>
              </div>
            </div>

            <nav className="user-dashboard-nav">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      isActive
                        ? "user-dashboard-link active"
                        : "user-dashboard-link"
                    }
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <button
              type="button"
              className="user-dashboard-logout"
              onClick={() => setConfirmOpen(true)}
            >
              <LogOut size={17} />
              <span>Log out</span>
            </button>
          </aside>

          <main className="user-dashboard-content">
            <Outlet />
          </main>
        </div>
      </div>

      <Footer />

      <ConfirmDialog
        open={confirmOpen}
        title="Log out of FanHub+?"
        message="You'll need to sign in again to access your dashboard, bookmarks, and notes."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        danger
        onConfirm={handleLogoutConfirmed}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

export default UserLayout;
