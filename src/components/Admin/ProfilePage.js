import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import AdminLayout from "../Admin/AdminLayout";
import "../../styles/ProfilePage.css";

const ProfilePage = () => {
  const [user, setUser] = useState(null); // Current user information
  const [editForm, setEditForm] = useState({
    name: "",
    phoneNumber: "",
    address: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false); // State for toggling password visibility
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser(userData);
          setEditForm({
            name: userData.name || "",
            phoneNumber: userData.phoneNumber || "",
            address: userData.address || "",
            password: "",
          });
        }
      }
    };
    fetchUser();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save updated user information
  const handleSave = async () => {
    setError("");
    setSuccess("");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not logged in.");

      // Update Firestore document
      await updateDoc(doc(db, "users", currentUser.uid), {
        name: editForm.name,
        phoneNumber: editForm.phoneNumber,
        address: editForm.address,
      });

      // Update password if provided
      if (editForm.password) {
        await updatePassword(currentUser, editForm.password);
      }

      setSuccess("Profile updated successfully.");
      setEditForm((prev) => ({ ...prev, password: "" })); // Clear password field
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = "/login"; // Redirect to login page after logout
    } catch (err) {
      setError("Failed to log out.");
    }
  };

  return (
    <AdminLayout>
    <div className="profile-container">
      <h1 className="profile-header">My Profile</h1>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      <div className="profile-form">
        <label>Name</label>
        <input
          type="text"
          name="name"
          value={editForm.name}
          onChange={handleChange}
          placeholder="Enter your name"
          className="profile-input"
        />

        <label>Phone Number</label>
        <input
          type="text"
          name="phoneNumber"
          value={editForm.phoneNumber}
          onChange={handleChange}
          placeholder="Enter your phone number"
          className="profile-input"
        />

        <label>Address</label>
        <input
          type="text"
          name="address"
          value={editForm.address}
          onChange={handleChange}
          placeholder="Enter your address"
          className="profile-input"
        />

        <label>Password</label>
        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={editForm.password}
            onChange={handleChange}
            placeholder="Enter a new password (optional)"
            className="profile-input"
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button className="save-button" onClick={handleSave}>
          Save Changes
        </button>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
    </AdminLayout>
  );
};

export default ProfilePage;
