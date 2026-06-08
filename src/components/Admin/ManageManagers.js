import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebaseConfig";
import { collection, getDocs, setDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import AdminLayout from "./AdminLayout";
import "../../styles/ManageManagers.css";

const ManageManagers = () => {
  const [managers, setManagers] = useState([]);
  const [filteredManagers, setFilteredManagers] = useState([]); // Filtered managers for search
  const [searchQuery, setSearchQuery] = useState(""); // Search query
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [editingManager, setEditingManager] = useState(null); // Manager being edited
  const [editForm, setEditForm] = useState({
    name: "",
    phoneNumber: "",
    address: "",
    password: "",
  });
  const [error, setError] = useState("");

  // Fetch managers from Firestore
  useEffect(() => {
    const fetchManagers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const managerList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.role === "manager");
      setManagers(managerList);
      setFilteredManagers(managerList); // Initialize filtered managers
    };
    fetchManagers();
  }, []);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query === "") {
      setFilteredManagers(managers);
    } else {
      const lowercasedQuery = query.toLowerCase();
      const filtered = managers.filter(
        (manager) =>
          (manager.name && manager.name.toLowerCase().includes(lowercasedQuery)) ||
          (manager.phoneNumber && manager.phoneNumber.includes(lowercasedQuery))
      );
      setFilteredManagers(filtered);
    }
  };

  // Add a new manager
  const handleAddManager = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    const currentAdmin = auth.currentUser;
    const currentAdminEmail = currentAdmin.email;
    const currentAdminPassword = prompt("Please re-enter your(Admin) password to confirm adding a new manager:");

    if (!currentAdminPassword) {
      setError("Admin password is required to perform this action.");
      return;
    }

    try {
      // Temporarily create a new user (this will sign out the current user)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Add the new manager to Firestore with the same UID
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "manager",
        name: "",
        phoneNumber: "",
        address: "",
      });

      // Re-authenticate the current admin to restore the session
      await signInWithEmailAndPassword(auth, currentAdminEmail, currentAdminPassword);

      const newManager = { id: user.uid, email: user.email, role: "manager" };
      setManagers([...managers, newManager]);
      setFilteredManagers([...managers, newManager]); // Update filtered managers
      setEmail("");
      setPassword("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Edit a manager
  const handleEditManager = (manager) => {
    setEditingManager(manager);
    setEditForm({
      name: manager.name || "",
      phoneNumber: manager.phoneNumber || "",
      address: manager.address || "",
      password: "",
    });
  };

  // Save edited manager information
  const handleSaveEdit = async () => {
    if (!editingManager) return;

    const { id } = editingManager;

    try {
      // Update Firestore manager document
      await updateDoc(doc(db, "users", id), {
        name: editForm.name,
        phoneNumber: editForm.phoneNumber,
        address: editForm.address,
      });

      // Update password in Authentication if provided
      if (editForm.password) {
        const user = await auth.getUserByEmail(editingManager.email);
        await updatePassword(user, editForm.password);
      }

      // Update local state
      const updatedManagers = managers.map((manager) =>
        manager.id === id
          ? {
              ...manager,
              name: editForm.name,
              phoneNumber: editForm.phoneNumber,
              address: editForm.address,
            }
          : manager
      );

      setManagers(updatedManagers);
      setFilteredManagers(updatedManagers); // Update filtered managers
      setEditingManager(null);
      setEditForm({ name: "", phoneNumber: "", address: "", password: "" });
    } catch (error) {
      console.error("Error updating manager:", error);
    }
  };

  // Delete a manager
  const handleDeleteManager = async (id) => {
    try {
      // Delete user from Firestore
      await deleteDoc(doc(db, "users", id));

      // Update local state
      const updatedManagers = managers.filter((manager) => manager.id !== id);
      setManagers(updatedManagers);
      setFilteredManagers(updatedManagers); // Update filtered managers
    } catch (error) {
      console.error("Error deleting manager:", error);
    }
  };

  return (
    <AdminLayout>
    <div className="container">
      <h1 className="header">Manage Managers</h1>

      {/* Search Bar */}
      <div className="search-bar mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or phone number"
          className="p-2 border rounded w-full"
        />
      </div>

      {/* Add Manager Form */}
      <div className="form-section">
        <h2 className="text-xl font-semibold mb-2">Add New Manager</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Manager Email"
          className="p-2 border rounded mr-2"
        />
        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"} // Toggle password input type
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="p-2 border rounded mr-2"
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)} // Toggle password visibility
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <button
          onClick={handleAddManager}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Manager
        </button>
      </div>

      {/* Edit Manager Form */}
      {editingManager && (
        <div className="form-section">
          <h2 className="text-xl font-semibold mb-2">Edit Manager</h2>
          <input
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Manager Name"
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
            onClick={() => setEditingManager(null)}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Manager List */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Current Managers</h2>
        <ul className="manager-list">
          {filteredManagers.map((manager) => (
            <li
              key={manager.id}
              className="flex justify-between items-center p-2 bg-white shadow mb-2 rounded"
            >
              <span>
                <strong>Name:</strong> {manager.name || "No name provided"} <br />
                <strong>Email:</strong> {manager.email} <br />
                <strong>Phone:</strong> {manager.phoneNumber || "No phone number"}
              </span>
              <div>
                <button
                  onClick={() => handleEditManager(manager)}
                  className="text-blue-500 mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteManager(manager.id)}
                  className="text-red-500"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
    </AdminLayout>
  );
};

export default ManageManagers;
