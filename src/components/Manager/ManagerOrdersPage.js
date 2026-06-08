import React, { useEffect, useState } from "react";
import { collection, doc, updateDoc, query, where, onSnapshot, increment } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import MangerLayout from "./ManagerLayout";
import "../../styles/ManagerOrders.css";

const ManagerOrdersPage = () => {
  const [orders, setOrders] = useState([]);

  // Filter states with persistence (default: Today, pending, All)
  const [filterDate, setFilterDate] = useState(localStorage.getItem("filterDate") || "Today");
  const [filterStatus, setFilterStatus] = useState(localStorage.getItem("filterStatus") || "pending");
  const [filterDelivery, setFilterDelivery] = useState(localStorage.getItem("filterDelivery") || "All");
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem("searchTerm") || "");

  // Persist filter values in localStorage when they change
  useEffect(() => { localStorage.setItem("filterDate", filterDate); }, [filterDate]);
  useEffect(() => { localStorage.setItem("filterStatus", filterStatus); }, [filterStatus]);
  useEffect(() => { localStorage.setItem("filterDelivery", filterDelivery); }, [filterDelivery]);
  useEffect(() => { localStorage.setItem("searchTerm", searchTerm); }, [searchTerm]);

  useEffect(() => {
    // Query orders created via RedeemPopup
    const ordersQuery = query(
      collection(db, "orders"),
      where("source", "==", "redeemPopup")
    );

    // Set up a real-time listener
    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersList);
      },
      (error) => {
        console.error("Error listening for orders:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Helper: filter orders by date based on the selected filter value.
  const orderPassesDateFilter = (order) => {
    if (filterDate === "All") return true;
    if (!order.createdAt || !order.createdAt.toDate) return false;
    const orderDate = order.createdAt.toDate();
    const now = new Date();
    let start, end;
    switch (filterDate) {
      case "Today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case "Yesterday":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "This month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case "Last month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "This year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear() + 1, 0, 1);
        break;
      case "Last year":
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return true;
    }
    return orderDate >= start && orderDate < end;
  };

  // Apply all filters to the orders list including search term
  const filteredOrders = orders.filter((order) => {
    const dateMatch = orderPassesDateFilter(order);
    const statusMatch = filterStatus === "All" ? true : order.status === filterStatus;
    const deliveryMatch = filterDelivery === "All" ? true : order.deliveryMethod === filterDelivery;
    const lowerSearchTerm = searchTerm.toLowerCase();
    const nameMatch = order.customerName && order.customerName.toLowerCase().includes(lowerSearchTerm);
    const phoneMatch = order.phone && order.phone.toLowerCase().includes(lowerSearchTerm);
    const searchMatch = lowerSearchTerm ? (nameMatch || phoneMatch) : true;
    return dateMatch && statusMatch && deliveryMatch && searchMatch;
  });

  const handleStatusUpdate = async (orderId, newStatus, order) => {
    if (newStatus === "rejected") {
      const reason = window.prompt("Please enter the reason for rejection:");
      if (!reason) {
        alert("You must provide a reason for rejection.");
        return;
      }
      try {
        // Update the order with rejection details and send a notification to the customer
        await updateDoc(doc(db, "orders", orderId), {
          status: newStatus,
          rejectionReason: reason,
          customerNotification: `Your order for ${order.prizeName} has been rejected. Reason: ${reason}`,
          customerRead: false,
        });
        // Refund points by updating the loyaltyPoints document (using configId from the order)
        const refundAmount = order.pointsUsed || 100;
        if (order.configId) {
          await updateDoc(doc(db, "loyaltyPoints", order.configId), {
            [`pointsByCustomer.${order.customerId}`]: increment(refundAmount),
          });
        } else {
          console.error("No configId found in order document for refunding points");
        }
      } catch (error) {
        console.error("Error updating order status:", error);
      }
    } else {
      try {
        // Update order for approved status and send notification to customer
        await updateDoc(doc(db, "orders", orderId), {
          status: newStatus,
          customerNotification: `Your order for ${order.prizeName} has been approved.`,
          customerRead: false,
        });
      } catch (error) {
        console.error("Error updating order status:", error);
      }
    }
  };

  return (
    <MangerLayout>
      <div className="manager-orders-page">
        <h1>طلبات العملاء</h1>
        
        {/* Filters and Search Section */}
        <div className="filters">
          <div className="filter">
            <label>التاريخ:</label>
            <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
              <option value="All">الكل</option>
              <option value="Today">اليوم</option>
              <option value="Yesterday">أمس</option>
              <option value="This month">هذا الشهر</option>
              <option value="Last month">الشهر الماضي</option>
              <option value="This year">هذا العام</option>
              <option value="Last year">العام الماضي</option>
            </select>
          </div>
          <div className="filter">
            <label>الحالة:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">الكل</option>
              <option value="approved">مقبول</option>
              <option value="rejected">مرفوض</option>
              <option value="pending">قيد الانتظار</option>
            </select>
          </div>
          <div className="filter">
            <label>طريقة الاستلام:</label>
            <select value={filterDelivery} onChange={(e) => setFilterDelivery(e.target.value)}>
              <option value="All">الكل</option>
              <option value="هنا">هنا</option>
              <option value="عن طريق التوصيل">عن طريق التوصيل</option>
            </select>
          </div>
          <div className="filter search-filter">
            <label>بحث:</label>
            <input
              type="text"
              placeholder="ابحث بالاسم أو الهاتف"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {filteredOrders.length === 0 ? (
          <p className="no-orders">لا توجد طلبات حتى الآن.</p>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <p className="order-number">Order No: {order.serialNumber || "N/A"}</p>
                  <h3>{order.prizeName}</h3>
                  <span className={`status ${order.status}`}>{order.status}</span>
                </div>
                <div className="order-details">
                  <p><strong>العميل:</strong> {order.customerName}</p>
                  <p><strong>الهاتف:</strong> {order.phone}</p>
                  <p><strong>العنوان:</strong> {order.address}</p>
                  <p><strong>طريقة الاستلام:</strong> {order.deliveryMethod}</p>
                  <p><strong>ملاحظة:</strong> {order.note || "لا توجد ملاحظة"}</p>
                  {order.rejectionReason && (
                    <p><strong>سبب الرفض:</strong> {order.rejectionReason}</p>
                  )}
                </div>
                {order.status === "pending" && (
                  <div className="order-actions">
                    <button
                      onClick={() => handleStatusUpdate(order.id, "approved", order)}
                      className="approve-button"
                    >
                      قبول
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(order.id, "rejected", order)}
                      className="reject-button"
                    >
                      رفض
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MangerLayout>
  );
};

export default ManagerOrdersPage;
