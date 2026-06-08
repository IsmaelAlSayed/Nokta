import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, orderBy, query } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { FaFileInvoiceDollar } from "react-icons/fa";
import ManagerLayout from "./ManagerLayout";
import "../../styles/ManagerDashboard.css";

const ManagerCustomerOrdersPage = () => {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setOrders(snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((o) => !o.source || o.source !== "redeemPopup")
        );
      } catch (_) {}
      setLoading(false);
    };
    fetch();
  }, []);

  const handleInvoice = async (order) => {
    setGenerating(order.id);
    try {
      const docRef = await addDoc(collection(db, "invoices"), {
        customerId: order.customerId || "",
        customerName: order.customerName || "زبون",
        orderId: order.id,
        serialNumber: order.serialNumber || "—",
        items: order.items || [],
        totalPrice: order.totalPrice ?? 0,
        createdAt: new Date(),
      });
      navigate(`/manager/invoice/${docRef.id}`);
    } catch (_) {}
    setGenerating(null);
  };

  return (
    <ManagerLayout>
      <div className="mco-page">
        <h1 className="mco-title">طلبات المتجر</h1>

        {loading ? (
          <div className="mco-loading"><div className="mco-spinner" /></div>
        ) : orders.length === 0 ? (
          <p className="mco-empty">لا توجد طلبات حتى الآن</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="mco-card">
              <div className="mco-card-top">
                <p className="mco-serial">{order.serialNumber || "—"}</p>
                <span className="mco-date">
                  {order.createdAt?.toDate
                    ? order.createdAt.toDate().toLocaleDateString("ar")
                    : ""}
                </span>
              </div>

              {order.customerName && (
                <p className="mco-customer">الزبون: {order.customerName}</p>
              )}

              <div className="mco-items-list">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="mco-item">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="mco-item-img" />
                    )}
                    <p className="mco-item-name">{item.name}</p>
                    <span className="mco-item-qty">x{item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="mco-card-footer">
                <p className="mco-total">
                  الإجمالي: {(order.totalPrice ?? 0).toFixed(2)} ₪
                </p>
                <button
                  className="mco-invoice-btn"
                  onClick={() => handleInvoice(order)}
                  disabled={generating === order.id}
                >
                  <FaFileInvoiceDollar />
                  {generating === order.id ? "جاري..." : "فاتورة"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </ManagerLayout>
  );
};

export default ManagerCustomerOrdersPage;
