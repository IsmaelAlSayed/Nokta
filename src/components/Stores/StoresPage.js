import React, { useEffect, useState } from "react";
import { collection, getDocs, getDoc, query, where, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaSearch, FaChevronLeft, FaCompass, FaChevronDown, FaChevronUp } from "react-icons/fa";
import "../../styles/StoresPage.css";

const StoreCard = ({ store, programCounts, onClick }) => (
  <div className="sp-card" onClick={() => onClick(store.id)}>
    <div className="sp-card-logo">
      {store.logoUrl ? (
        <img src={store.logoUrl} alt={store.businessName} className="sp-logo-img"
          onError={(e) => { e.target.style.display = "none"; }} />
      ) : (
        <span className="sp-logo-initial">
          {(store.businessName || store.name || "م").charAt(0).toUpperCase()}
        </span>
      )}
    </div>
    <h3 className="sp-card-name">{store.businessName || store.name}</h3>
    {(programCounts[store.id] || 0) > 0 ? (
      <div className="sp-card-badge">
        <span className="sp-badge-val">{programCounts[store.id]}</span>
        <span className="sp-badge-lbl">برنامج ولاء</span>
      </div>
    ) : (
      <span className="sp-badge-none">لا يوجد برنامج حالياً</span>
    )}
  </div>
);

const StoresPage = () => {
  const [allManagers, setAllManagers]     = useState([]);
  const [programCounts, setProgramCounts] = useState({});
  const [myManagerIds, setMyManagerIds]   = useState(new Set());
  const [search, setSearch]               = useState("");
  const [loading, setLoading]             = useState(true);
  const [showDiscover, setShowDiscover]   = useState(false);
  const { currentUser, userRole }         = useAuth();
  const navigate                          = useNavigate();

  const isCustomer = currentUser && userRole === "customer";

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const fetches = [
          getDocs(query(collection(db, "users"), where("role", "==", "manager"))),
          getDocs(collection(db, "loyaltyPoints")),
        ];
        if (isCustomer) fetches.push(getDoc(doc(db, "users", currentUser.uid)));

        const [managersSnap, loyaltySnap, custDoc] = await Promise.all(fetches);

        const counts = {};
        loyaltySnap.docs.forEach((d) => {
          const { managerId } = d.data();
          if (managerId) counts[managerId] = (counts[managerId] || 0) + 1;
        });

        setAllManagers(managersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setProgramCounts(counts);

        if (custDoc?.exists()) {
          const data = custDoc.data();
          setMyManagerIds(new Set([data.managerId, ...(data.managerIds || [])].filter(Boolean)));
        }
      } catch (_) {}
      setLoading(false);
    };
    fetchAll();
  }, [isCustomer, currentUser]);

  const filterFn = (s) =>
    (s.businessName || s.name || "").toLowerCase().includes(search.toLowerCase());

  const myStores    = allManagers.filter((m) => myManagerIds.has(m.id)).filter(filterFn);
  const otherStores = allManagers.filter((m) => !myManagerIds.has(m.id)).filter(filterFn);
  const allFiltered = allManagers.filter(filterFn);

  const handleStoreClick = (managerId) => {
    if (isCustomer) navigate(`/customer/manager-loyalty/${managerId}`);
    else navigate("/login");
  };

  return (
    <div className="sp-page">
      {/* ── Hero ── */}
      <div className="sp-hero">
        <button className="sp-back" onClick={() => navigate(-1)}>
          <FaChevronLeft />
        </button>
        <div className="sp-hero-text">
          <h1 className="sp-hero-title">{isCustomer ? "متاجري" : "اكتشف المتاجر"}</h1>
          <p className="sp-hero-sub">
            {isCustomer
              ? "المتاجر التي أنت عضو فيها"
              : "جميع المتاجر المنضمة للموقع"}
          </p>
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
      ) : isCustomer ? (
        /* ─── Customer view: My Stores + Discover ─── */
        <>
          {/* My stores */}
          {myStores.length === 0 ? (
            <div className="sp-empty">
              <p className="sp-empty-icon">🏪</p>
              <p className="sp-empty-title">لا توجد متاجر مضافة</p>
              <p className="sp-empty-sub">اكتشف المتاجر وانضم لبرامج الولاء</p>
            </div>
          ) : (
            <>
              <p className="sp-count">{myStores.length} متجر</p>
              <div className="sp-grid">
                {myStores.map((store) => (
                  <StoreCard key={store.id} store={store} programCounts={programCounts} onClick={handleStoreClick} />
                ))}
              </div>
            </>
          )}

          {/* Discover button */}
          {otherStores.length > 0 && (
            <div className="sp-discover-section">
              <button
                className="sp-discover-btn"
                onClick={() => setShowDiscover((v) => !v)}
              >
                <FaCompass className="sp-discover-icon" />
                <span>استكشاف المتاجر</span>
                <span className="sp-discover-count">{otherStores.length}</span>
                {showDiscover ? <FaChevronUp className="sp-discover-chevron" /> : <FaChevronDown className="sp-discover-chevron" />}
              </button>

              {showDiscover && (
                <>
                  <p className="sp-discover-label">متاجر لم تنضم إليها بعد</p>
                  <div className="sp-grid">
                    {otherStores.map((store) => (
                      <StoreCard key={store.id} store={store} programCounts={programCounts} onClick={handleStoreClick} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        /* ─── Guest / non-customer view: all stores ─── */
        <>
          {allFiltered.length === 0 ? (
            <div className="sp-empty">
              <p className="sp-empty-icon">{search ? "🔍" : "🏪"}</p>
              <p className="sp-empty-title">{search ? "لا توجد نتائج" : "لا توجد متاجر حالياً"}</p>
              <p className="sp-empty-sub">{search ? "جرب كلمة بحث أخرى" : "سيتم إضافة متاجر قريباً"}</p>
            </div>
          ) : (
            <>
              <p className="sp-count">{allFiltered.length} متجر</p>
              <div className="sp-grid">
                {allFiltered.map((store) => (
                  <StoreCard key={store.id} store={store} programCounts={programCounts} onClick={handleStoreClick} />
                ))}
              </div>
            </>
          )}

          {!currentUser && (
            <div className="sp-guest-banner">
              <p className="sp-guest-text">سجّل دخولك للانضمام لبرامج الولاء واكسب نقاطك</p>
              <button className="sp-guest-btn" onClick={() => navigate("/login")}>
                تسجيل الدخول
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StoresPage;
