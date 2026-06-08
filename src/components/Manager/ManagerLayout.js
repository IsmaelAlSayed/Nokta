import React, { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { FaBars, FaTimes, FaBell } from "react-icons/fa";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "../../styles/ManagerDashboard.css";

const ManagerLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Subscribe to unread notifications (pending orders with read === false)
  useEffect(() => {
    const notificationsQuery = query(
      collection(db, "orders"),
      where("source", "==", "redeemPopup"),
      where("status", "==", "pending"),
      where("read", "==", false)
    );

    const unsubscribeNotifications = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        setUnreadCount(snapshot.docs.length);
      },
      (error) => {
        console.error("Error fetching notifications count:", error);
      }
    );

    return () => unsubscribeNotifications();
  }, []);

  return (
    <div className="manager-layout">
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2 className="logo">
            <Link to="/manager/dashboard" onClick={toggleSidebar}>
              Manager
            </Link>
          </h2>
          <button className="close-btn" onClick={toggleSidebar}>
            <FaTimes />
          </button>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <Link to="/manager/dashboard" onClick={toggleSidebar}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/manager/manage-customers" onClick={toggleSidebar}>
                Manage Customers
              </Link>
            </li>
            <li>
              <Link to="/manager/manage-products" onClick={toggleSidebar}>
                Manage Products
              </Link>
            </li>
            <li>
              <Link to="/manager/add-order" onClick={toggleSidebar}>
                Add Order
              </Link>
            </li>
            <li>
              <Link to="/manager/orderforprize" onClick={toggleSidebar}>
                Order Prizes
              </Link>
            </li>
            <li>
              <Link to="/manager/support-requests" onClick={toggleSidebar}>
                Support Requests
              </Link>
            </li>
            <li>
              <Link to="/manager/loyalty-points" onClick={toggleSidebar}>
                Loyalty Points
              </Link>
            </li>
            <li>
              <Link to="/manager/manage-category" onClick={toggleSidebar}>
                Manage Category
              </Link>
            </li>
            <li>
              <Link to="/manager/profile" onClick={toggleSidebar}>
                Manager Profile
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      <div className={`main-content ${isSidebarOpen ? "shifted" : ""}`}>
        <header className="header">
          <button className="menu-button" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <div className="header-title-container">
            <h1 className="page-title">Manager Dashboard</h1>
            <Link to="/manager/notifications" className="header-notification-link">
              <FaBell className="notification-icon" />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </Link>
          </div>
        </header>

        <main className="content">{children || <Outlet />}</main>

        <footer className="manager-footer">
          <p>
            © {new Date().getFullYear()} Manager Panel. All Rights Reserved For Grow Up Tech.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ManagerLayout;
