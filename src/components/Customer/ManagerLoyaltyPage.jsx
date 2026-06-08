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
          where("managerId", "==", managerId)
        );
        const snap = await getDocs(loyaltyQuery);
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setConfigurations(
          all.filter((c) => c.customers?.includes(currentCustomer.uid))
        );
      } catch (_) {}
      setLoading(false);
    };
    fetchData();
  }, [managerId, currentCustomer.uid]);

  const businessName =
    manager?.businessName || manager?.name || "المتجر";

  return (
    <CustomerLayout>
      <div className="mlp-page">
        {/* ── Back + Title ── */}
        <button className="mlp-back" onClick={() => navigate(-1)}>
          <FaArrowRight />
          <span>رجوع</span>
        </button>

        <div className="mlp-hero">
          <div className="mlp-hero-icon"><FaStar /></div>
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
              return (
                <div
                  key={config.id}
                  className="mlp-config-card"
                  onClick={() => navigate(`/manager/royal-pass/${config.id}`)}
                >
                  <div className="mlp-config-info">
                    <h2 className="mlp-config-name">{config.name}</h2>
                    <p className="mlp-config-rate">
                      {config.pointsPerDollar} نقطة لكل وحدة شراء
                    </p>
                  </div>
                  <div className="mlp-config-pts">
                    <span className="mlp-pts-value">{pts}</span>
                    <span className="mlp-pts-label">نقطة</span>
                  </div>
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
