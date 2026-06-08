import React, { useState, useEffect } from "react";
import { db, storage, auth } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import MangerLayout from "./ManagerLayout";
import "../../styles/ManageAwards.css";

const ManageAwards = () => {
  const [awards, setAwards] = useState([]);
  const [prizeName, setPrizeName] = useState("");
  const [exchangingValue, setExchangingValue] = useState("");
  const [prizeImage, setPrizeImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const currentManager = auth.currentUser;

  // Fetch awards for the current manager
  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const awardsQuery = query(
          collection(db, "awards"),
          where("managerId", "==", currentManager.uid)
        );
        const snapshot = await getDocs(awardsQuery);
        const awardsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setAwards(awardsList);
      } catch (err) {
        console.error("Error fetching awards:", err);
        setError("Failed to fetch awards.");
      }
    };

    fetchAwards();
  }, [currentManager.uid]);

  // Handle image selection from file input
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPrizeImage(file);
    }
  };

  // Upload prize image to Firebase Storage and return download URL
  const uploadImage = async (image) => {
    const timestamp = Date.now();
    const uniqueName = `${image.name}_${timestamp}`;
    const imagePath = `awards/${uniqueName}`;
    const imageRef = ref(storage, imagePath);
    await uploadBytes(imageRef, image);
    const url = await getDownloadURL(imageRef);
    return url;
  };

  // Save new or updated award
  const handleSaveAward = async (e) => {
    e.preventDefault();
    setError("");
    if (!prizeName.trim()) {
      setError("Prize Name is required.");
      return;
    }
    if (isNaN(exchangingValue) || Number(exchangingValue) <= 0) {
      setError("Exchanging Value must be a positive number.");
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = "";
      if (prizeImage) {
        imageUrl = await uploadImage(prizeImage);
      }
      const awardData = {
        prizeName,
        exchangingValue: Number(exchangingValue),
        imageUrl, // if blank, simply an empty string
        managerId: currentManager.uid,
      };

      if (editingId) {
        // Update award
        await updateDoc(doc(db, "awards", editingId), awardData);
        setSuccess("Award updated successfully!");
      } else {
        // Create new award
        await addDoc(collection(db, "awards"), awardData);
        setSuccess("Award created successfully!");
      }
      // Refresh awards list
      const awardsQuery = query(
        collection(db, "awards"),
        where("managerId", "==", currentManager.uid)
      );
      const snapshot = await getDocs(awardsQuery);
      setAwards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      resetForm();
    } catch (err) {
      console.error("Error saving award:", err);
      setError("Failed to save award.");
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setPrizeName("");
    setExchangingValue("");
    setPrizeImage(null);
  };

  const handleEdit = (award) => {
    setEditingId(award.id);
    setPrizeName(award.prizeName);
    setExchangingValue(award.exchangingValue);
    // Note: prizeImage file input cannot be pre-filled.
  };

  const handleDelete = async (awardId) => {
    if (!window.confirm("Are you sure you want to delete this award?")) return;
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "awards", awardId));
      setAwards(prev => prev.filter(award => award.id !== awardId));
      setSuccess("Award deleted successfully!");
    } catch (err) {
      console.error("Error deleting award:", err);
      setError("Failed to delete award.");
    }
    setIsLoading(false);
  };

  return (
    <MangerLayout>
      <div className="manage-awards-container">
        <h1 className="header">Manage Awards</h1>
        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}
        <div className="form-section">
          <h2>{editingId ? "Edit Award" : "Add New Award"}</h2>
          <form onSubmit={handleSaveAward}>
            <div className="form-group">
              <label>Prize Name (required):</label>
              <input
                type="text"
                value={prizeName}
                onChange={(e) => setPrizeName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="form-group">
              <label>Exchanging Value (required):</label>
              <input
                type="number"
                value={exchangingValue}
                onChange={(e) => setExchangingValue(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="form-group">
              <label>Prize Image (optional, recommended):</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isLoading}
              />
            </div>
            <button type="submit" disabled={isLoading} className="submit-button">
              {isLoading ? "Saving..." : editingId ? "Update Award" : "Add Award"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="cancel-button">
                Cancel
              </button>
            )}
          </form>
        </div>
        <div className="awards-list">
          <h2>Existing Awards</h2>
          {awards.length > 0 ? (
            <div className="cards-grid">
              {awards.map((award) => (
                <div key={award.id} className="award-card">
                  <h3 className="award-name">{award.prizeName}</h3>
                  <p className="award-value">
                    Exchanging Value: {award.exchangingValue}
                  </p>
                  {award.imageUrl && (
                    <img
                      src={award.imageUrl}
                      alt={award.prizeName}
                      className="award-image"
                    />
                  )}
                  <div className="award-actions">
                    <button
                      onClick={() => handleEdit(award)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(award.id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No awards found.</p>
          )}
        </div>
      </div>
    </MangerLayout>
  );
};

export default ManageAwards;
