import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import "../../styles/CustomerDashboard.css";
import CustomerLayout from "../Customer/CustomerLayout";

const CustomerDashboard = () => {
  const [customerName, setCustomerName] = useState("");
  const [loyaltyOffers, setLoyaltyOffers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [groupedOffers, setGroupedOffers] = useState({});
  const navigate = useNavigate();
  const currentCustomer = auth.currentUser;

  useEffect(() => {
    // If displayName is not set on the auth user, try to fetch it from Firestore
    const fetchCustomerName = async () => {
      if (currentCustomer.displayName) {
        setCustomerName(currentCustomer.displayName);
      } else {
        try {
          const userDoc = await getDoc(doc(db, "users", currentCustomer.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            // Assuming the customer's name is stored under the "name" field in Firestore
            setCustomerName(data.name || currentCustomer.email);
          } else {
            setCustomerName(currentCustomer.email);
          }
        } catch (error) {
          console.error("Error fetching customer name:", error);
          setCustomerName(currentCustomer.email);
        }
      }
    };

    if (currentCustomer) {
      fetchCustomerName();
    }
  }, [currentCustomer]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all loyalty configurations.
        const loyaltySnapshot = await getDocs(collection(db, "loyaltyPoints"));
        const allOffers = loyaltySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Filter offers that are assigned to the current customer.
        const assignedOffers = allOffers.filter(
          (offer) => offer.customers && offer.customers.includes(currentCustomer.uid)
        );
        setLoyaltyOffers(assignedOffers);

        // Group offers by managerId.
        const grouped = assignedOffers.reduce((acc, offer) => {
          if (!acc[offer.managerId]) {
            acc[offer.managerId] = [];
          }
          acc[offer.managerId].push(offer);
          return acc;
        }, {});
        setGroupedOffers(grouped);

        // Extract unique manager IDs.
        const managerIds = Object.keys(grouped);
        if (managerIds.length > 0) {
          // Fetch manager details from "users" where role is "manager".
          const q = query(collection(db, "users"), where("role", "==", "manager"));
          const managerSnapshot = await getDocs(q);
          const allManagers = managerSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          // Filter only managers who are in our grouped list.
          const filteredManagers = allManagers.filter((manager) =>
            managerIds.includes(manager.id)
          );
          setManagers(filteredManagers);
          console.log("Fetched managers:", filteredManagers);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [currentCustomer.uid]);

  // Helper to get manager details by ID.
  const getManagerById = (managerId) => managers.find((m) => m.id === managerId);

  return (
    <CustomerLayout>
      <div className="customer-dashboard-container">
        <header className="dashboard-header">
          <h1>Welcome, {customerName}</h1>
        </header>
        
        <section className="offers-section">
          <div className="cards-grid">
            {Object.keys(groupedOffers).length > 0 ? (
              Object.keys(groupedOffers).map((managerId) => {
                const manager = getManagerById(managerId);
                if (!manager) return null;
                return (
                  <div
                    key={managerId}
                    className="manager-card"
                    onClick={() => navigate(`/customer/manager-loyalty/${managerId}`)}
                  >
                    <div className="manager-logo-container">
                      {manager.logoUrl ? (
                        <img
                          src={manager.logoUrl}
                          alt={`${manager.businessName} logo`}
                          className="manager-logo"
                          onError={(e) => {
                            // Fallback to default logo on image load error
                            e.target.onerror = null;
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="default-logo">
                          {manager.businessName
                            ? manager.businessName.charAt(0).toUpperCase()
                            : ""}
                        </div>
                      )}
                    </div>
                    <h3 className="manager-business-name">{manager.businessName}</h3>
                    <p className="offer-count">{groupedOffers[managerId].length} Offer(s)</p>
                  </div>
                );
              })
            ) : (
              <p className="no-offers">
                No loyalty offers available at the moment.
              </p>
            )}
          </div>
        </section>
      </div>
    </CustomerLayout>
  );
};

export default CustomerDashboard;
