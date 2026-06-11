import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { FaGift } from "react-icons/fa";
import "../../styles/CustomerDashboard.css";
import CustomerLayout from "../Customer/CustomerLayout";

const CustomerDashboard = () => {
  const [customerName, setCustomerName]   = useState("");
  const [groupedOffers, setGroupedOffers] = useState({});
  const [managers, setManagers]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const navigate = useNavigate();
  const currentCustomer = auth.currentUser;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentCustomer.uid));
        if (userDoc.exists()) {
          setCustomerName(userDoc.data().name || currentCustomer.email?.split("@")[0] || "مستخدم");
        }

        const loySnap = await getDocs(collection(db, "loyaltyPoints"));
        const assigned = loySnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((o) => o.customers?.includes(currentCustomer.uid));

        const grouped = assigned.reduce((acc, offer) => {
          if (!acc[offer.managerId]) acc[offer.managerId] = [];
          acc[offer.managerId].push(offer);
          return acc;
        }, {});
        setGroupedOffers(grouped);

        const managerIds = Object.keys(grouped);
        if (managerIds.length > 0) {
          const q = query(collection(db, "users"), where("role", "==", "manager"));
          const mSnap = await getDocs(q);
          setManagers(
            mSnap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((m) => managerIds.includes(m.id))
          );
        }
      } catch (_) {}
      setLoading(false);
    };
    fetchAll();
  }, [currentCustomer]);

  const getManager = (id) => managers.find((m) => m.id === id);

  return (
    <CustomerLayout>
      <div className="cd-page">
        {/* ── Welcome ── */}
        <div className="cd-welcome">
          <div className="cd-welcome-text">
            <p className="cd-greeting">مرحباً بك</p>
            <h1 className="cd-name">{customerName}</h1>
          </div>
          <div className="cd-welcome-icon"><FaGift /></div>
        </div>

        {loading ? (
          <div className="cd-loading"><div className="cd-spinner" /></div>
        ) : Object.keys(groupedOffers).length === 0 ? (
          <div className="cd-empty">
            <div className="cd-empty-icon">🏪</div>
            <p className="cd-empty-title">لا توجد متاجر مرتبطة بحسابك</p>
            <p className="cd-empty-sub">تواصل مع مدير المتجر لإضافتك</p>
          </div>
        ) : (
          <>
            <h2 className="cd-section-title">برامج الولاء الخاصة بك</h2>
            <div className="cd-grid">
              {Object.keys(groupedOffers).map((managerId) => {
                const mgr = getManager(managerId);
                if (!mgr) return null;
                const count = groupedOffers[managerId].length;
                return (
                  <div
                    key={managerId}
                    className="cd-store-card"
                    onClick={() => navigate(`/customer/manager-loyalty/${managerId}`)}
                  >
                    <div className="cd-store-logo">
                      {mgr.logoUrl ? (
                        <img
                          src={mgr.logoUrl}
                          alt={mgr.businessName}
                          className="cd-logo-img"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <span className="cd-logo-initials">
                          {mgr.businessName?.charAt(0).toUpperCase() || "م"}
                        </span>
                      )}
                    </div>
                    <h3 className="cd-store-name">{mgr.businessName || mgr.name}</h3>
                    <p className="cd-offer-count">{count} عرض</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerDashboard;
