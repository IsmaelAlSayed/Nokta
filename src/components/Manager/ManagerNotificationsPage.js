import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import ManagerLayout from "./ManagerLayout";
import "../../styles/ManagerNotifications.css";

const ManagerNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Query all pending orders created via RedeemPopup (customer orders)
    const notificationsQuery = query(
      collection(db, "orders"),
      where("source", "==", "redeemPopup"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const allNotifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(allNotifications);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleNotificationClick = async (notification) => {
    // If the notification is unread, mark it as read.
    if (!notification.read) {
      try {
        await updateDoc(doc(db, "orders", notification.id), { read: true });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
    // Navigate to a detail view page for this notification.
    // You can change the route to the appropriate component (e.g., /manager/notifications/:orderId).
    navigate(`/manager/orderforprize`);
  };

  return (
    <ManagerLayout>
    <div className="manager-notifications-page">
      <h1>إشعارات الطلبات</h1>
      {notifications.length === 0 ? (
        <p className="no-notifications">لا توجد إشعارات جديدة.</p>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card ${notification.read ? "read" : "unread"}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <h3>{notification.prizeName}</h3>
              <p>
                <strong>العميل:</strong> {notification.customerName}
              </p>
              <p>
                <strong>الهاتف:</strong> {notification.phone}
              </p>
              <p>
                <strong>الوقت:</strong>{" "}
                {notification.createdAt?.toDate
                  ? notification.createdAt.toDate().toLocaleString()
                  : "غير محدد"}
              </p>
              {!notification.read && <span className="new-label">جديد</span>}
            </div>
          ))}
        </div>
      )}
    </div>
    </ManagerLayout>
  );
};

export default ManagerNotificationsPage;
