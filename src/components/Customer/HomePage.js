import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { FaGift, FaChevronLeft } from "react-icons/fa";
import CustomerLayout from "./CustomerLayout";
import "../../styles/ManagerHomePage.css";

const HomePage = () => {
  const [customerName, setCustomerName] = useState("");
  const [managers, setManagers]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const navigate = useNavigate();
  const currentCustomer = auth.currentUser;

  useEffect(() => {
    if (!currentCustomer) return;
    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentCustomer.uid));
        if (userDoc.exists()) setCustomerName(userDoc.data().name || "");

        const loySnap = await getDocs(collection(db, "loyaltyPoints"));
        const myConfigs = loySnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((c) => c.customers?.includes(currentCustomer.uid));

        const managerMap = new Map();
        myConfigs.forEach((config) => {
          const mid = config.managerId;
          if (!mid) return;
          if (!managerMap.has(mid)) {
            managerMap.set(mid, { managerId: mid, configs: [], totalPoints: 0 });
          }
          const entry = managerMap.get(mid);
          entry.configs.push(config);
          entry.totalPoints += config.pointsByCustomer?.[currentCustomer.uid] || 0;
        });

        const managerList = await Promise.all(
          Array.from(managerMap.values()).map(async (entry) => {
            try {
              const mDoc = await getDoc(doc(db, "users", entry.managerId));
              const d = mDoc.exists() ? mDoc.data() : {};
              return {
                ...entry,
                businessName: d.businessName || d.name || "متجر",
                logoUrl: d.logoUrl || "",
              };
            } catch {
              return { ...entry, businessName: "متجر", logoUrl: "" };
            }
          })
        );

        setManagers(managerList);
      } catch (_) {}
      setLoading(false);
    };
    fetchData();
  }, [currentCustomer]);

  const displayName = customerName || currentCustomer?.email?.split("@")[0] || "مستخدم";

  return (
    <CustomerLayout>
      <div className="mhp-page">

        {/* ── Welcome ── */}
        <div className="mhp-welcome">
          <div className="mhp-welcome-text">
            <p className="mhp-welcome-greeting">أهلاً وسهلاً 👋</p>
            <h1 className="mhp-welcome-name">{displayName}</h1>
          </div>
          <div className="mhp-welcome-icon"><FaGift /></div>
        </div>

        {loading ? (
          <div className="mhp-loading"><div className="mhp-spinner" /></div>
        ) : managers.length === 0 ? (
          <div className="mhp-empty">
            <div className="mhp-empty-icon">🏪</div>
            <p className="mhp-empty-title">لا توجد متاجر مرتبطة بحسابك</p>
            <p className="mhp-empty-sub">تواصل مع المتجر لإضافتك لبرنامج الولاء</p>
          </div>
        ) : (
          <>
            <h2 className="mhp-section-title">بطاقاتك</h2>
            <div className="mhp-grid">
              {managers.map((m) => (
                <div
                  key={m.managerId}
                  className="mhp-biz-card"
                  onClick={() => navigate(`/customer/manager/${m.managerId}`)}
                >
                  <div className="mhp-biz-logo">
                    {m.logoUrl
                      ? <img src={m.logoUrl} alt={m.businessName} className="mhp-biz-logo-img" />
                      : <span className="mhp-biz-initial">{m.businessName.charAt(0)}</span>
                    }
                  </div>
                  <div className="mhp-biz-info">
                    <h3 className="mhp-biz-name">{m.businessName}</h3>
                    <div className="mhp-biz-meta">
                      <span className="mhp-pts-badge">{m.totalPoints} نقطة</span>
                      <span className="mhp-configs-count">{m.configs.length} برنامج</span>
                    </div>
                  </div>
                  <FaChevronLeft className="mhp-arrow" />
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
