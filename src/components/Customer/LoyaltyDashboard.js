import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, query, collection, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { FiMenu } from "react-icons/fi";
import { FaLock, FaUserCircle, FaBell } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "../../styles/LoyaltyRewards.css";
import RedeemPopup from "./RedeemPopup";
import InsufficientPointsModal from "./InsufficientPointsModal";
import Sidebar from "./Sidebar"; // Import Sidebar

const getResizedImageUrl = (originalUrl) => {
  if (!originalUrl) return "";
  const parts = originalUrl.split("?");
  return parts.length < 2 ? originalUrl : `${parts[0]}_200x200?${parts[1]}`;
};

const LoyaltyRewardsPage = () => {
  const { configId } = useParams();
  const [config, setConfig] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("points");
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [showInsufficientPointsModal, setShowInsufficientPointsModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const currentCustomer = auth.currentUser;
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // Fetch customer data and loyalty configuration
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (currentCustomer) {
          const userDoc = await getDoc(doc(db, "users", currentCustomer.uid));
          if (userDoc.exists()) {
            setCustomerData(userDoc.data());
          }
          const configDoc = await getDoc(doc(db, "loyaltyPoints", configId));
          if (configDoc.exists()) {
            setConfig(configDoc.data());
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [configId, currentCustomer]);

  // Subscribe to orders for the current customer and calculate unread notifications
  useEffect(() => {
    if (!currentCustomer) return;
    const notificationsQuery = query(
      collection(db, "orders"),
      where("customerId", "==", currentCustomer.uid)
    );
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        // Count orders where customerRead is false or undefined
        const unread = ordersData.filter(order => order.customerRead === false || order.customerRead === undefined).length;
        setUnreadCount(unread);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
      }
    );
    return () => unsubscribe();
  }, [currentCustomer]);

  if (loading) return <p className="loading">Loading Rewards...</p>;
  if (!config) return <p className="error-message">Loyalty rewards not found.</p>;

  const customerPoints = config.pointsByCustomer?.[currentCustomer?.uid] || 0;
  const sortedPrizes = config.prizes ? [...config.prizes].sort((a, b) => a.exchangingValue - b.exchangingValue) : [];
  const unlockedPrizes = sortedPrizes.filter((prize) => customerPoints >= prize.exchangingValue);

  const handleRedeem = () => {
    if (unlockedPrizes.length > 0) {
      setSelectedPrize(unlockedPrizes[0]);
    } else {
      setShowInsufficientPointsModal(true);
    }
  };

  const handleConfirm = async (prize) => {
    const pointsToDeduct = prize.exchangingValue;
    try {
      await updateDoc(doc(db, "loyaltyPoints", configId), {
        [`pointsByCustomer.${currentCustomer.uid}`]: customerPoints - pointsToDeduct
      });
      setSelectedPrize(null);
      alert("تم استبدال الجائزة بنجاح!");
      window.location.reload();
    } catch (error) {
      console.error("Error deducting points:", error);
    }
  };

  return (
    <div className="loyalty-page">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <header className="header">
        <button className="menu-button" onClick={toggleSidebar}>
          <FiMenu />
        </button>
        <div className="header-right">
          <div className="profile-info">
            {currentCustomer?.photoURL ? (
              <img src={currentCustomer.photoURL} alt="User" className="profile-pic" />
            ) : (
              <FaUserCircle className="default-profile-icon" />
            )}
            <div className="profile-name">
              <h2>{customerData?.name || currentCustomer?.displayName || "User"}</h2>
              <p>Loyal Card No: {customerData?.loyalCardNo || "0000"}</p>
            </div>
          </div>
          <Link to="/customer/notifications" className="customer-notification-link">
            <FaBell className="customer-notification-icon" />
            <span className="customer-notification-badge">{unreadCount}</span>
          </Link>
        </div>
      </header>

      <div className="points-section">
        <button className={`toggle-button ${viewMode === "currency" ? "active" : ""}`} onClick={() => setViewMode("currency")}>
          بالشيكل
        </button>
        <h1 className="points">
          {viewMode === "points" ? customerPoints : (customerPoints / 5).toFixed(0)}
          <span>{viewMode === "points" ? "عدد النقاط" : "بالشيكل"}</span>
        </h1>
        <button className={`toggle-button ${viewMode === "points" ? "active" : ""}`} onClick={() => setViewMode("points")}>
          بالنقاط
        </button>
      </div>

      <div className="prizes-slider">
        <Swiper spaceBetween={20} slidesPerView={1.3} centeredSlides grabCursor loop={false}>
          {sortedPrizes.map((prize, index) => (
            <SwiperSlide key={index} className="prize-slide">
              <div className={`prize-card ${customerPoints >= prize.exchangingValue ? "unlocked" : ""}`}>
                <img src={getResizedImageUrl(prize.prizeImageUrl)} alt={prize.prizeName} className="prize-image" />
                {customerPoints < prize.exchangingValue && <div className="prize-lock"><FaLock /></div>}
                <h3 className="prize-name">{prize.prizeName}</h3>
                <p className="prize-points">عدد النقاط: {prize.exchangingValue}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <button className="redeem-button" onClick={handleRedeem}>
        حول نقاطك لوجبات
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
  );
};

export default LoyaltyRewardsPage;
