import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaUserShield, FaUsers, FaBars, FaTimes, FaUser } from "react-icons/fa";
import "../../styles/AdminDashboard.css";

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <button className="menu-toggler" onClick={toggleSidebar}>
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <ul className="sidebar-links">
          <li>
            <Link to="/manage-managers" className="sidebar-link">
              <FaUserShield className="sidebar-icon" />
              {isSidebarOpen && "Manage Managers"}
            </Link>
          </li>
          <li>
            <Link to="/manage-customers" className="sidebar-link">
              <FaUsers className="sidebar-icon" />
              {isSidebarOpen && "Manage Customers"}
            </Link>
          </li>
          <li>
            <Link to="/profile" className="sidebar-link">
              <FaUser className="sidebar-icon" />
              {isSidebarOpen && "My Profile"}
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">{children}</div>
    </div>
  );
};

export default AdminLayout;
