import React from "react";
import "../../styles/CustomerLoyaltyModal.css";

const CustomerLoyaltyModal = ({ customer, loyaltyConfigs, onClose }) => {
  // Filter loyalty configurations that include this customer.
  const customerConfigs = loyaltyConfigs.filter(
    (config) => config.customers && config.customers.includes(customer.id)
  );

  return (
    <div className="loyalty-modal-overlay">
      <div className="loyalty-modal-content">
        <h2>{customer.name}'s Loyalty Points</h2>
        {customerConfigs.length === 0 ? (
          <p>No loyalty configurations for this customer.</p>
        ) : (
          <ul className="loyalty-config-list">
            {customerConfigs.map((config) => (
              <li key={config.id}>
                <strong>{config.name}:</strong>{" "}
                {config.pointsByCustomer && config.pointsByCustomer[customer.id]
                  ? config.pointsByCustomer[customer.id]
                  : 0}{" "}
                points
              </li>
            ))}
          </ul>
        )}
        <button className="modal-close-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default CustomerLoyaltyModal;
