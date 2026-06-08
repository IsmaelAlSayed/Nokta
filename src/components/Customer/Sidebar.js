import React from "react";
import { Link } from "react-router-dom";
import { FaTimes, FaHome, FaStar, FaUser } from "react-icons/fa"; // Icons for better UI
import "../../styles/CustomerLayout.css";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
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
              <FaHome /> Home
            </Link>
          </li>
          <li>
            <Link to="/customer/profile" onClick={toggleSidebar}>
              <FaUser /> Profile
            </Link>
          </li>
          <li>
            <Link to="/customer/support" onClick={toggleSidebar}>
              <FaStar /> Support
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
