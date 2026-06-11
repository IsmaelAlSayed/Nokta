import React, { useEffect, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { FaHome, FaBell, FaUser, FaClipboardList } from "react-icons/fa";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "../../styles/ManagerDashboard.css";

const ManagerLayout = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("source", "==", "redeemPopup"),
      where("status", "==", "pending"),
      where("read", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => setUnreadCount(snap.docs.length));
    return () => unsub();
  }, []);

  return (
    <div className="mgr-layout">
      <header className="mgr-header">
        <span className="mgr-header-brand">لوحة التاجر</span>
      </header>

      <main className="mgr-main">{children || <Outlet />}</main>

      <nav className="mgr-bottom-nav">
        <NavLink
          to="/manager-dashboard"
          className={({ isActive }) => `mgr-nav-item${isActive ? " active" : ""}`}
        >
          <FaHome className="mgr-nav-icon" />
          <span>الرئيسية</span>
        </NavLink>

        <NavLink
          to="/manager/orderforprize"
          className={({ isActive }) => `mgr-nav-item${isActive ? " active" : ""}`}
        >
          <FaClipboardList className="mgr-nav-icon" />
          <span>الطلبات</span>
        </NavLink>

        <NavLink
          to="/manager/notifications"
          className={({ isActive }) => `mgr-nav-item${isActive ? " active" : ""}`}
        >
          <span className="mgr-nav-bell-wrap">
            <FaBell className="mgr-nav-icon" />
            {unreadCount > 0 && (
              <span className="mgr-nav-badge">{unreadCount}</span>
            )}
          </span>
          <span>الإشعارات</span>
        </NavLink>

        <NavLink
          to="/manager/profile"
          className={({ isActive }) => `mgr-nav-item${isActive ? " active" : ""}`}
        >
          <FaUser className="mgr-nav-icon" />
          <span>ملفي</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default ManagerLayout;
