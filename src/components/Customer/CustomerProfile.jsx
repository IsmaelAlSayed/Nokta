import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebaseConfig";
import CustomerLayout from "./CustomerLayout";
import "../../styles/CustomerProfile.css";

const CustomerProfile = () => {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const currentCustomer = auth.currentUser;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", currentCustomer.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          setEditForm({
            name: data.name || "",
            phone: data.phoneNumber || "",
            address: data.address || "",
            password: "",
          });
        } else {
          setError("Profile not found.");
        }
      } catch (err) {
        setError("Error fetching profile: " + err.message);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [currentCustomer.uid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      // Update Firestore document for name, phone, and address.
      const docRef = doc(db, "users", currentCustomer.uid);
      await updateDoc(docRef, {
        name: editForm.name,
        phoneNumber: editForm.phone,
        address: editForm.address,
      });
      // Update password if provided.
      if (editForm.password) {
        await updatePassword(currentCustomer, editForm.password);
      }
      setSuccess("Profile updated successfully!");
      setProfile((prev) => ({
        ...prev,
        name: editForm.name,
        phoneNumber: editForm.phone,
        address: editForm.address,
      }));
      setEditForm((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      setError("Failed to update profile: " + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <CustomerLayout>
      <div className="customer-profile-container">
        <div className="profile-header-container">
          <h1 className="profile-header">My Profile</h1>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        {loading ? (
          <p className="loading">Loading...</p>
        ) : (
          <form className="profile-form" onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Email (uneditable):</label>
              <input type="email" value={currentCustomer.email} disabled />
            </div>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={editForm.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number:</label>
              <input
                type="text"
                name="phone"
                value={editForm.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>
            <div className="form-group">
              <label>Address:</label>
              <input
                type="text"
                name="address"
                value={editForm.address}
                onChange={handleChange}
                placeholder="Enter your address"
              />
            </div>
            <div className="form-group">
              <label>New Password:</label>
              <input
                type="password"
                name="password"
                value={editForm.password}
                onChange={handleChange}
                placeholder="Enter new password"
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <button type="submit" className="update-button">
              Update Profile
            </button>
          </form>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerProfile;
