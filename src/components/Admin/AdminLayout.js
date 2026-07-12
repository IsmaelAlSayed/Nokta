import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaUserShield, FaUsers, FaUser, FaBars, FaTimes,
  FaSignOutAlt, FaTh,
} from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import "../../styles/AdminDashboard.css";

/* ── Nokta N logo (unique IDs to avoid conflicts) ── */
const NoktalLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="admGrad" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <filter id="admGlow">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <g filter="url(#admGlow)">
      <line x1="18" y1="54" x2="18" y2="18" stroke="url(#admGrad)" strokeWidth="5.5" strokeLinecap="round"/>
      <line x1="18" y1="18" x2="54" y2="54" stroke="url(#admGrad)" strokeWidth="5.5" strokeLinecap="round"/>
      <line x1="54" y1="54" x2="54" y2="18" stroke="url(#admGrad)" strokeWidth="5.5" strokeLinecap="round"/>
      <circle cx="18" cy="18" r="5" fill="#06b6d4" />
      <circle cx="18" cy="54" r="5" fill="#3b82f6" />
      <circle cx="54" cy="18" r="5" fill="#3b82f6" />
      <circle cx="54" cy="54" r="5" fill="#06b6d4" />
    </g>
  </svg>
);

const navItems = [
  { to: "/admin-dashboard",   icon: <FaTh />,        label: "لوحة التحكم",    short: "الرئيسية" },
  { to: "/manage-managers",   icon: <FaUserShield />, label: "إدارة المديرين", short: "مديرين" },
  { to: "/manage-customers",  icon: <FaUsers />,      label: "إدارة العملاء",  short: "العملاء" },
  { to: "/profile",           icon: <FaUser />,       label: "الملف الشخصي",  short: "الملف" },
];

const AdminLayout = ({ children }) => {
  const [isOpen,     setIsOpen]     = useState(true);   // desktop collapse
  const [mobileOpen, setMobileOpen] = useState(false);  // mobile overlay
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="admin-layout">

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div className="admin-mobile-overlay" onClick={closeMobile} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${isOpen ? "open" : "closed"} ${mobileOpen ? "mobile-open" : ""}`}>

        <div className="admin-sidebar-brand">
          <div className="sidebar-brand-logo">
            <NoktalLogo size={isOpen ? 32 : 26} />
          </div>
          {isOpen && <span className="brand-name">Nokta</span>}

          {/* Desktop collapse toggle */}
          <button
            className="admin-sidebar-toggle desktop-only"
            onClick={() => setIsOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* Mobile close button */}
          <button
            className="admin-sidebar-toggle mobile-only"
            onClick={closeMobile}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>

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
                  onClick={closeMobile}
                >
                  <span className="admin-sidebar-icon">{icon}</span>
                  {isOpen && <span className="admin-sidebar-label">{label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <button
            className="admin-sidebar-link admin-sidebar-logout"
            onClick={handleLogout}
            data-tooltip="تسجيل الخروج"
          >
            <span className="admin-sidebar-icon"><FaSignOutAlt /></span>
            {isOpen && <span className="admin-sidebar-label">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* ── Content column (top bar + main + bottom nav) ── */}
      <div className="admin-content-wrap">

        {/* Mobile top bar */}
        <header className="admin-topbar">
          <button
            className="admin-topbar-hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <FaBars />
          </button>

          <div className="admin-topbar-brand">
            <NoktalLogo size={28} />
            <span className="admin-topbar-name">Nokta</span>
          </div>

          <button className="admin-topbar-logout" onClick={handleLogout} aria-label="Logout">
            <FaSignOutAlt />
          </button>
        </header>

        {/* Page content */}
        <main className="admin-main-content">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="admin-bottom-nav">
          {navItems.map(({ to, icon, short }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `admin-nav-item${isActive ? " active" : ""}`
              }
            >
              <span className="admin-nav-icon">{icon}</span>
              <span className="admin-nav-label">{short}</span>
            </NavLink>
          ))}
        </nav>

      </div>
    </div>
  );
};

export default AdminLayout;
