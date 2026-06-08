import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import CustomerLayout from "./CustomerLayout";
import "../../styles/CustomerNotifications.css";

const CustomerNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const currentCustomer = auth.currentUser;

  useEffect(() => {
    if (!currentCustomer) return;

    // Query orders where the customer is the current user.
    const notificationsQuery = query(
      collection(db, "orders"),
      where("customerId", "==", currentCustomer.uid)
      // Uncomment next line if you want to filter by status
      //, where("status", "in", ["approved", "rejected"])
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notifs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort notifications by createdAt in descending order (newest first)
        const sortedNotifs = notifs.sort((a, b) => {
          const aDate = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : new Date(0);
          const bDate = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : new Date(0);
          return bDate - aDate;
        });
        setNotifications(sortedNotifs);
      },
      (error) => {
        console.error("Error fetching customer notifications:", error);
      }
    );
    return () => unsubscribe();
  }, [currentCustomer]);

  const handleNotificationClick = async (notification) => {
    // If the notification is unread, mark it as read
    if (!notification.customerRead) {
      try {
        await updateDoc(doc(db, "orders", notification.id), { customerRead: true });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
    // Navigate to a detailed view (adjust the route as needed)
    navigate(`/customer/order/${notification.id}`);
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.customerRead).length;

  return (
    <CustomerLayout>
      <div className="customer-notifications-page">
        <h1>إشعاراتك</h1>
        <div className="notification-header">
          <p>عدد الإشعارات الجديدة: {unreadCount}</p>
        </div>
        {notifications.length === 0 ? (
          <p className="no-notifications">لا توجد إشعارات.</p>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-card ${notification.customerRead ? "read" : "unread"}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <h3>{notification.prizeName}</h3>
                <p>
                  <strong>الحالة:</strong> {notification.status}
                </p>
                {notification.rejectionReason && (
                  <p>
                    <strong>سبب الرفض:</strong> {notification.rejectionReason}
                  </p>
                )}
                <p>
                  <strong>الوقت:</strong>{" "}
                  {notification.createdAt?.toDate
                    ? notification.createdAt.toDate().toLocaleString()
                    : "غير محدد"}
                </p>
                {!notification.customerRead && <span className="new-label">جديد</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerNotificationsPage;
