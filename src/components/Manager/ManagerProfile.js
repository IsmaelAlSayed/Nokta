import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import ManagerLayout from "./ManagerLayout";
import "../../styles/ManagerProfile.css";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ManagerProfile = () => {
  const [profile, setProfile] = useState({
    name: "",
    phoneNumber: "",
    address: "",
    businessName: "",
    email: "",
    logoUrl: "", // store logo URL from Firebase Storage, if any
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          console.error("Profile not found");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
      setLoading(false);
    };

    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleCurrentPasswordChange = (e) => {
    setCurrentPassword(e.target.value);
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  // Handle file selection and preview generation
  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoFile(null);
      setLogoPreview("");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const userRef = doc(db, "users", currentUser.uid);
      // Update basic profile info (excluding password)
      await updateDoc(userRef, {
        name: profile.name,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
        businessName: profile.businessName,
      });
      let updateMsg = "Profile updated successfully.";

      // If a logo file is selected, upload it to Firebase Storage and update the logoUrl field in Firestore
      if (logoFile) {
        const storage = getStorage();
        const logoStorageRef = ref(storage, `logos/${currentUser.uid}/${logoFile.name}`);
        await uploadBytes(logoStorageRef, logoFile);
        const url = await getDownloadURL(logoStorageRef);
        await updateDoc(userRef, { logoUrl: url });
        // Update local state with the new logo URL and clear file/preview states
        setProfile((prev) => ({ ...prev, logoUrl: url }));
        setLogoFile(null);
        setLogoPreview("");
        updateMsg += " Logo updated successfully.";
      }

      // If a new password is provided, update the password
      if (newPassword) {
        if (!currentPassword) {
          setMessage("Please enter your current password to update the password.");
          return;
        }
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        updateMsg += " Password updated successfully.";
        setCurrentPassword("");
        setNewPassword("");
      }
      setMessage(updateMsg);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Failed to update profile: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  if (loading) {
    return <p className="loading">Loading profile...</p>;
  }

  return (
    <ManagerLayout>
      <div className="manager-profile-container">
        <div className="profile-header">
          <h1>Manager Profile</h1>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        {/* Logo display area */}
        <div className="logo-container">
          {logoPreview ? (
            <img src={logoPreview} alt="Logo Preview" className="logo-image" />
          ) : profile.logoUrl ? (
            <img src={profile.logoUrl} alt="Logo" className="logo-image" />
          ) : (
            <div className="default-logo">
              {profile.businessName ? profile.businessName.charAt(0).toUpperCase() : ""}
            </div>
          )}
        </div>
        <form className="profile-form" onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label>Logo Image</label>
            <input type="file" accept="image/*" onChange={handleLogoFileChange} />
          </div>
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input 
              type="text"
              name="phoneNumber"
              value={profile.phoneNumber}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea 
              name="address"
              value={profile.address}
              onChange={handleChange}
            ></textarea>
          </div>
          <div className="form-group">
            <label>Business Name</label>
            <input 
              type="text"
              name="businessName"
              value={profile.businessName}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Email (cannot be changed)</label>
            <input 
              type="email"
              name="email"
              value={profile.email}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Current Password (required to update password)</label>
            <input 
              type="password"
              name="currentPassword"
              value={currentPassword}
              onChange={handleCurrentPasswordChange}
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input 
              type="password"
              name="newPassword"
              value={newPassword}
              onChange={handleNewPasswordChange}
            />
          </div>
          <button type="submit" className="update-button">
            Update Profile
          </button>
          {message && <p className="update-message">{message}</p>}
        </form>
      </div>
    </ManagerLayout>
  );
};

export default ManagerProfile;
