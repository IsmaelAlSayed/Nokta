import React, { useState } from "react";
import { db } from "../../firebaseConfig";
import { updateDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore";
import "../../styles/AssignedCustomersModal.css";

const AssignedCustomersModal = ({ loyalty, customers, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  // Filter customers based on search input and remove already assigned ones
  const filteredCustomers = customers.filter(
    (customer) =>
      !loyalty.customers.includes(customer.id) && // Exclude already assigned customers
      (customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phoneNumber?.includes(searchTerm))
  );

  // Add selected customers to loyalty points
  const handleAddCustomers = async () => {
    if (selectedCustomers.length === 0) {
      alert("Please select at least one customer to add.");
      return;
    }

    try {
      await updateDoc(doc(db, "loyaltyPoints", loyalty.id), {
        customers: arrayUnion(...selectedCustomers),
      });
      alert("Customers added successfully!");
      setSelectedCustomers([]); // Clear selection
    } catch (error) {
      alert("Failed to add customers.");
    }
  };

  // Remove a customer from loyalty points
  const handleRemoveCustomer = async (customerId) => {
    try {
      await updateDoc(doc(db, "loyaltyPoints", loyalty.id), {
        customers: arrayRemove(customerId),
      });
      alert("Customer removed successfully!");
    } catch (error) {
      alert("Failed to remove customer.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Manage Assigned Customers</h2>

        {/* Search Customers */}
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />

        {/* Customer Selection for Adding (excluding already assigned customers) */}
        <div className="customer-selection">
          <h3>Add Customers</h3>
          <ul className="customer-list">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <li key={customer.id}>
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(customer.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCustomers([...selectedCustomers, customer.id]);
                      } else {
                        setSelectedCustomers(
                          selectedCustomers.filter((id) => id !== customer.id)
                        );
                      }
                    }}
                  />
                  {customer.name} ({customer.phoneNumber})
                </li>
              ))
            ) : (
              <p>No available customers to add.</p>
            )}
          </ul>
          <button onClick={handleAddCustomers} className="add-button">
            Add Selected Customers
          </button>
        </div>

        {/* Assigned Customers List */}
        <h3>Assigned Customers</h3>
        <ul className="assigned-customers-list">
          {loyalty.customers.length > 0 ? (
            loyalty.customers.map((customerId) => {
              const customer = customers.find((c) => c.id === customerId);
              return (
                <li key={customerId}>
                  {customer ? `${customer.name} (${customer.phoneNumber})` : customerId}
                  <button
                    onClick={() => handleRemoveCustomer(customerId)}
                    className="remove-button"
                  >
                    Remove
                  </button>
                </li>
              );
            })
          ) : (
            <p>No customers assigned.</p>
          )}
        </ul>

        {/* Close Modal */}
        <button onClick={onClose} className="close-button">
          Close
        </button>
      </div>
    </div>
  );
};

export default AssignedCustomersModal;
