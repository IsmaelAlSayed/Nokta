import React, { useEffect, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { FaHome, FaBell, FaUser, FaClipboardList } from "react-icons/fa";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import "../../styles/ManagerDashboard.css";

const ManagerLayout = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [managerData, setManagerData] = useState(null);

  useEffect(() => {
    const currentManager = auth.currentUser;
    if (!currentManager) return;

    getDoc(doc(db, "users", currentManager.uid)).then((snap) => {
      if (snap.exists()) setManagerData(snap.data());
    });

    const q = query(
      collection(db, "orders"),
      where("managerId", "==", currentManager.uid),
      where("status", "==", "pending"),
      where("read", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => {
      const count = snap.docs.filter((d) => d.data().source === "redeemPopup").length;
      setUnreadCount(count);
    });
    return () => unsub();
  }, []);

  const displayName = managerData?.businessName || managerData?.name || "التاجر";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="mgr-layout">
      <header className="mgr-header">
        <div className="mgr-header-avatar">
          {managerData?.logoUrl ? (
            <img src={managerData.logoUrl} alt={displayName}
              onError={(e) => { e.target.style.display = "none"; }} />
          ) : initial}
        </div>

        <div className="mgr-header-info">
          <span className="mgr-header-greeting">مرحباً بك،</span>
          <span className="mgr-header-name">{displayName}</span>
        </div>

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
