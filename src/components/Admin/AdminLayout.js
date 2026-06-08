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
    <div className="dashboard-container">
      <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <span className="brand-dot">●</span>
          </div>
          {isOpen && <span className="brand-name">Nokta</span>}
          <button
            className="sidebar-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle sidebar"
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="sidebar-links">
            {navItems.map(({ to, icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? " active" : ""}`
                  }
                  data-tooltip={label}
                >
                  <span className="sidebar-icon">{icon}</span>
                  {isOpen && <span className="sidebar-label">{label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button
            className="sidebar-link sidebar-logout"
            onClick={handleLogout}
            data-tooltip="تسجيل الخروج"
          >
            <span className="sidebar-icon">
              <FaSignOutAlt />
            </span>
            {isOpen && <span className="sidebar-label">تسجيل الخروج</span>}
          </button>
        </div>

      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
};

export default AdminLayout;
