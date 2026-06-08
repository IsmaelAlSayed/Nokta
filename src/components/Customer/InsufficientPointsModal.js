import React from "react";
import "../../styles/InsufficientPointsModal.css";

const InsufficientPointsModal = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>لا توجد نقاط كافية للحصول على الجائزة</p>
        <button className="close-modal" onClick={onClose}>حسناً</button>
      </div>
    </div>
  );
};

export default InsufficientPointsModal;
