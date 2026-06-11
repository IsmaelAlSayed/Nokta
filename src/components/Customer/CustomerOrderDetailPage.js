import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { FaArrowRight, FaBoxOpen } from "react-icons/fa";
import CustomerLayout from "./CustomerLayout";
import "../../styles/CustomerOrderDetailPage.css";

const STATUS_LABELS = {
  approved: "مقبول",
  rejected: "مرفوض",
  pending:  "قيد المراجعة",
};

const STATUS_COLORS = {
  approved: "cod-status--green",
  rejected: "cod-status--red",
  pending:  "cod-status--yellow",
};

const DELIVERY_LABELS = {
  delivery: "توصيل",
  pickup:   "استلام من المتجر",
};

const CustomerOrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getDoc(doc(db, "orders", orderId))
      .then((snap) => {
        if (snap.exists()) setOrder(snap.data());
        else setError("الطلب غير موجود");
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
      <div className="cod-error">{error}</div>
    </CustomerLayout>
  );

  return (
    <CustomerLayout>
      <div className="cod-page">
        <button className="cod-back" onClick={() => navigate(-1)}>
          <FaArrowRight />
          <span>رجوع</span>
        </button>

        <h1 className="cod-title">تفاصيل الطلب</h1>

        {/* Prize image */}
        {order.prizeImageUrl?.trim() ? (
          <div className="cod-img-wrap">
            <img
              src={order.prizeImageUrl}
              alt={order.prizeName}
              className="cod-prize-img"
            />
          </div>
        ) : (
          <div className="cod-no-img"><FaBoxOpen /></div>
        )}

        {/* Status badge */}
        <div className="cod-status-wrap">
          <span className={`cod-status ${STATUS_COLORS[order.status] || "cod-status--yellow"}`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>

        {/* Details card */}
        <div className="cod-card">
          <div className="cod-row">
            <span className="cod-label">اسم الجائزة</span>
            <span className="cod-value">{order.prizeName}</span>
          </div>
          <div className="cod-row">
            <span className="cod-label">طريقة الاستلام</span>
            <span className="cod-value">
              {DELIVERY_LABELS[order.deliveryMethod] || order.deliveryMethod}
            </span>
          </div>
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
              <span className="cod-label">الملاحظة</span>
              <span className="cod-value">{order.note}</span>
            </div>
          )}
          {order.rejectionReason && (
            <div className="cod-row cod-row--rejection">
              <span className="cod-label">سبب الرفض</span>
              <span className="cod-value">{order.rejectionReason}</span>
            </div>
          )}
          <div className="cod-row">
            <span className="cod-label">تاريخ الطلب</span>
            <span className="cod-value">
              {order.createdAt?.toDate
                ? order.createdAt.toDate().toLocaleDateString("ar-SA", {
                    year: "numeric", month: "long", day: "numeric",
                  })
                : "غير محدد"}
            </span>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerOrderDetailPage;
