import React, { useEffect, useState } from "react";
import { collection, getDocs, setDoc, deleteDoc, doc, updateDoc, query, where } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import MangerLayout from "./ManagerLayout";
import CustomerOrdersModal from "./CustomerOrdersModal";
import CustomerLoyaltyModal from "./CustomerLoyaltyModal";
import "../../styles/ManageCustomers.css";

const ManageCustomersByManager = () => {
  // Customer and loyalty configuration states
  const [customers, setCustomers] = useState([]);
  const [loyaltyConfigs, setLoyaltyConfigs] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // States for adding new customers
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Messaging state
  const [error, setError] = useState("");
  
  // Modal states for orders and loyalty values
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loyaltyModalVisible, setLoyaltyModalVisible] = useState(false);
  const [selectedCustomerForLoyalty, setSelectedCustomerForLoyalty] = useState(null);
  
  // Edit customer state
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phoneNumber: "",
    address: "",
    password: "",
  });

  // Fetch customers and loyalty configurations
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers from "users" collection (role === "customer")
        const customerSnapshot = await getDocs(collection(db, "users"));
        const customerList = customerSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((user) => user.role === "customer");
        setCustomers(customerList);
        setFilteredCustomers(customerList);
        
        // Fetch loyalty configurations from "loyaltyPoints" collection
        const loyaltySnapshot = await getDocs(collection(db, "loyaltyPoints"));
        const loyaltyList = loyaltySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setLoyaltyConfigs(loyaltyList);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data.");
      }
    };
    fetchData();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setError("");
    }, 5000);
    return () => clearTimeout(timer);
  }, [error]);

  // Handle search input
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query === "") {
      setFilteredCustomers(customers);
    } else {
      const lowercasedQuery = query.toLowerCase();
      const filtered = customers.filter(
        (customer) =>
          (customer.name && customer.name.toLowerCase().includes(lowercasedQuery)) ||
          (customer.phoneNumber && customer.phoneNumber.includes(lowercasedQuery))
      );
      setFilteredCustomers(filtered);
    }
  };

  // Add new customer
  const handleAddCustomer = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    const currentAdmin = auth.currentUser;
    const currentAdminEmail = currentAdmin.email;
    const currentAdminPassword = prompt("Please enter your admin password to confirm this action:");
    if (!currentAdminPassword) {
      setError("Admin password is required.");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "customer",
        name: "",
        phoneNumber: "",
        address: "",
      });
      await signInWithEmailAndPassword(auth, currentAdminEmail, currentAdminPassword);
      const newCustomer = { id: user.uid, email: user.email, role: "customer" };
      setCustomers((prev) => [...prev, newCustomer]);
      setFilteredCustomers((prev) => [...prev, newCustomer]);
      setEmail("");
      setPassword("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete a customer
  const handleDeleteCustomer = async (id) => {
    try {
      await deleteDoc(doc(db, "users", id));
      const updatedCustomers = customers.filter((customer) => customer.id !== id);
      setCustomers(updatedCustomers);
      setFilteredCustomers(updatedCustomers);
    } catch (err) {
      console.error("Error deleting customer:", err);
    }
  };

  // Handle edit customer
  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name || "",
      phoneNumber: customer.phoneNumber || "",
      address: customer.address || "",
      password: "",
    });
  };

  // Save edited customer information
  const handleSaveEdit = async () => {
    if (!editingCustomer) return;
    const { id } = editingCustomer;
    try {
      await updateDoc(doc(db, "users", id), {
        name: editForm.name,
        phoneNumber: editForm.phoneNumber,
        address: editForm.address,
      });
      if (editForm.password) {
        const user = await auth.getUserByEmail(editingCustomer.email);
        await updatePassword(user, editForm.password);
      }
      const updatedCustomers = customers.map((customer) =>
        customer.id === id
          ? { ...customer, name: editForm.name, phoneNumber: editForm.phoneNumber, address: editForm.address }
          : customer
      );
      setCustomers(updatedCustomers);
      setFilteredCustomers(updatedCustomers);
      setEditingCustomer(null);
      setEditForm({ name: "", phoneNumber: "", address: "", password: "" });
    } catch (err) {
      console.error("Error updating customer:", err);
    }
  };

  // Open modal to view orders
  const handleViewOrders = async (customer) => {
    setSelectedCustomer(customer);
    setIsOrdersModalOpen(true);
    try {
      const ordersQuery = query(collection(db, "orders"), where("customerId", "==", customer.id));
      const querySnapshot = await getDocs(ordersQuery);
      const orders = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCustomerOrders(orders);
    } catch (err) {
      console.error("Error fetching customer orders:", err);
    }
  };

  // Helper: Return comma-separated loyalty configuration names for a customer.
  const getCustomerLoyaltyConfigs = (customerId) => {
    const configs = loyaltyConfigs.filter(
      (config) => config.customers && config.customers.includes(customerId)
    );
    return configs.map((config) => config.name).join(", ") || "None";
  };

  // Open modal to view loyalty point values for a customer.
  const handleViewLoyalty = (customer) => {
    setSelectedCustomerForLoyalty(customer);
    setLoyaltyModalVisible(true);
  };

  return (
    <MangerLayout>
      <div className="container">
        <h1 className="header-manager">Manage Customers</h1>
        
        {/* Search Bar */}
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or phone number"
            className="search-input"
          />
        </div>

        {/* Add Customer Form */}
        <div className="form-section">
          <h2 className="text-xl font-semibold mb-2">Add New Customer</h2>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Customer Email"
            className="p-2 border rounded mr-2"
          />
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="p-2 border rounded mr-2"
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <button
            onClick={handleAddCustomer}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add Customer
          </button>
        </div>

        {/* Edit Customer Form */}
        {editingCustomer && (
          <div className="form-section">
            <h2 className="text-xl font-semibold mb-2">Edit Customer</h2>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Customer Name"
              className="p-2 border rounded mb-2 w-full"
            />
            <input
              type="text"
              value={editForm.phoneNumber}
              onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
              placeholder="Phone Number"
              className="p-2 border rounded mb-2 w-full"
            />
            <input
              type="text"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              placeholder="Address"
              className="p-2 border rounded mb-2 w-full"
            />
            <input
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              placeholder="New Password (optional)"
              className="p-2 border rounded mb-2 w-full"
            />
            <button
              onClick={handleSaveEdit}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              Save
            </button>
            <button
              onClick={() => setEditingCustomer(null)}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Customer List */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Current Customers</h2>
          <ul className="customer-list">
            {filteredCustomers.map((customer) => (
              <li
                key={customer.id}
                className="flex justify-between items-center p-2 bg-white shadow mb-2 rounded"
              >
                <span>
                  <strong>Name:</strong> {customer.name || "No name provided"} <br />
                  <strong>Email:</strong> {customer.email} <br />
                  <strong>Phone:</strong> {customer.phoneNumber || "No phone number"} <br />
                  <strong>Loyalty Config:</strong> {getCustomerLoyaltyConfigs(customer.id)}
                </span>
                <div>
                  <button
                    onClick={() => handleEditCustomer(customer)}
                    className="text-blue-500 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer.id)}
                    className="text-red-500"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleViewOrders(customer)}
                    className="text-green-500 mr-2"
                  >
                    View Orders
                  </button>
                  <button
                    onClick={() => handleViewLoyalty(customer)}
                    className="text-purple-500"
                  >
                    View Loyalty Value
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer Orders Modal */}
        {isOrdersModalOpen && selectedCustomer && (
          <CustomerOrdersModal
            customer={selectedCustomer}
            orders={customerOrders}
            onClose={() => setIsOrdersModalOpen(false)}
          />
        )}

        {/* Customer Loyalty Value Modal */}
        {loyaltyModalVisible && selectedCustomerForLoyalty && (
          <CustomerLoyaltyModal
            customer={selectedCustomerForLoyalty}
            loyaltyConfigs={loyaltyConfigs}
            onClose={() => setLoyaltyModalVisible(false)}
          />
        )}
      </div>
    </MangerLayout>
  );
};

export default ManageCustomersByManager;
