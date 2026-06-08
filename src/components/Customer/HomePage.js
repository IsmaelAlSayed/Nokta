import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "../../styles/ManagerHomePage.css";
import CustomerLayout from "./CustomerLayout";

const ManagerHomePage = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loyaltyConfigs, setLoyaltyConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all businesses
        const businessSnapshot = await getDocs(collection(db, "businesses"));
        const businessesList = businessSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch loyalty configuration documents
        const loyaltySnapshot = await getDocs(collection(db, "loyaltyPoints"));
        const loyaltyList = loyaltySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setBusinesses(businessesList);
        setLoyaltyConfigs(loyaltyList);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Filter loyalty configurations to include only those with customers
  const filteredLoyalty = loyaltyConfigs.filter(
    (config) => config.customers && config.customers.length > 0
  );

  // For each loyalty configuration, find the corresponding business.
  // Remove duplicates in case multiple configurations refer to the same business.
  const businessMap = new Map();
  filteredLoyalty.forEach((config) => {
    const matchingBusiness = businesses.find(
      (business) => business.id === config.businessId
    );
    if (matchingBusiness) {
      businessMap.set(matchingBusiness.id, matchingBusiness);
    }
  });
  const businessCards = Array.from(businessMap.values());

  if (loading) {
    return (
      <div className="manager-homepage-container">
        <p className="loading">Loading...</p>
      </div>
    );
  }

  return (
    <CustomerLayout>
    <div className="manager-homepage-container">
      <h1 className="homepage-header">Manager Home Page</h1>
      <div className="business-cards-container">
        {businessCards.length > 0 ? (
          businessCards.map((business) => (
            <div key={business.id} className="business-card">
              <h2>{business.name}</h2>
              {/* Add additional business info if needed */}
            </div>
          ))
        ) : (
          <p>No businesses found with loyalty configurations.</p>
        )}
      </div>
    </div>
    </CustomerLayout>
  );
};

export default ManagerHomePage;
