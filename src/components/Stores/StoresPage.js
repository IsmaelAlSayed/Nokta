import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaSearch, FaChevronLeft } from "react-icons/fa";
import "../../styles/StoresPage.css";

const StoresPage = () => {
  const [stores, setStores]             = useState([]);
  const [programCounts, setProgramCounts] = useState({});
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(true);
  const { currentUser, userRole }       = useAuth();
  const navigate                        = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [managersSnap, loyaltySnap] = await Promise.all([
          getDocs(query(collection(db, "users"), where("role", "==", "manager"))),
          getDocs(collection(db, "loyaltyPoints")),
        ]);

        const counts = {};
        loyaltySnap.docs.forEach((d) => {
          const { managerId } = d.data();
          if (managerId) counts[managerId] = (counts[managerId] || 0) + 1;
        });

        const active = managersSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((m) => counts[m.id] > 0);

        setStores(active);
        setProgramCounts(counts);
      } catch (_) {}
      setLoading(false);
    };
    fetchAll();
  }, []);

  const filtered = stores.filter((s) =>
    (s.businessName || s.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleStoreClick = (managerId) => {
    if (currentUser && userRole === "customer") {
      navigate(`/customer/manager-loyalty/${managerId}`);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="sp-page">
      {/* ── Hero ── */}
      <div className="sp-hero">
        <button className="sp-back" onClick={() => navigate(-1)}>
          <FaChevronLeft />
        </button>
        <div className="sp-hero-text">
          <h1 className="sp-hero-title">اكتشف المتاجر</h1>
          <p className="sp-hero-sub">جميع المتاجر المنضمة لبرامج الولاء</p>
        </div>
        <div className="sp-hero-icon">🏪</div>
      </div>

      {/* ── Search ── */}
      <div className="sp-search-wrap">
        <FaSearch className="sp-search-icon" />
        <input
          className="sp-search"
          type="text"
          placeholder="ابحث عن متجر..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="sp-search-clear" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="sp-loading"><div className="sp-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="sp-empty">
          <p className="sp-empty-icon">{search ? "🔍" : "🏪"}</p>
          <p className="sp-empty-title">{search ? "لا توجد نتائج" : "لا توجد متاجر حالياً"}</p>
          <p className="sp-empty-sub">{search ? "جرب كلمة بحث أخرى" : "سيتم إضافة متاجر قريباً"}</p>
        </div>
      ) : (
        <>
          <p className="sp-count">{filtered.length} متجر</p>
          <div className="sp-grid">
            {filtered.map((store) => (
              <div key={store.id} className="sp-card" onClick={() => handleStoreClick(store.id)}>
                <div className="sp-card-logo">
                  {store.logoUrl ? (
                    <img
                      src={store.logoUrl}
                      alt={store.businessName}
                      className="sp-logo-img"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <span className="sp-logo-initial">
                      {(store.businessName || store.name || "م").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="sp-card-name">{store.businessName || store.name}</h3>
                <div className="sp-card-badge">
                  <span className="sp-badge-val">{programCounts[store.id] || 0}</span>
                  <span className="sp-badge-lbl">برنامج ولاء</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Guest banner ── */}
      {!currentUser && (
        <div className="sp-guest-banner">
          <p className="sp-guest-text">سجّل دخولك للانضمام لبرامج الولاء واكسب نقاطك</p>
          <button className="sp-guest-btn" onClick={() => navigate("/login")}>
            تسجيل الدخول
          </button>
        </div>
      )}
    </div>
  );
};

export default StoresPage;
