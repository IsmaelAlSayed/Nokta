import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import ManagerLayout from "./ManagerLayout";
import "../../styles/ManagerDashboard.css";

const ManagerNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("source", "==", "redeemPopup"),
      where("status", "==", "pending")
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleClick = async (notif) => {
    if (!notif.read) {
      try {
        await updateDoc(doc(db, "orders", notif.id), { read: true });
      } catch (_) {}
    }
    navigate("/manager/orderforprize");
  };

  return (
    <ManagerLayout>
      <div className="mgrn-page">
        <h1 className="mgrn-title">الإشعارات</h1>

        {notifications.length === 0 ? (
          <p className="mgrn-empty">لا توجد إشعارات جديدة</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`mgrn-card ${n.read ? "" : "unread"}`}
              onClick={() => handleClick(n)}
            >
              <div className="mgrn-card-top">
                <h3 className="mgrn-prize-name">{n.prizeName}</h3>
                {!n.read && <span className="mgrn-new-badge">جديد</span>}
              </div>
              <p className="mgrn-row"><strong>الزبون:</strong> {n.customerName}</p>
              <p className="mgrn-row"><strong>الهاتف:</strong> {n.phone}</p>
              <p className="mgrn-row">
                <strong>الوقت:</strong>{" "}
                {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString("ar") : "غير محدد"}
              </p>
            </div>
          ))
        )}
      </div>
    </ManagerLayout>
  );
};

export default ManagerNotificationsPage;
