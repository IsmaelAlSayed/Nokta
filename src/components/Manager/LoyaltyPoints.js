import React, { useState, useEffect } from "react";
import { db, storage, auth } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AssignedCustomersModal from "./AssignedCustomersModal";
import MangerLayout from "./ManagerLayout";
import "../../styles/LoyaltyPoints.css";

const LoyaltyPoints = () => {
  // Loyalty configuration states
  const [loyaltyPointsList, setLoyaltyPointsList] = useState([]);
  const [name, setName] = useState("");
  const [pointsPerDollar, setPointsPerDollar] = useState("");
  const [editingId, setEditingId] = useState(null);
  
  // Loading and messaging states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Customer assignment states
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentLoyalty, setCurrentLoyalty] = useState(null);

  // Prize/Award states
  const [prizes, setPrizes] = useState([]);
  const [currentPrize, setCurrentPrize] = useState({
    prizeName: "",
    exchangingValue: "",
    tier: "", // new field for tier level
    prizeImage: null,
    prizeImageUrl: ""
  });

  // Get the currently logged-in manager's UID.
  const currentManager = auth.currentUser;

  // Fetch loyalty configurations and customers for the current manager
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch loyalty configurations for the current manager.
        const loyaltyQuery = query(
          collection(db, "loyaltyPoints"),
          where("managerId", "==", currentManager.uid)
        );
        const [loyaltySnapshot, customerSnapshot] = await Promise.all([
          getDocs(loyaltyQuery),
          getDocs(collection(db, "users"))
        ]);

        const loyaltyList = loyaltySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        const customerList = customerSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((user) => user.role === "customer");

        setLoyaltyPointsList(loyaltyList);
        setCustomers(customerList);
        setFilteredCustomers(customerList);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data.");
      }
      setIsLoading(false);
    };

    fetchData();
  }, [currentManager.uid]);

  // Clear messages after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000);
    return () => clearTimeout(timer);
  }, [error, success]);

  // Filter customers by search term
  useEffect(() => {
    const filtered = customers.filter((customer) =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phoneNumber?.includes(searchTerm)
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  // Upload prize image to Firebase Storage; returns download URL (or empty string if none)
  const uploadPrizeImage = async (image) => {
    if (!image) return "";
    const timestamp = Date.now();
    const originalName = image.name;
    const uniqueName = `${originalName}_${timestamp}`;
    const imagePath = `prizes/${uniqueName}`;
    const imageRef = ref(storage, imagePath);
    await uploadBytes(imageRef, image);
    return await getDownloadURL(imageRef);
  };

  // Handler for adding a prize to the prizes array
  const handleAddPrize = async () => {
    if (!currentPrize.prizeName.trim()) {
      setError("Prize name is required.");
      return;
    }
    if (isNaN(currentPrize.exchangingValue) || Number(currentPrize.exchangingValue) <= 0) {
      setError("Exchanging value must be a positive number.");
      return;
    }
    let prizeImageUrl = "";
    if (currentPrize.prizeImage) {
      try {
        prizeImageUrl = await uploadPrizeImage(currentPrize.prizeImage);
      } catch (err) {
        console.error("Error uploading prize image:", err);
        setError("Failed to upload prize image.");
        return;
      }
    }
    const newPrize = {
      prizeName: currentPrize.prizeName,
      exchangingValue: Number(currentPrize.exchangingValue),
      tier: currentPrize.tier ? Number(currentPrize.tier) : null,
      prizeImageUrl
    };
    setPrizes((prev) => [...prev, newPrize]);
    // Clear current prize form
    setCurrentPrize({
      prizeName: "",
      exchangingValue: "",
      tier: "",
      prizeImage: null,
      prizeImageUrl: ""
    });
  };

  // Remove prize from the prizes list by index
  const handleRemovePrize = (index) => {
    setPrizes((prev) => prev.filter((_, i) => i !== index));
  };

  // Save the loyalty configuration (create or update)
  const handleSaveConfiguration = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a name for the loyalty configuration.");
      return;
    }
    if (isNaN(pointsPerDollar) || Number(pointsPerDollar) <= 0) {
      setError("Points per dollar must be a positive number.");
      return;
    }
    setIsLoading(true);
    try {
      const configData = {
        name,
        pointsPerDollar: Number(pointsPerDollar),
        customers: selectedCustomers,
        managerId: currentManager.uid,
        prizes // include the prizes array in the configuration
      };

      if (editingId) {
        await setDoc(doc(db, "loyaltyPoints", editingId), configData);
        setSuccess("Configuration updated successfully!");
      } else {
        const newDoc = doc(collection(db, "loyaltyPoints"));
        await setDoc(newDoc, configData);
        setSuccess("Configuration created successfully!");
      }

      // Refresh configurations for the current manager.
      const loyaltyQuery = query(
        collection(db, "loyaltyPoints"),
        where("managerId", "==", currentManager.uid)
      );
      const snapshot = await getDocs(loyaltyQuery);
      setLoyaltyPointsList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      
      resetForm();
    } catch (err) {
      console.error("Error saving configuration:", err);
      setError("Failed to save configuration.");
    }
    setIsLoading(false);
  };

  // Customer assignment handlers
  const handleAssignCustomers = async (loyaltyId) => {
    if (selectedCustomers.length === 0) {
      setError("Please select at least one customer.");
      return;
    }
    setIsLoading(true);
    try {
      await updateDoc(doc(db, "loyaltyPoints", loyaltyId), {
        customers: arrayUnion(...selectedCustomers)
      });
      setSuccess("Customers assigned successfully!");
      setSelectedCustomers([]);
      const loyaltyQuery = query(
        collection(db, "loyaltyPoints"),
        where("managerId", "==", currentManager.uid)
      );
      const snapshot = await getDocs(loyaltyQuery);
      setLoyaltyPointsList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error assigning customers:", err);
      setError("Failed to assign customers.");
    }
    setIsLoading(false);
  };

  const handleRemoveCustomer = async (loyaltyId, customerId) => {
    setIsLoading(true);
    try {
      await updateDoc(doc(db, "loyaltyPoints", loyaltyId), {
        customers: arrayRemove(customerId)
      });
      setSuccess("Customer removed successfully!");
      const loyaltyQuery = query(
        collection(db, "loyaltyPoints"),
        where("managerId", "==", currentManager.uid)
      );
      const snapshot = await getDocs(loyaltyQuery);
      setLoyaltyPointsList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error removing customer:", err);
      setError("Failed to remove customer.");
    }
    setIsLoading(false);
  };

  const handleDeleteLoyalty = async (loyaltyId) => {
    if (!window.confirm("Are you sure you want to delete this configuration?")) return;
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "loyaltyPoints", loyaltyId));
      setSuccess("Configuration deleted successfully!");
      setLoyaltyPointsList((prev) => prev.filter((item) => item.id !== loyaltyId));
    } catch (err) {
      console.error("Error deleting configuration:", err);
      setError("Failed to delete configuration.");
    }
    setIsLoading(false);
  };

  const handleEdit = (config) => {
    setEditingId(config.id);
    setName(config.name);
    setPointsPerDollar(config.pointsPerDollar);
    setSelectedCustomers(config.customers || []);
    setPrizes(config.prizes || []);
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPointsPerDollar("");
    setSelectedCustomers([]);
    setPrizes([]);
    setCurrentPrize({
      prizeName: "",
      exchangingValue: "",
      tier: "",
      prizeImage: null,
      prizeImageUrl: ""
    });
  };

  // Open modal to manage assigned customers
  const handleOpenModal = (loyalty) => {
    setCurrentLoyalty(loyalty);
    setModalOpen(true);
  };

  return (
    <MangerLayout>
      <div className="loyalty-points-container">
        <h1>Loyalty Points Management</h1>
        
        {/* Create / Edit Configuration Form */}
        <div className="form-section">
          <h2>{editingId ? "Edit Configuration" : "Create New Configuration"}</h2>
          <form onSubmit={handleSaveConfiguration}>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>Points per Dollar:</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={pointsPerDollar}
                onChange={(e) => setPointsPerDollar(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            {/* Prize / Award Section */}
            <div className="prize-section">
              <h3>Awards / Prizes (e.g. Royal Pass rewards)</h3>
              <div className="current-prize-form">
                <input
                  type="text"
                  placeholder="Prize Name (required)"
                  value={currentPrize.prizeName}
                  onChange={(e) =>
                    setCurrentPrize((prev) => ({ ...prev, prizeName: e.target.value }))
                  }
                />
                <input
                  type="number"
                  placeholder="Exchanging Value (required)"
                  value={currentPrize.exchangingValue}
                  onChange={(e) =>
                    setCurrentPrize((prev) => ({
                      ...prev,
                      exchangingValue: e.target.value,
                    }))
                  }
                />
                <input
                  type="number"
                  placeholder="Tier (optional)"
                  value={currentPrize.tier}
                  onChange={(e) =>
                    setCurrentPrize((prev) => ({ ...prev, tier: e.target.value }))
                  }
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCurrentPrize((prev) => ({
                      ...prev,
                      prizeImage: e.target.files[0],
                    }))
                  }
                />
                <button
                  type="button"
                  onClick={handleAddPrize}
                  disabled={isLoading}
                >
                  Add Prize
                </button>
              </div>
              <div className="prizes-list">
                {prizes.map((prize, index) => (
                  <div key={index} className="prize-item">
                    <p>
                      <strong>{prize.prizeName}</strong> 
                      {prize.tier && ` (Tier ${prize.tier})`} - Exchanging Value: ${prize.exchangingValue}
                    </p>
                    {prize.prizeImageUrl && (
                      <img src={prize.prizeImageUrl} alt={prize.prizeName} className="prize-image" />
                    )}
                    <button type="button" onClick={() => handleRemovePrize(index)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Customer Assignment Section */}
            <div className="customer-management">
              <h3>Assign Customers</h3>
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-bar"
              />
              <div className="customer-list">
                {customers
                  .filter(customer =>
                    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    customer.phoneNumber?.includes(searchTerm)
                  )
                  .map(customer => (
                    <div key={customer.id} className="customer-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCustomers(prev => [...prev, customer.id]);
                            } else {
                              setSelectedCustomers(prev => prev.filter(id => id !== customer.id));
                            }
                          }}
                        />
                        {customer.name} ({customer.phoneNumber})
                      </label>
                    </div>
                  ))}
              </div>
            </div>
            
            <button type="submit" disabled={isLoading}>
              {editingId ? "Update" : "Create"} Configuration
            </button>
            {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
          </form>
        </div>
        
        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <div className="configurations-list">
          <h2>Existing Configurations</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Points/Dollar</th>
                <th>Actions</th>
                <th>Manage Customers</th>
              </tr>
            </thead>
            <tbody>
              {loyaltyPointsList.map(config => (
                <tr key={config.id}>
                  <td>{config.name}</td>
                  <td>{config.pointsPerDollar}</td>
                  <td className="actions">
                    <button onClick={() => handleEdit(config)} disabled={isLoading}>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLoyalty(config.id)}
                      disabled={isLoading}
                      className="delete"
                    >
                      Delete
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleOpenModal(config)}>Manage Customers</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Assigned Customers Modal */}
        {modalOpen && currentLoyalty && (
          <AssignedCustomersModal
            loyalty={currentLoyalty}
            customers={customers}
            onClose={() => setModalOpen(false)}
          />
        )}
      </div>
    </MangerLayout>
  );
};

export default LoyaltyPoints;
