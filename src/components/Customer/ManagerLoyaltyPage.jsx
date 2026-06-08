import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import CustomerLayout from "./CustomerLayout";
import { FaArrowLeft } from "react-icons/fa";
import "../../styles/ManagerLoyaltyPage.css";

const ManagerLoyaltyPage = () => {
  const { managerId } = useParams();
  const [manager, setManager] = useState(null);
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Get the current customer's UID from Firebase Auth.
  const currentCustomer = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch manager info from "users" collection.
        const managerDoc = await getDoc(doc(db, "users", managerId));
        if (managerDoc.exists()) {
          setManager(managerDoc.data());
        } else {
          console.error("Manager not found");
        }

        // Fetch loyalty configurations for this manager.
        const loyaltyQuery = query(
          collection(db, "loyaltyPoints"),
          where("managerId", "==", managerId)
        );
        const loyaltySnapshot = await getDocs(loyaltyQuery);
        const allConfigs = loyaltySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        
        // Filter configurations to only include those where the current customer is added.
        const filteredConfigs = allConfigs.filter(
          (config) => config.customers && config.customers.includes(currentCustomer.uid)
        );
        
        setConfigurations(filteredConfigs);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, [managerId, currentCustomer.uid]);

  if (loading) return <p className="loading">Loading...</p>;

  return (
    <CustomerLayout>
      <div className="manager-loyalty-page-container">
      <button className="back-button" onClick={() => navigate(-1)}>
    <FaArrowLeft />
  </button>
      <header className="page-header">
  
  <h1>
    <span className="business-name">
      {manager?.businessName ? manager.businessName : manager?.name}
    </span>
  </h1>
</header>
        <div className="configurations-list">
          {configurations.length > 0 ? (
            configurations.map((config) => (
              <div
                key={config.id}
                className="config-card"
                onClick={() => navigate(`/manager/royal-pass/${config.id}`)}
              >
                <h2>{config.name}</h2>
                <p>
                  Points per Dollar: <strong>{config.pointsPerDollar}</strong>
                </p>
              </div>
            ))
          ) : (
            <p>No loyalty configurations available for you from this manager.</p>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default ManagerLoyaltyPage;
