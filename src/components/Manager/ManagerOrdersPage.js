import React, { useEffect, useState } from "react";
import { collection, doc, updateDoc, query, where, onSnapshot, increment } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import ManagerLayout from "./ManagerLayout";
import "../../styles/ManagerDashboard.css";

const STATUS_LABELS = { pending: "قيد الانتظار", approved: "مقبول", rejected: "مرفوض" };

const ManagerOrdersPage = () => {
  const [orders, setOrders]           = useState([]);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [filterDate,     setFilterDate]     = useState(() => localStorage.getItem("filterDate")     || "Today");
  const [filterStatus,   setFilterStatus]   = useState(() => localStorage.getItem("filterStatus")   || "pending");
  const [filterDelivery, setFilterDelivery] = useState(() => localStorage.getItem("filterDelivery") || "All");
  const [searchTerm,     setSearchTerm]     = useState(() => localStorage.getItem("searchTerm")     || "");

  useEffect(() => { localStorage.setItem("filterDate",     filterDate);     }, [filterDate]);
  useEffect(() => { localStorage.setItem("filterStatus",   filterStatus);   }, [filterStatus]);
  useEffect(() => { localStorage.setItem("filterDelivery", filterDelivery); }, [filterDelivery]);
  useEffect(() => { localStorage.setItem("searchTerm",     searchTerm);     }, [searchTerm]);

  useEffect(() => {
    const q = query(collection(db, "orders"), where("source", "==", "redeemPopup"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const passesDate = (order) => {
    if (filterDate === "All") return true;
    if (!order.createdAt?.toDate) return false;
    const d = order.createdAt.toDate();
    const now = new Date();
    let start, end;
    switch (filterDate) {
      case "Today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case "Yesterday":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "This month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case "Last month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end   = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "This year":
        start = new Date(now.getFullYear(), 0, 1);
        end   = new Date(now.getFullYear() + 1, 0, 1);
        break;
      case "Last year":
        start = new Date(now.getFullYear() - 1, 0, 1);
        end   = new Date(now.getFullYear(), 0, 1);
        break;
      default: return true;
    }
    return d >= start && d < end;
  };

  const filtered = orders.filter((o) => {
    if (!passesDate(o)) return false;
    if (filterStatus   !== "All" && o.status         !== filterStatus)   return false;
    if (filterDelivery !== "All" && o.deliveryMethod !== filterDelivery) return false;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      const nameOk  = o.customerName?.toLowerCase().includes(t);
      const phoneOk = o.phone?.toLowerCase().includes(t);
      if (!nameOk && !phoneOk) return false;
    }
    return true;
  });

  const handleApprove = async (orderId, order) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "approved",
        customerNotification: `تمت الموافقة على طلبك للجائزة: ${order.prizeName}`,
        customerRead: false,
      });
    } catch (_) {}
  };

  const startReject = (orderId) => {
    setRejectingId(orderId);
    setRejectReason("");
  };

  const cancelReject = () => {
    setRejectingId(null);
    setRejectReason("");
  };

  const confirmReject = async (orderId, order) => {
    if (!rejectReason.trim()) return;
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "rejected",
        rejectionReason: rejectReason,
        customerNotification: `تم رفض طلبك للجائزة: ${order.prizeName}. السبب: ${rejectReason}`,
        customerRead: false,
      });
      const refundAmount = order.pointsUsed || 100;
      if (order.configId) {
        await updateDoc(doc(db, "loyaltyPoints", order.configId), {
          [`pointsByCustomer.${order.customerId}`]: increment(refundAmount),
        });
      }
      setRejectingId(null);
      setRejectReason("");
    } catch (_) {}
  };

  return (
    <ManagerLayout>
      <div className="mgro-page">
        <h1 className="mgro-title">طلبات استبدال النقاط</h1>

        {/* ── Filters ── */}
        <div className="mgro-filters">
          <div className="mgro-filter-row">
            <div className="mgro-filter">
              <label>التاريخ</label>
              <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
                <option value="All">الكل</option>
                <option value="Today">اليوم</option>
                <option value="Yesterday">أمس</option>
                <option value="This month">هذا الشهر</option>
                <option value="Last month">الشهر الماضي</option>
                <option value="This year">هذا العام</option>
                <option value="Last year">العام الماضي</option>
              </select>
            </div>
            <div className="mgro-filter">
              <label>الحالة</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="All">الكل</option>
                <option value="pending">قيد الانتظار</option>
                <option value="approved">مقبول</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>
          </div>
          <div className="mgro-filter-row">
            <div className="mgro-filter">
              <label>طريقة الاستلام</label>
              <select value={filterDelivery} onChange={(e) => setFilterDelivery(e.target.value)}>
                <option value="All">الكل</option>
                <option value="هنا">هنا</option>
                <option value="عن طريق التوصيل">توصيل</option>
              </select>
            </div>
            <div className="mgro-filter mgro-search">
              <label>بحث</label>
              <input
                type="text"
                placeholder="الاسم أو الهاتف"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Orders ── */}
        {filtered.length === 0 ? (
          <p className="mgro-empty">لا توجد طلبات</p>
        ) : (
          filtered.map((order) => (
            <div key={order.id} className="mgro-card">
              <div className="mgro-card-top">
                <div>
                  <p className="mgro-prize-name">{order.prizeName}</p>
                  <p className="mgro-serial">رقم الطلب: {order.serialNumber || "—"}</p>
                </div>
                <span className={`mgro-status ${order.status}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              <div className="mgro-details">
                <p className="mgro-row"><strong>الزبون:</strong> {order.customerName}</p>
                <p className="mgro-row"><strong>الهاتف:</strong> {order.phone}</p>
                <p className="mgro-row"><strong>العنوان:</strong> {order.address}</p>
                <p className="mgro-row"><strong>الاستلام:</strong> {order.deliveryMethod}</p>
                {order.note && <p className="mgro-row"><strong>ملاحظة:</strong> {order.note}</p>}
                {order.rejectionReason && (
                  <p className="mgro-row"><strong>سبب الرفض:</strong> {order.rejectionReason}</p>
                )}
              </div>

              {order.status === "pending" && (
                rejectingId === order.id ? (
                  <div className="mgro-reject-area">
                    <input
                      className="mgro-reject-input"
                      type="text"
                      placeholder="سبب الرفض..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      autoFocus
                    />
                    <div className="mgro-reject-row">
                      <button
                        className="mgro-confirm-btn"
                        onClick={() => confirmReject(order.id, order)}
                        disabled={!rejectReason.trim()}
                      >
                        تأكيد الرفض
                      </button>
                      <button className="mgro-cancel-btn" onClick={cancelReject}>
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mgro-actions">
                    <button className="mgro-approve-btn" onClick={() => handleApprove(order.id, order)}>
                      قبول
                    </button>
                    <button className="mgro-reject-btn" onClick={() => startReject(order.id)}>
                      رفض
                    </button>
                  </div>
                )
              )}
            </div>
          ))
        )}
      </div>
    </ManagerLayout>
  );
};

export default ManagerOrdersPage;
