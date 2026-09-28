import { useState } from "react";
import { Outlet } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

import "../../styles/admin/admin-layout.css";

function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={
        collapsed
          ? "admin-layout sidebar-small"
          : "admin-layout"
      }
    >
      
      <AdminSidebar
        menuOpen={menuOpen}
        collapsed={collapsed}
        setMenuOpen={setMenuOpen}
        setCollapsed={setCollapsed}
      />

      
      {menuOpen && (
        <div
          className="admin-overlay"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      
      <div className="admin-main-area">
        <AdminHeader
          setMenuOpen={setMenuOpen}
        />

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;