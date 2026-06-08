import React, { useState } from "react";
import "../../styles/DiscountModal.css";

const DiscountModal = ({ onApply, onClose }) => {
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");

  const handleApply = () => {
    if (!discountValue || isNaN(discountValue) || discountValue <= 0) {
      alert("Please enter a valid discount value.");
      return;
    }

    onApply({ type: discountType, value: parseFloat(discountValue) });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Apply Discount</h2>
        <label>
          <input
            type="radio"
            name="discountType"
            value="percentage"
            checked={discountType === "percentage"}
            onChange={(e) => setDiscountType(e.target.value)}
          />
          Percentage
        </label>
        <label>
          <input
            type="radio"
            name="discountType"
            value="value"
            checked={discountType === "value"}
            onChange={(e) => setDiscountType(e.target.value)}
          />
          Fixed Value
        </label>
        <input
          type="number"
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          placeholder="Enter discount"
          className="input-field"
        />
        <div className="modal-actions">
          <button onClick={handleApply} className="apply-button">
            Apply
          </button>
          <button onClick={onClose} className="cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscountModal;
