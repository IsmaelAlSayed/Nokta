import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "../../styles/InvoiceView.css";

const InvoiceView = () => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const docRef = doc(db, "invoices", invoiceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setInvoice(docSnap.data());
        } else {
          console.error("Invoice not found");
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
      }
      setLoading(false);
    };

    fetchInvoice();
  }, [invoiceId]);

  if (loading) return <p className="loading">Loading Invoice...</p>;
  if (!invoice) return <p className="error-message">Invoice not found.</p>;

  // Format the creation date if available
  const invoiceDate =
    invoice.createdAt && invoice.createdAt.toDate
      ? invoice.createdAt.toDate()
      : new Date();

  return (
    <div className="invoice-container">
      <header className="invoice-header">
        <h1>Invoice</h1>
        <div className="invoice-meta">
          <span>
            <strong>Date:</strong> {invoiceDate.toLocaleDateString()}
          </span>
          <span>
            <strong>Serial Number:</strong> {invoice.serialNumber}
          </span>
        </div>
      </header>

      <section className="invoice-details">
        <p>
          <strong>Customer:</strong> {invoice.customerName}
        </p>
        <p>
          <strong>Total Price:</strong> ${invoice.totalPrice.toFixed(2)}
        </p>
      </section>

      <section className="invoice-items">
        <h2>Items</h2>
        <table className="invoice-table">
          <thead>
            <tr>
              <th className="col-product">Product</th>
              <th className="col-quantity">Quantity</th>
              <th className="col-price">Price</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="invoice-footer">
        <p className="footer-text">Thank you for your purchase!</p>
      </footer>
    </div>
  );
};

export default InvoiceView;
