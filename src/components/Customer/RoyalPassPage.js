import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { FaLock, FaArrowLeft } from "react-icons/fa";
import "../../styles/RoyalPassPage.css";
import CustomerLayout from "./CustomerLayout";

// Helper: Convert an original image URL to the resized URL.
const getResizedImageUrl = (originalUrl) => {
  if (!originalUrl) return "";
  const parts = originalUrl.split("?");
  if (parts.length < 2) return originalUrl;
  return `${parts[0]}_200x200?${parts[1]}`;
};

const RoyalPassPage = () => {
  const { configId } = useParams();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Get the current customer's UID from Firebase Auth.
  const currentCustomer = auth.currentUser;

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configDoc = await getDoc(doc(db, "loyaltyPoints", configId));
        if (configDoc.exists()) {
          setConfig(configDoc.data());
        } else {
          console.error("Configuration not found");
        }
      } catch (error) {
        console.error("Error fetching configuration:", error);
      }
      setLoading(false);
    };

    fetchConfig();
  }, [configId]);

  if (loading) return <p className="loading">Loading Royal Pass...</p>;
  if (!config) return <p className="error-message">Royal Pass not found.</p>;

  // Retrieve the current customer's points from this configuration.
  const customerPoints =
    config.pointsByCustomer && config.pointsByCustomer[currentCustomer.uid]
      ? config.pointsByCustomer[currentCustomer.uid]
      : 0;

  // Sort prizes by exchangingValue.
  const sortedPrizes = config.prizes
    ? [...config.prizes].sort((a, b) => a.exchangingValue - b.exchangingValue)
    : [];

  // Calculate cumulative thresholds for each prize.
  const cumulativeThresholds = sortedPrizes.reduce((acc, prize, index) => {
    const previous = index > 0 ? acc[index - 1] : 0;
    acc.push(previous + Number(prize.exchangingValue));
    return acc;
  }, []);

  // Maximum threshold is the cumulative value of the last prize.
  const maxThreshold = cumulativeThresholds.length > 0 ? cumulativeThresholds[cumulativeThresholds.length - 1] : 1;

  // Overall progress percentage (vertical fill).
  const progressPercent = Math.min((customerPoints / maxThreshold) * 100, 100);

  // Compute vertical positions (in percent) for each prize marker.
  const prizePositions = cumulativeThresholds.map(threshold =>
    100 - Math.min((threshold / maxThreshold) * 100, 100)
  );

  return (
    <CustomerLayout>
    <div className="royal-pass-page-container">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <h1>{config.name}</h1>
      </header>
      <div className="royal-pass-info">
        <p><strong>Points per Dollar:</strong> {config.pointsPerDollar}</p>
        <p><strong>Your Points in this Configuration:</strong> {customerPoints}</p>
      </div>
      <div className="royal-pass-progress-container">
        {/* Vertical progress line centered */}
        <div className="royal-pass-line">
          <div className="royal-pass-fill" style={{ height: `${progressPercent}%` }}></div>
        </div>
        {/* Prize markers container */}
        <div className="royal-pass-prizes">
          {sortedPrizes.map((prize, index) => {
            const requiredPoints = cumulativeThresholds[index];
            const isUnlocked = customerPoints >= requiredPoints;
            const topPos = prizePositions[index];
            return (
              <div key={index} className={`royal-pass-prize ${isUnlocked ? "unlocked" : ""}`} style={{ top: `${topPos}%` }}>
                <div className="prize-icon-container">
                  {prize.prizeImageUrl ? (
                    <img
                      src={getResizedImageUrl(prize.prizeImageUrl)}
                      alt={prize.prizeName}
                      className="prize-icon"
                    />
                  ) : (
                    <div className="prize-icon placeholder">
                      {prize.prizeName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="lock-overlay">
                    <FaLock />
                  </div>
                  <div className="prize-details-overlay">
                    <span className="prize-name">
                      {prize.prizeName}{prize.tier ? ` (Tier ${prize.tier})` : ""}
                    </span>
                    <span className="prize-threshold">{requiredPoints} pts</span>
                    {!isUnlocked && (
                      <span className="prize-remaining">
                        Remaining: {requiredPoints - customerPoints} pts
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </CustomerLayout>
  );
};

export default RoyalPassPage;
