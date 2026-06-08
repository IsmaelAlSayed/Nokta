import React from "react";
import "../../styles/ConfirmDeleteModal.css";

const ConfirmDeleteModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal-content">
        <h2>Confirm Delete</h2>
        <p>{message}</p>
        <div className="confirm-modal-buttons">
          <button className="confirm-button" onClick={onConfirm}>
            Yes
          </button>
          <button className="cancel-button" onClick={onCancel}>
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
