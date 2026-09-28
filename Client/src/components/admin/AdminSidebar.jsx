import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  FileText,
  Tags,
  UserRound,
  Video,
  Upload,
  CalendarDays,
  ShoppingBag,
  MessageSquare,
  Bot,
  BarChart3,
  Settings,
  FolderOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Rocket,
  X,
} from "lucide-react";

function AdminSidebar({
  menuOpen,
  collapsed,
  setMenuOpen,
  setCollapsed,
}) {
  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <aside
      className={
        menuOpen
          ? "admin-sidebar sidebar-open"
          : "admin-sidebar"
      }
    >
      
      <div className="sidebar-header">
        <NavLink
          to="/admin"
          className="admin-logo"
          onClick={closeMenu}
        >
          <span className="admin-logo-icon">
            <Sparkles size={19} />
          </span>

          <div className="admin-logo-text">
            <strong>
              FANHUB<span>+</span>
            </strong>

            <small>admin panel</small>
          </div>
        </NavLink>

        <button
          type="button"
          className="sidebar-close-btn"
          onClick={closeMenu}
        >
          <X size={18} />
        </button>
      </div>

      
      <div className="sidebar-body">

        <p className="sidebar-title">
          overview
        </p>

        <NavLink
          to="/admin"
          end
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <LayoutDashboard size={18} />
          <span>dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/analytics"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <BarChart3 size={18} />
          <span>analytics</span>
        </NavLink>


        <p className="sidebar-title">
          community
        </p>

        <NavLink
          to="/admin/users"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <Users size={18} />
          <span>users</span>
        </NavLink>

        <NavLink
          to="/admin/submissions"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <Upload size={18} />
          <span>submissions</span>
        </NavLink>

        <NavLink
          to="/admin/feedback"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <MessageSquare size={18} />
          <span>feedback</span>
        </NavLink>


        <p className="sidebar-title">
          content
        </p>

        <NavLink
          to="/admin/content"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <FolderOpen size={18} />
          <span>content hub</span>
        </NavLink>

        <NavLink
          to="/admin/articles"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <FileText size={18} />
          <span>articles</span>
        </NavLink>

        <NavLink
          to="/admin/categories"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <Tags size={18} />
          <span>categories</span>
        </NavLink>

        <NavLink
          to="/admin/characters"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <UserRound size={18} />
          <span>characters</span>
        </NavLink>

        <NavLink
          to="/admin/multimedia"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <Video size={18} />
          <span>multimedia</span>
        </NavLink>

        <NavLink
          to="/admin/ai"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <Bot size={18} />
          <span>manage ai</span>
        </NavLink>


        <p className="sidebar-title">
          store & events
        </p>

        <NavLink
          to="/admin/events"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <CalendarDays size={18} />
          <span>events</span>
        </NavLink>

        <NavLink
          to="/admin/merchandise"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <ShoppingBag size={18} />
          <span>merchandise</span>
        </NavLink>

        <NavLink
          to="/admin/releases"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <Rocket size={18} />
          <span>upcoming releases</span>
        </NavLink>


        <p className="sidebar-title">
          system
        </p>

        <NavLink
          to="/admin/settings"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <Settings size={18} />
          <span>settings</span>
        </NavLink>
      </div>


      
      <div className="sidebar-footer">
        <button
          type="button"
          className="collapse-btn"
          onClick={() =>
            setCollapsed(!collapsed)
          }
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <>
              <ChevronLeft size={18} />
              <span>collapse sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;