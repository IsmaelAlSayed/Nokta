import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, query, collection, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { FaLock } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "../../styles/LoyaltyRewards.css";
import RedeemPopup from "./RedeemPopup";
import InsufficientPointsModal from "./InsufficientPointsModal";
import CustomerLayout from "./CustomerLayout";

const getResizedImageUrl = (originalUrl) => {
  if (!originalUrl) return "";
  const parts = originalUrl.split("?");
  return parts.length < 2 ? originalUrl : `${parts[0]}_200x200?${parts[1]}`;
};

const LoyaltyRewardsPage = () => {
  const { configId } = useParams();
  const [config, setConfig]           = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [viewMode, setViewMode]       = useState("points");
  const [selectedPrize, setSelectedPrize]   = useState(null);
  const [showInsufficientPointsModal, setShowInsufficientPointsModal] = useState(false);

  const currentCustomer = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (currentCustomer) {
          const userDoc = await getDoc(doc(db, "users", currentCustomer.uid));
          if (userDoc.exists()) setCustomerData(userDoc.data());

          const configDoc = await getDoc(doc(db, "loyaltyPoints", configId));
          if (configDoc.exists()) setConfig(configDoc.data());
        }
      } catch (_) {}
      setLoading(false);
    };
    fetchData();
  }, [configId, currentCustomer]);

  if (loading) return (
    <CustomerLayout>
      <div className="loyalty-page">
        <p className="loading">جاري التحميل...</p>
      </div>
    </CustomerLayout>
  );

  if (!config) return (
    <CustomerLayout>
      <div className="loyalty-page">
        <p className="error-message">برنامج المكافآت غير موجود.</p>
      </div>
    </CustomerLayout>
  );

  const customerPoints   = config.pointsByCustomer?.[currentCustomer?.uid] || 0;
  const sortedPrizes     = config.prizes ? [...config.prizes].sort((a, b) => a.exchangingValue - b.exchangingValue) : [];
  const unlockedPrizes   = sortedPrizes.filter((p) => customerPoints >= p.exchangingValue);

  const handleRedeem = () => {
    if (unlockedPrizes.length > 0) {
      setSelectedPrize(unlockedPrizes[0]);
    } else {
      setShowInsufficientPointsModal(true);
    }
  };

  const handleConfirm = async (prize) => {
    try {
      await updateDoc(doc(db, "loyaltyPoints", configId), {
        [`pointsByCustomer.${currentCustomer.uid}`]: customerPoints - prize.exchangingValue,
      });
      setSelectedPrize(null);
      window.location.reload();
    } catch (_) {}
  };

  return (
    <CustomerLayout>
      <div className="loyalty-page">
        {/* Points Section */}
        <div className="points-section">
          <button
            className={`toggle-button ${viewMode === "currency" ? "active" : ""}`}
            onClick={() => setViewMode("currency")}
          >
            بالشيكل
          </button>
          <h1 className="points">
            {viewMode === "points" ? customerPoints : (customerPoints / 5).toFixed(0)}
            <span>{viewMode === "points" ? "عدد النقاط" : "بالشيكل"}</span>
          </h1>
          <button
            className={`toggle-button ${viewMode === "points" ? "active" : ""}`}
            onClick={() => setViewMode("points")}
          >
            بالنقاط
          </button>
        </div>

        {/* Prizes Slider */}
        <div className="prizes-slider">
          <Swiper spaceBetween={20} slidesPerView={1.3} centeredSlides grabCursor loop={false}>
            {sortedPrizes.map((prize, index) => (
              <SwiperSlide key={index} className="prize-slide">
                <div className={`prize-card ${customerPoints >= prize.exchangingValue ? "unlocked" : ""}`}>
                  <img
                    src={getResizedImageUrl(prize.prizeImageUrl)}
                    alt={prize.prizeName}
                    className="prize-image"
                  />
                  {customerPoints < prize.exchangingValue && (
                    <div className="prize-lock"><FaLock /></div>
                  )}
                  <h3 className="prize-name">{prize.prizeName}</h3>
                  <p className="prize-points">النقاط المطلوبة: {prize.exchangingValue}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Redeem Button */}
        <button className="redeem-button" onClick={handleRedeem}>
          حوّل نقاطك لمكافآت
        </button>

        {selectedPrize && (
          <RedeemPopup
            prize={selectedPrize}
            customerData={customerData}
            configId={configId}
            configName={config.name}
            onClose={() => setSelectedPrize(null)}
            onConfirm={handleConfirm}
          />
        )}

        {showInsufficientPointsModal && (
          <InsufficientPointsModal onClose={() => setShowInsufficientPointsModal(false)} />
        )}
      </div>
    </CustomerLayout>
  );
};

export default LoyaltyRewardsPage;
