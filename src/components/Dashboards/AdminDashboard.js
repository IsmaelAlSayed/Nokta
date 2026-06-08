import React from "react";
import { Link } from "react-router-dom";
import { FaUserShield, FaUsers, FaUser } from "react-icons/fa"; // Import profile icon
import { motion } from "framer-motion";
import AdminLayout from "../Admin/AdminLayout"; // Import AdminLayout
import "../../styles/AdminDashboard.css";

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <h1 className="header">Admin Dashboard</h1>
      <div className="grid">
        {/* Manage Managers Card */}
        <motion.div
          className="card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/manage-managers" className="card-content">
            <motion.div
              whileHover={{
                rotate: 360,
                scale: 1.2,
              }}
              transition={{ duration: 0.5 }}
            >
              <FaUserShield className="icon" />
            </motion.div>
            <h3>Manage Managers</h3>
            <p>View, add, and manage managers.</p>
          </Link>
        </motion.div>

        {/* Manage Customers Card */}
        <motion.div
          className="card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/manage-customers" className="card-content">
            <motion.div
              whileHover={{
                scale: 1.2,
                rotate: 360,
              }}
              transition={{ duration: 0.5 }}
            >
              <FaUsers className="icon" />
            </motion.div>
            <h3>Manage Customers</h3>
            <p>View, add, and manage customers.</p>
          </Link>
        </motion.div>

        {/* Profile Page Card */}
        <motion.div
          className="card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/profile" className="card-content">
            <motion.div
              whileHover={{
                rotate: 360,
                scale: 1.2,
              }}
              transition={{ duration: 0.5 }}
            >
              <FaUser className="icon" />
            </motion.div>
            <h3>My Profile</h3>
            <p>Update your profile and account settings.</p>
          </Link>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
