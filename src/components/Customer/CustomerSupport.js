import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import CustomerLayout from "../Customer/CustomerLayout";
import "../../styles/CustomerSupport.css";

const CustomerSupport = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("");
  const [customerRequests, setCustomerRequests] = useState([]);
  const currentCustomer = auth.currentUser;

  // Fetch the current customer's support requests
  const fetchCustomerRequests = async () => {
    try {
      const q = query(
        collection(db, "supportRequests"),
        where("customerEmail", "==", currentCustomer.email),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Fetched customer requests:", requests);
      setCustomerRequests(requests);
    } catch (error) {
      console.error("Error fetching customer requests:", error);
      setStatus("Error fetching your support requests. Please check the console for details.");
    }
  };

  useEffect(() => {
    if (currentCustomer && currentCustomer.email) {
      fetchCustomerRequests();
    }
  }, [currentCustomer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Add a new support request to Firestore including phone number
      await addDoc(collection(db, "supportRequests"), {
        subject,
        message,
        phone,
        customerEmail: currentCustomer.email,
        createdAt: serverTimestamp(),
      });
      setStatus("Your support request has been submitted. We'll get back to you soon.");
      setSubject("");
      setMessage("");
      setPhone("");
      fetchCustomerRequests();
    } catch (error) {
      console.error("Error sending support request:", error);
      setStatus("There was an error submitting your request. Please try again later.");
    }
  };

  return (
    <CustomerLayout>
      <div className="customer-support-container">
        <header className="support-header">
          <h1>Customer Support</h1>
        </header>
        <section className="support-content">
          <p>
            If you have any issues or need help, please fill out the form below and our support team will assist you as soon as possible.
          </p>
          <form className="support-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="subject">Subject:</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number:</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message:</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              ></textarea>
            </div>
            <button type="submit">Submit Request</button>
          </form>
          {status && <p className="support-status">{status}</p>}
        </section>

        <section className="support-history">
          <h2>Your Support Requests</h2>
          {customerRequests.length > 0 ? (
            <div className="requests-list">
              {customerRequests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <h3>{request.subject}</h3>
                    <span className="request-date">
                      {request.createdAt && request.createdAt.toDate
                        ? request.createdAt.toDate().toLocaleDateString()
                        : "Pending..."}
                    </span>
                  </div>
                  <p className="request-message">{request.message}</p>
                  <p className="request-phone">Phone: {request.phone}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>You haven't submitted any support requests yet.</p>
          )}
        </section>
      </div>
    </CustomerLayout>
  );
};

export default CustomerSupport;
