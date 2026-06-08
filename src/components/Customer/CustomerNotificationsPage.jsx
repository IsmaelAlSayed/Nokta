import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { FaBell, FaChevronLeft } from "react-icons/fa";
import CustomerLayout from "./CustomerLayout";
import "../../styles/CustomerNotifications.css";

const STATUS_LABELS = {
  approved: "مقبول",
  rejected: "مرفوض",
  pending:  "قيد المراجعة",
};

const STATUS_COLORS = {
  approved: "cn-status--green",
  rejected: "cn-status--red",
  pending:  "cn-status--yellow",
};

const CustomerNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const currentCustomer = auth.currentUser;

  useEffect(() => {
    if (!currentCustomer) return;
    const q = query(
      collection(db, "orders"),
      where("customerId", "==", currentCustomer.uid)
    );
    return onSnapshot(q, (snap) => {
      const notifs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const aT = a.createdAt?.toDate?.() ?? new Date(0);
          const bT = b.createdAt?.toDate?.() ?? new Date(0);
          return bT - aT;
        });
      setNotifications(notifs);
    });
  }, [currentCustomer]);

  const handleClick = async (n) => {
    if (!n.customerRead) {
      try {
        await updateDoc(doc(db, "orders", n.id), { customerRead: true });
      } catch (_) {}
    }
    navigate(`/customer/order/${n.id}`);
  };

  const unreadCount = notifications.filter((n) => !n.customerRead).length;

  return (
    <CustomerLayout>
      <div className="cn-page">
        {/* ── Header ── */}
        <div className="cn-hero">
          <div className="cn-hero-icon"><FaBell /></div>
          <div>
            <h1 className="cn-hero-title">إشعاراتي</h1>
            {unreadCount > 0 && (
              <p className="cn-hero-sub">{unreadCount} إشعار جديد</p>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="cn-empty">
            <div className="cn-empty-icon">🔔</div>
            <p className="cn-empty-title">لا توجد إشعارات</p>
            <p className="cn-empty-sub">ستظهر طلباتك وتحديثاتها هنا</p>
          </div>
        ) : (
          <div className="cn-list">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`cn-card ${n.customerRead ? "" : "cn-card--unread"}`}
                onClick={() => handleClick(n)}
              >
                <div className="cn-card-body">
                  <div className="cn-card-top">
                    <h3 className="cn-prize-name">{n.prizeName || "جائزة"}</h3>
                    {!n.customerRead && <span className="cn-new-label">جديد</span>}
                  </div>
                  <div className="cn-card-meta">
                    <span className={`cn-status ${STATUS_COLORS[n.status] || "cn-status--yellow"}`}>
                      {STATUS_LABELS[n.status] || n.status}
                    </span>
                    <span className="cn-date">
                      {n.createdAt?.toDate
                        ? n.createdAt.toDate().toLocaleDateString("ar-SA")
                        : "غير محدد"}
                    </span>
                  </div>
                  {n.rejectionReason && (
                    <p className="cn-rejection">سبب الرفض: {n.rejectionReason}</p>
                  )}
                </div>
                <FaChevronLeft className="cn-arrow" />
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerNotificationsPage;
