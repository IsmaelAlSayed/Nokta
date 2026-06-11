import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaUserShield,
  FaUsers,
  FaUser,
  FaBars,
  FaTimes,
  FaSignOutAlt,
} from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import "../../styles/AdminDashboard.css";

const navItems = [
  { to: "/manage-managers", icon: <FaUserShield />, label: "إدارة المديرين" },
  { to: "/manage-customers", icon: <FaUsers />, label: "إدارة العملاء" },
  { to: "/profile", icon: <FaUser />, label: "الملف الشخصي" },
];

const AdminLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${isOpen ? "open" : "closed"}`}>

        {/* Brand */}
        <div className="admin-sidebar-brand">
          <div className="sidebar-brand-logo">
            <span className="brand-dot">●</span>
          </div>
          {isOpen && <span className="brand-name">Nokta</span>}
          <button
            className="admin-sidebar-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle sidebar"
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar-nav">
          <ul className="admin-sidebar-links">
            {navItems.map(({ to, icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `admin-sidebar-link${isActive ? " active" : ""}`
                  }
                  data-tooltip={label}
                >
                  <span className="admin-sidebar-icon">{icon}</span>
                  {isOpen && <span className="admin-sidebar-label">{label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="admin-sidebar-footer">
          <button
            className="admin-sidebar-link admin-sidebar-logout"
            onClick={handleLogout}
            data-tooltip="تسجيل الخروج"
          >
            <span className="admin-sidebar-icon">
              <FaSignOutAlt />
            </span>
            {isOpen && <span className="admin-sidebar-label">تسجيل الخروج</span>}
          </button>
        </div>

      </aside>

      <main className="admin-main-content">{children}</main>
    </div>
  );
};

export default AdminLayout;
