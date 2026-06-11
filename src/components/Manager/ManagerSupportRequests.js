import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import ManagerLayout from "../Manager/ManagerLayout";
import "../../styles/ManagerDashboard.css";

const ManagerSupportRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, "supportRequests"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (_) {}
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <ManagerLayout>
      <div className="mgrs-page">
        <h1 className="mgrs-title">طلبات الدعم</h1>

        {loading ? (
          <div className="mgrs-loading"><div className="mgrs-spinner" /></div>
        ) : requests.length === 0 ? (
          <p className="mgrs-empty">لا توجد طلبات دعم حالياً</p>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="mgrs-card">
              <div className="mgrs-card-top">
                <h3 className="mgrs-subject">{r.subject}</h3>
                <span className="mgrs-date">
                  {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString("ar") : ""}
                </span>
              </div>
              <p className="mgrs-message">{r.message}</p>
              <p className="mgrs-from">{r.customerEmail}</p>
            </div>
          ))
        )}
      </div>
    </ManagerLayout>
  );
};

export default ManagerSupportRequests;
