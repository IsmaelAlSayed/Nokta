import React, { useState } from "react";
import { collection, addDoc, updateDoc, Timestamp, doc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import "../../styles/RedeemPopup.css";

const RedeemPopup = ({ prize, customerData, configId, config, configName, onClose, onConfirm }) => {
  const [deliveryOption, setDeliveryOption] = useState("");
  const [note, setNote] = useState("");
  const [customInfo, setCustomInfo] = useState({
    name: customerData?.name || "",
    phone: customerData?.phone || "",
    address: customerData?.address || ""
  });

  const currentCustomer = auth.currentUser;

  const createOrder = async (deliveryMethod, info) => {
    try {
      // Safely get the current order counter, default to 0 if config is undefined
      const currentCounter = config ? (config.orderCounter || 0) : 0;
      const newCounter = currentCounter + 1;
      
      // Update the loyalty configuration document only if config exists
      if (config) {
        await updateDoc(doc(db, "loyaltyPoints", configId), {
          orderCounter: newCounter
        });
      }
      
      // Generate serial number in the format: "Offer 1-0000000000001"
      const serialNumber = `${configName}-${newCounter.toString().padStart(13, "0")}`;

      await addDoc(collection(db, "orders"), {
        prizeName: prize.prizeName,
        prizeImageUrl: prize.prizeImageUrl, // Store the prize image URL
        customerId: currentCustomer.uid,
        customerName: info.name,
        phone: info.phone,
        address: info.address,
        deliveryMethod,
        status: "pending",
        createdAt: Timestamp.now(),
        source: "redeemPopup",
        note,
        pointsUsed: prize.exchangingValue,
        configId,
        serialNumber,
        read: false,
        customerRead: false
      });
      alert("تم إنشاء الطلب بنجاح!");
      onConfirm(prize);
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h3 className="popup-title">
          هل تريد استلام جائزتك هنا أم عن طريق التوصيل؟
        </h3>

        <div className="note-section">
          <label>ملاحظة (اختياري):</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="أضف ملاحظة إذا رغبت"
          />
        </div>

        <div className="options-container">
          <button
            className="option-button"
            onClick={() => createOrder("هنا", customInfo)}
          >
            هنا
          </button>
          <button
            className="option-button"
            onClick={() => setDeliveryOption("عن طريق التوصيل")}
          >
            عن طريق التوصيل
          </button>
        </div>

        {deliveryOption === "عن طريق التوصيل" && (
          <div className="delivery-form">
            <label>الاسم:</label>
            <input
              type="text"
              value={customInfo.name}
              onChange={(e) =>
                setCustomInfo({ ...customInfo, name: e.target.value })
              }
              placeholder="ادخل اسمك"
            />
            <label>رقم الهاتف:</label>
            <input
              type="text"
              value={customInfo.phone}
              onChange={(e) =>
                setCustomInfo({ ...customInfo, phone: e.target.value })
              }
              placeholder="ادخل رقم هاتفك"
            />
            <label>العنوان:</label>
            <input
              type="text"
              value={customInfo.address}
              onChange={(e) =>
                setCustomInfo({ ...customInfo, address: e.target.value })
              }
              placeholder="ادخل عنوانك"
            />
            <button
              className="confirm-button"
              onClick={() => createOrder("عن طريق التوصيل", customInfo)}
            >
              تأكيد الطلب
            </button>
          </div>
        )}

        <button className="close-button" onClick={onClose}>
          إلغاء
        </button>
      </div>
    </div>
  );
};

export default RedeemPopup;
