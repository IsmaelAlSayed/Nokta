import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { FaArrowRight, FaStar } from "react-icons/fa";
import CustomerLayout from "./CustomerLayout";
import "../../styles/ManagerLoyaltyPage.css";

const ManagerLoyaltyPage = () => {
  const { managerId } = useParams();
  const [manager, setManager]               = useState(null);
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading]               = useState(true);
  const navigate  = useNavigate();
  const currentCustomer = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const managerDoc = await getDoc(doc(db, "users", managerId));
        if (managerDoc.exists()) setManager(managerDoc.data());

        const loyaltyQuery = query(
          collection(db, "loyaltyPoints"),
          where("managerId", "==", managerId),
          where("customers", "array-contains", currentCustomer.uid)
        );
        const snap = await getDocs(loyaltyQuery);
        setConfigurations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (_) {}
      setLoading(false);
    };
    fetchData();
  }, [managerId, currentCustomer.uid]);

  const businessName = manager?.businessName || manager?.name || "المتجر";
  const logoUrl      = manager?.logoUrl || "";

  return (
    <CustomerLayout>
      <div className="mlp-page">

        {/* ── Back ── */}
        <button className="mlp-back" onClick={() => navigate(-1)}>
          <FaArrowRight />
          <span>رجوع</span>
        </button>

        {/* ── Hero ── */}
        <div className="mlp-hero">
          <div className="mlp-hero-logo">
            {logoUrl
              ? <img src={logoUrl} alt={businessName} className="mlp-hero-logo-img" />
              : <FaStar />
            }
          </div>
          <div>
            <h1 className="mlp-biz-name">{businessName}</h1>
            <p className="mlp-biz-sub">{configurations.length} برنامج ولاء</p>
          </div>
        </div>

        {loading ? (
          <div className="mlp-loading"><div className="mlp-spinner" /></div>
        ) : configurations.length === 0 ? (
          <div className="mlp-empty">
            <p className="mlp-empty-title">لا توجد برامج ولاء متاحة لك</p>
            <p className="mlp-empty-sub">تواصل مع المتجر لمعرفة المزيد</p>
          </div>
        ) : (
          <div className="mlp-list">
            {configurations.map((config) => {
              const pts = config.pointsByCustomer?.[currentCustomer.uid] ?? 0;
              const sorted = config.prizes
                ? [...config.prizes].sort((a, b) => a.exchangingValue - b.exchangingValue)
                : [];
              const redeemed = config.redeemedPrizesByCustomer?.[currentCustomer.uid] || [];
              const nextIdx  = sorted.findIndex((_, i) => !redeemed.includes(i));
              const nextPrize = nextIdx !== -1 ? sorted[nextIdx] : null;

              let progress = 100;
              let progressLabel = "";
              if (nextPrize) {
                progress = Math.min(100, Math.round((pts / nextPrize.exchangingValue) * 100));
                const remaining = nextPrize.exchangingValue - pts;
                progressLabel = remaining > 0
                  ? `${remaining} نقطة للجائزة التالية`
                  : "جاهز للاستبدال! 🎁";
              } else if (sorted.length > 0) {
                progressLabel = "جمعت كل الجوائز 🎉";
              }

              return (
                <div
                  key={config.id}
                  className="mlp-config-card"
                  onClick={() => navigate(`/manager/royal-pass/${config.id}`)}
                >
                  <div className="mlp-card-top">
                    <div className="mlp-config-info">
                      <h2 className="mlp-config-name">{config.name}</h2>
                      <p className="mlp-config-rate">
                        {config.pointsPerDollar} نقطة / شيكل
                      </p>
                    </div>
                    <div className="mlp-config-pts">
                      <span className="mlp-pts-value">{pts}</span>
                      <span className="mlp-pts-label">نقطة</span>
                    </div>
                  </div>

                  {sorted.length > 0 && (
                    <div className="mlp-progress-section">
                      <div className="mlp-progress-bar">
                        <div
                          className="mlp-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {progressLabel && (
                        <p className="mlp-progress-label">{progressLabel}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </CustomerLayout>
  );
};

export default ManagerLoyaltyPage;
