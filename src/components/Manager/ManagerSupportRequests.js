import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import ManagerLayout from "../Manager/ManagerLayout"; // Ensure you have a manager layout
import "../../styles/ManagerSupportRequests.css"; // Import the corresponding CSS

const ManagerSupportRequests = () => {
  const [supportRequests, setSupportRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupportRequests = async () => {
      try {
        // Fetch support requests from Firestore, ordered by creation date (newest first)
        const requestsRef = collection(db, "supportRequests");
        const q = query(requestsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const requests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSupportRequests(requests);
      } catch (error) {
        console.error("Error fetching support requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupportRequests();
  }, []);

  return (
    <ManagerLayout>
      <div className="manager-support-requests-container">
        <header className="manager-support-header">
          <h1>Customer Support Requests</h1>
        </header>
        {loading ? (
          <p>Loading support requests...</p>
        ) : supportRequests.length > 0 ? (
          <div className="requests-list">
            {supportRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <h3>{request.subject}</h3>
                  <span className="request-date">
                    {request.createdAt?.toDate
                      ? request.createdAt.toDate().toLocaleDateString()
                      : ""}
                  </span>
                </div>
                <p className="request-message">{request.message}</p>
                <p className="request-customer">
                  From: {request.customerEmail}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No support requests available at the moment.</p>
        )}
      </div>
    </ManagerLayout>
  );
};

export default ManagerSupportRequests;
