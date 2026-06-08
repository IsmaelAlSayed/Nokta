import React from "react";
import { Link } from "react-router-dom";
import { FaUsers, FaBoxOpen, FaShoppingCart, FaGift, FaTags } from "react-icons/fa";
import { motion } from "framer-motion";
import ManagerLayout from "../Manager/ManagerLayout";
import "../../styles/ManagerDashboard.css";

const ManagerDashboard = () => {
  return (
    <ManagerLayout>
      {/* <h1 className="header">Manager Dashboard</h1> */}
      <div className="grid">
        {/* Manage Customers Card */}
        <motion.div
          className="card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/manager/manage-customers" className="card-content">
            <motion.div
              whileHover={{ scale: 1.2, rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <FaUsers className="icon" />
            </motion.div>
            <h3>Manage Customers</h3>
            <p>View, add, and manage customers.</p>
          </Link>
        </motion.div>

        {/* Manage Products Card */}
        <motion.div
          className="card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/manager/manage-products" className="card-content">
            <motion.div
              whileHover={{ scale: 1.2, rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <FaBoxOpen className="icon" />
            </motion.div>
            <h3>Manage Products</h3>
            <p>View, add, edit, and delete products.</p>
          </Link>
        </motion.div>

        {/* Add Order Card */}
        <motion.div
          className="card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/manager/add-order" className="card-content">
            <motion.div
              whileHover={{ scale: 1.2, rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <FaShoppingCart className="icon" />
            </motion.div>
            <h3>Add Order</h3>
            <p>Create a new order for customers.</p>
          </Link>
        </motion.div>

        {/* Loyalty Points Card */}
        <motion.div
          className="card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/manager/loyalty-points" className="card-content">
            <motion.div
              whileHover={{ scale: 1.2, rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <FaGift className="icon" />
            </motion.div>
            <h3>Loyalty Points</h3>
            <p>Determine and manage loyalty points.</p>
          </Link>
        </motion.div>

        {/* Manage Category Card */}
        <motion.div
          className="card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/manager/manage-category" className="card-content">
            <motion.div
              whileHover={{ scale: 1.2, rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <FaTags className="icon" />
            </motion.div>
            <h3>Manage Category</h3>
            <p>Add, edit, and delete categories and subcategories.</p>
          </Link>
        </motion.div>
        {/* Manage Category Card */}
        <motion.div
          className="card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/manager/profile" className="card-content">
            <motion.div
              whileHover={{ scale: 1.2, rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <FaTags className="icon" />
            </motion.div>
            <h3>Manager Profile</h3>
            <p>Update User & Business information.</p>
          </Link>
        </motion.div>
        <motion.div
          className="card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/manager/orderforprize" className="card-content">
            <motion.div
              whileHover={{ scale: 1.2, rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <FaTags className="icon" />
            </motion.div>
            <h3>Order Prizes</h3>
            <p>Update User & Business information.</p>
          </Link>
        </motion.div>
      </div>
    </ManagerLayout>
  );
};

export default ManagerDashboard;
