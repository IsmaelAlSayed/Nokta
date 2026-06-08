import React, { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { FaTimes, FaUserCircle, FaBell } from "react-icons/fa";
import { FiMenu } from "react-icons/fi";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, collection, query, onSnapshot, where } from "firebase/firestore";
import "../../styles/CustomerLayout.css";

const CustomerLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const currentCustomer = auth.currentUser;

  // Fetch customer profile data
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (currentCustomer) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentCustomer.uid));
          if (userDoc.exists()) {
            setCustomerData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching customer data:", error);
        }
      }
    };
    fetchCustomerData();
  }, [currentCustomer]);

  // Subscribe to all notifications (orders) for the current customer
  // Then, calculate the unread count on the client side.
  useEffect(() => {
    if (!currentCustomer) return;
    const notificationsQuery = query(
      collection(db, "orders"),
      where("customerId", "==", currentCustomer.uid)
    );
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        // Map orders data
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Unread if customerRead is false or undefined
        const unread = ordersData.filter(order => order.customerRead === false || order.customerRead === undefined).length;
        setUnreadCount(unread);
      },
      (error) => {
        console.error("Error fetching customer notifications:", error);
      }
    );
    return () => unsubscribe();
  }, [currentCustomer]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="customer-layout">
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2 className="logo">
            <Link to="/home" onClick={toggleSidebar}>
              Loyalty
            </Link>
          </h2>
          <button className="close-btn" onClick={toggleSidebar}>
            <FaTimes />
          </button>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <Link to="/home" onClick={toggleSidebar}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/customer/profile" onClick={toggleSidebar}>
                Profile
              </Link>
            </li>
            <li>
              <Link to="/customer/support" onClick={toggleSidebar}>
                Support
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      <div className={`main-content ${isSidebarOpen ? "shifted" : ""}`}>
        <header className="header">
          <button className="menu-button" onClick={toggleSidebar}>
            <FiMenu />
          </button>
          <div className="header-right">
            <div className="profile-info">
              {currentCustomer?.photoURL ? (
                <img src={currentCustomer.photoURL} alt="User" className="profile-pic" />
              ) : (
                <FaUserCircle className="default-profile-icon" />
              )}
              <div className="profile-name">
                <h2>{customerData?.name || currentCustomer?.displayName || "User"}</h2>
                <p>Loyal Card No: {customerData?.loyalCardNo || "0000"}</p>
              </div>
            </div>
            <Link to="/customer/notifications" className="customer-notification-link">
              <FaBell className="customer-notification-icon" />
              <span className="customer-notification-badge">{unreadCount}</span>
            </Link>
          </div>
        </header>

        <main className="content">{children || <Outlet />}</main>

        <footer className="customer-footer">
          <p>
            © {new Date().getFullYear()} Loyalty System.{" "}
            <span>All Rights Reserved For Grow Up Tech.</span>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default CustomerLayout;
