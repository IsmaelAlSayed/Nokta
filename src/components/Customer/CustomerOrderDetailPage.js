import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { FaArrowRight, FaBoxOpen, FaGift } from "react-icons/fa";
import CustomerLayout from "./CustomerLayout";
import "../../styles/CustomerOrderDetailPage.css";

const STATUS_LABELS = {
  approved: "مقبول",
  rejected: "مرفوض",
  pending:  "قيد المراجعة",
};

const STATUS_CLASSES = {
  approved: "cod-status--green",
  rejected: "cod-status--red",
  pending:  "cod-status--yellow",
};

const DELIVERY_LABELS = {
  delivery: "توصيل للمنزل",
  pickup:   "استلام من المتجر",
};

const CustomerOrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = auth.currentUser;
    getDoc(doc(db, "orders", orderId))
      .then((snap) => {
        if (!snap.exists()) { setError("الطلب غير موجود"); return; }
        const data = snap.data();
        if (data.customerId !== currentUser?.uid) {
          setError("ليس لديك صلاحية لعرض هذا الطلب");
          return;
        }
        setOrder(data);
      })
      .catch(() => setError("حدث خطأ أثناء تحميل الطلب"))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return (
    <CustomerLayout>
      <div className="cod-loading"><div className="cod-spinner" /></div>
    </CustomerLayout>
  );

  if (error) return (
    <CustomerLayout>
      <div className="cod-error"><FaBoxOpen className="cod-error-icon" />{error}</div>
    </CustomerLayout>
  );

  const isPrize = Boolean(order.source === "redeemPopup" || order.prizeName);
  const items   = order.items || [];
  const date    = order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
    : "غير محدد";

  return (
    <CustomerLayout>
      <div className="cod-page">

        {/* ── Back + Title ── */}
        <div className="cod-topbar">
          <button className="cod-back" onClick={() => navigate(-1)}>
            <FaArrowRight />
          </button>
          <h1 className="cod-title">تفاصيل الطلب</h1>
        </div>

        {/* ── Status badge (prominent) ── */}
        <div className="cod-status-wrap">
          <span className={`cod-status ${STATUS_CLASSES[order.status] || "cod-status--yellow"}`}>
            {STATUS_LABELS[order.status] || "قيد المراجعة"}
          </span>
        </div>

        {/* ════════════════════════════
            PRIZE ORDER
        ════════════════════════════ */}
        {isPrize && (
          <>
            {/* Prize image */}
            <div className="cod-img-wrap">
              {order.prizeImageUrl?.trim() ? (
                <img src={order.prizeImageUrl} alt={order.prizeName} className="cod-prize-img" />
              ) : (
                <div className="cod-no-img"><FaGift /></div>
              )}
            </div>

            {order.prizeName && (
              <h2 className="cod-prize-name">{order.prizeName}</h2>
            )}

            <div className="cod-card">
              {order.deliveryMethod && (
                <div className="cod-row">
                  <span className="cod-label">طريقة الاستلام</span>
                  <span className="cod-value">{DELIVERY_LABELS[order.deliveryMethod] || order.deliveryMethod}</span>
                </div>
              )}
              {order.phone && (
                <div className="cod-row">
                  <span className="cod-label">الهاتف</span>
                  <span className="cod-value" dir="ltr">{order.phone}</span>
                </div>
              )}
              {order.address && (
                <div className="cod-row">
                  <span className="cod-label">العنوان</span>
                  <span className="cod-value">{order.address}</span>
                </div>
              )}
              {order.note && (
                <div className="cod-row">
                  <span className="cod-label">ملاحظة</span>
                  <span className="cod-value">{order.note}</span>
                </div>
              )}
              {order.rejectionReason && (
                <div className="cod-row cod-row--rejection">
                  <span className="cod-label">سبب الرفض</span>
                  <span className="cod-value cod-value--red">{order.rejectionReason}</span>
                </div>
              )}
              <div className="cod-row">
                <span className="cod-label">تاريخ الطلب</span>
                <span className="cod-value">{date}</span>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════
            MANAGER ORDER (items list)
        ════════════════════════════ */}
        {!isPrize && (
          <>
            {order.serialNumber && (
              <p className="cod-serial">رقم الطلب: #{order.serialNumber}</p>
            )}

            {/* Items list */}
            <div className="cod-items-card">
              <p className="cod-items-header">المنتجات</p>
              {items.length === 0 ? (
                <div className="cod-no-img"><FaBoxOpen /></div>
              ) : (
                <ul className="cod-items-list">
                  {items.map((item, i) => (
                    <li key={i} className="cod-item">
                      <div className="cod-item-img-wrap">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="cod-item-img"
                            onError={(e) => { e.target.style.display = "none"; }} />
                        ) : (
                          <div className="cod-item-no-img"><FaBoxOpen /></div>
                        )}
                      </div>
                      <div className="cod-item-info">
                        <p className="cod-item-name">{item.name}</p>
                        <p className="cod-item-unit">{item.price?.toFixed(2)} ₪ × {item.quantity}</p>
                      </div>
                      <p className="cod-item-total">{(item.price * item.quantity).toFixed(2)} ₪</p>
                    </li>
                  ))}
                </ul>
              )}

              {/* Divider + totals */}
              {items.length > 0 && (
                <div className="cod-totals">
                  <div className="cod-total-row">
                    <span className="cod-total-label">المجموع</span>
                    <span className="cod-total-value">{order.totalPrice?.toFixed(2)} ₪</span>
                  </div>
                  {order.earnedLoyaltyPoints > 0 && (
                    <div className="cod-total-row cod-total-row--points">
                      <span className="cod-total-label">نقاط مكتسبة</span>
                      <span className="cod-pts-value">+{Math.round(order.earnedLoyaltyPoints)} نقطة</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Meta card */}
            <div className="cod-card">
              {order.rejectionReason && (
                <div className="cod-row cod-row--rejection">
                  <span className="cod-label">سبب الرفض</span>
                  <span className="cod-value cod-value--red">{order.rejectionReason}</span>
                </div>
              )}
              <div className="cod-row">
                <span className="cod-label">تاريخ الطلب</span>
                <span className="cod-value">{date}</span>
              </div>
            </div>
          </>
        )}

      </div>
    </CustomerLayout>
  );
};

export default CustomerOrderDetailPage;
