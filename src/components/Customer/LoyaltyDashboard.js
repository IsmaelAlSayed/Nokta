import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, query, collection, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { FaLock, FaCheck } from "react-icons/fa";
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

  const customerPoints    = config.pointsByCustomer?.[currentCustomer?.uid] || 0;
  const sortedPrizes      = config.prizes ? [...config.prizes].sort((a, b) => a.exchangingValue - b.exchangingValue) : [];
  const redeemedPrizes    = config.redeemedPrizesByCustomer?.[currentCustomer?.uid] || [];
  const nextPrizeIndex    = sortedPrizes.findIndex((_, idx) => !redeemedPrizes.includes(idx));
  const nextPrize         = nextPrizeIndex !== -1 ? sortedPrizes[nextPrizeIndex] : null;
  const canRedeem         = nextPrize && customerPoints >= nextPrize.exchangingValue;

  const handleRedeem = () => {
    if (!nextPrize || !canRedeem) {
      setShowInsufficientPointsModal(true);
    } else {
      setSelectedPrize(nextPrize);
    }
  };

  const handleConfirm = async (prize) => {
    try {
      const prizeIdx = sortedPrizes.findIndex(
        (p) => p.prizeName === prize.prizeName && p.exchangingValue === prize.exchangingValue
      );
      const currentRedeemed = config.redeemedPrizesByCustomer?.[currentCustomer.uid] || [];
      await updateDoc(doc(db, "loyaltyPoints", configId), {
        [`pointsByCustomer.${currentCustomer.uid}`]: customerPoints - prize.exchangingValue,
        [`redeemedPrizesByCustomer.${currentCustomer.uid}`]: [...currentRedeemed, prizeIdx],
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
            {sortedPrizes.map((prize, index) => {
              const isRedeemed = redeemedPrizes.includes(index);
              const isNext     = index === nextPrizeIndex;
              const isLocked   = !isRedeemed && customerPoints < prize.exchangingValue;
              return (
                <SwiperSlide key={index} className="prize-slide">
                  <div className={`prize-card${isRedeemed ? " redeemed" : isNext ? " next-prize" : ""}`}>
                    <img
                      src={getResizedImageUrl(prize.prizeImageUrl)}
                      alt={prize.prizeName}
                      className="prize-image"
                    />
                    {isRedeemed && (
                      <div className="prize-check"><FaCheck /></div>
                    )}
                    {!isRedeemed && isLocked && (
                      <div className="prize-lock"><FaLock /></div>
                    )}
                    <h3 className="prize-name">{prize.prizeName}</h3>
                    <p className="prize-points">النقاط المطلوبة: {prize.exchangingValue}</p>
                  </div>
                </SwiperSlide>
              );
            })}
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
