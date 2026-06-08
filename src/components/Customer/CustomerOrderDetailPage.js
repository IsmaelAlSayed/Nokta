import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import CustomerLayout from "./CustomerLayout";
import "../../styles/CustomerOrderDetailPage.css";

const CustomerOrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderDoc = await getDoc(doc(db, "orders", orderId));
        if (orderDoc.exists()) {
          const data = orderDoc.data();
          console.log("Fetched prizeImageUrl:", data.prizeImageUrl); // Debug log
          setOrder(data);
        } else {
          setError("Order not found.");
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Failed to fetch order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) return <p className="loading">Loading order details...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!order) return <p className="error">No order details available.</p>;

  return (
    <CustomerLayout>
      <div className="customer-order-detail-page">
        <h1>تفاصيل الطلب</h1>
        {order.prizeImageUrl && order.prizeImageUrl.trim() !== "" ? (
          <div className="prize-image-container">
            <img
              src={order.prizeImageUrl}
              alt={order.prizeName}
              className="prize-image-order"
            />
          </div>
        ) : (
          <p className="no-image">No image available</p>
        )}
        <div className="order-details">
          <p>
            <strong>اسم الجائزة:</strong> {order.prizeName}
          </p>
          <p>
            <strong>الحالة:</strong> {order.status}
          </p>
          {order.rejectionReason && (
            <p>
              <strong>سبب الرفض:</strong> {order.rejectionReason}
            </p>
          )}
          <p>
            <strong>طريقة الاستلام:</strong> {order.deliveryMethod}
          </p>
          <p>
            <strong>الملاحظة:</strong> {order.note || "لا توجد ملاحظة"}
          </p>
          <p>
            <strong>الهاتف:</strong> {order.phone}
          </p>
          <p>
            <strong>العنوان:</strong> {order.address}
          </p>
          <p>
            <strong>تاريخ الطلب:</strong>{" "}
            {order.createdAt?.toDate
              ? order.createdAt.toDate().toLocaleString()
              : "غير محدد"}
          </p>
        </div>
        <Link to="/customer/notifications" className="back-button">
          العودة إلى الإشعارات
        </Link>
      </div>
    </CustomerLayout>
  );
};

export default CustomerOrderDetailPage;
