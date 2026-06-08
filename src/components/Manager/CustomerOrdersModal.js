import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // For navigation to the invoice page
import { FaTimes, FaFileInvoiceDollar } from "react-icons/fa";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "../../styles/CustomerOrdersModal.css";

const CustomerOrdersModal = ({ customer, orders = [], onClose }) => {
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const navigate = useNavigate();

  // Sort orders by creation date (newest first)
  const sortedOrders = orders.slice().sort((a, b) => {
    const dateA =
      a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : new Date(0);
    const dateB =
      b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : new Date(0);
    return dateB - dateA;
  });

  // Debug log to check the orders fetched
  console.log("Fetched Orders for Customer:", sortedOrders);

  const handleGenerateInvoice = async (order) => {
    setIsGeneratingInvoice(true);
    try {
      const invoiceData = {
        customerId: customer.id,
        customerName: customer.name || "Unknown Customer",
        orderId: order.id,
        serialNumber: order.serialNumber || "N/A",
        items: order.items || [],
        totalPrice:
          order.totalPrice !== undefined ? order.totalPrice : 0,
        createdAt: new Date(),
      };

      // Save the invoice to Firestore (invoices collection)
      const docRef = await addDoc(collection(db, "invoices"), invoiceData);
      alert("Invoice generated successfully!");
      // Navigate to the Invoice Page using the new invoice document ID
      navigate(`/manager/invoice/${docRef.id}`);
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice.");
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{customer.name || "Customer"}'s Orders</h2>
          <button onClick={onClose} className="close-button">
            <FaTimes />
          </button>
        </div>
        {sortedOrders.length === 0 ? (
          <p className="no-orders">
            No orders found for this customer.
          </p>
        ) : (
          <div className="order-list">
            {sortedOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <span className="order-serial">
                    Serial: {order.serialNumber || "N/A"}
                  </span>
                  <span className="order-date">
                    {order.createdAt && order.createdAt.toDate
                      ? new Date(order.createdAt.toDate()).toLocaleString()
                      : "Unknown Date"}
                  </span>
                </div>
                <div className="order-card-body">
                  {(order.items || []).map((item, index) => (
                    <div key={index} className="order-item">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="order-item-image"
                      />
                      <div className="order-item-details">
                        <span className="order-item-name">
                          {item.name}
                        </span>
                        <span className="order-item-info">
                          {item.quantity} x ${item.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-card-footer">
                  <div className="order-total">
                    <strong>Total:</strong> $
                    {order.totalPrice !== undefined
                      ? order.totalPrice.toFixed(2)
                      : "0.00"}
                  </div>
                  <button
                    className="invoice-button"
                    onClick={() => handleGenerateInvoice(order)}
                    disabled={isGeneratingInvoice}
                  >
                    <FaFileInvoiceDollar className="invoice-icon" />
                    Generate Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrdersModal;
