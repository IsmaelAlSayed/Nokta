import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { FaStore, FaGift } from "react-icons/fa";
import CustomerLayout from "./CustomerLayout";
import "../../styles/ManagerHomePage.css";

const HomePage = () => {
  const [businesses, setBusinesses]           = useState([]);
  const [loyaltyConfigs, setLoyaltyConfigs]   = useState([]);
  const [loading, setLoading]                 = useState(true);
  const navigate = useNavigate();
  const currentCustomer = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bizSnap, loySnap] = await Promise.all([
          getDocs(collection(db, "businesses")),
          getDocs(collection(db, "loyaltyPoints")),
        ]);
        setBusinesses(bizSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoyaltyConfigs(loySnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (_) {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredLoyalty = loyaltyConfigs.filter(
    (c) => c.customers?.includes(currentCustomer?.uid)
  );

  const businessMap = new Map();
  filteredLoyalty.forEach((config) => {
    const biz = businesses.find((b) => b.id === config.businessId);
    if (biz) businessMap.set(biz.id, biz);
  });
  const myBusinesses = Array.from(businessMap.values());

  const offerCount = (bizId) =>
    filteredLoyalty.filter((c) => c.businessId === bizId).length;

  return (
    <CustomerLayout>
      <div className="mhp-page">
        {/* ── Welcome ── */}
        <div className="mhp-welcome">
          <div className="mhp-welcome-text">
            <p className="mhp-welcome-greeting">مرحباً بك</p>
            <h1 className="mhp-welcome-name">
              {auth.currentUser?.email?.split("@")[0] || "مستخدم"}
            </h1>
          </div>
          <div className="mhp-welcome-icon"><FaGift /></div>
        </div>

        {loading ? (
          <div className="mhp-loading"><div className="mhp-spinner" /></div>
        ) : myBusinesses.length === 0 ? (
          <div className="mhp-empty">
            <div className="mhp-empty-icon">🏪</div>
            <p className="mhp-empty-title">لا توجد متاجر مرتبطة بحسابك</p>
            <p className="mhp-empty-sub">تواصل مع مدير المتجر لإضافتك</p>
          </div>
        ) : (
          <>
            <h2 className="mhp-section-title">متاجرك</h2>
            <div className="mhp-grid">
              {myBusinesses.map((biz) => (
                <div
                  key={biz.id}
                  className="mhp-biz-card"
                  onClick={() => navigate(`/customer/manager/${biz.managerId || biz.id}`)}
                >
                  <div className="mhp-biz-icon"><FaStore /></div>
                  <div className="mhp-biz-info">
                    <h3 className="mhp-biz-name">{biz.name}</h3>
                    <span className="mhp-offers-badge">
                      {offerCount(biz.id)} عرض
                    </span>
                  </div>
                  <span className="mhp-arrow">←</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </CustomerLayout>
  );
};

export default HomePage;
