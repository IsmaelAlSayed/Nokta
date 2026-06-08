import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FaBell, FaHome, FaUser, FaHeadset } from "react-icons/fa";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, collection, query, onSnapshot, where } from "firebase/firestore";
import "../../styles/CustomerLayout.css";

const CustomerLayout = ({ children }) => {
  const [customerData, setCustomerData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const currentCustomer = auth.currentUser;

  useEffect(() => {
    if (!currentCustomer) return;
    getDoc(doc(db, "users", currentCustomer.uid)).then((snap) => {
      if (snap.exists()) setCustomerData(snap.data());
    });
  }, [currentCustomer]);

  useEffect(() => {
    if (!currentCustomer) return;
    const q = query(
      collection(db, "orders"),
      where("customerId", "==", currentCustomer.uid)
    );
    return onSnapshot(q, (snap) => {
      setUnreadCount(snap.docs.filter((d) => !d.data().customerRead).length);
    });
  }, [currentCustomer]);

  const displayName =
    customerData?.name ||
    currentCustomer?.email?.split("@")[0] ||
    "مستخدم";

  return (
    <div className="cust-layout">
      {/* ── Header ── */}
      <header className="cust-header">
        <NavLink to="/customer/notifications" className="cust-bell">
          <FaBell />
          {unreadCount > 0 && (
            <span className="cust-badge">{unreadCount}</span>
          )}
        </NavLink>

        <div className="cust-header-info">
          <span className="cust-header-name">{displayName}</span>
          <span className="cust-header-card">
            رقم البطاقة: {customerData?.loyalCardNo || "0000"}
          </span>
        </div>

        <div className="cust-avatar">
          <FaUser />
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="cust-main">{children || <Outlet />}</main>

      {/* ── Bottom Navigation ── */}
      <nav className="cust-bottom-nav">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `cust-nav-item${isActive ? " active" : ""}`
          }
        >
          <FaHome className="cust-nav-icon" />
          <span>الرئيسية</span>
        </NavLink>

        <NavLink
          to="/customer/notifications"
          className={({ isActive }) =>
            `cust-nav-item${isActive ? " active" : ""}`
          }
        >
          <div className="cust-nav-bell-wrap">
            <FaBell className="cust-nav-icon" />
            {unreadCount > 0 && (
              <span className="cust-nav-badge">{unreadCount}</span>
            )}
          </div>
          <span>إشعاراتي</span>
        </NavLink>

        <NavLink
          to="/customer/profile"
          className={({ isActive }) =>
            `cust-nav-item${isActive ? " active" : ""}`
          }
        >
          <FaUser className="cust-nav-icon" />
          <span>ملفي</span>
        </NavLink>

        <NavLink
          to="/customer/support"
          className={({ isActive }) =>
            `cust-nav-item${isActive ? " active" : ""}`
          }
        >
          <FaHeadset className="cust-nav-icon" />
          <span>الدعم</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default CustomerLayout;
