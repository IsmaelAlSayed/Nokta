import React, { useState, useEffect } from "react";
import {
  collection, addDoc, getDocs, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { FaHeadset, FaChevronDown } from "react-icons/fa";
import CustomerLayout from "./CustomerLayout";
import "../../styles/CustomerSupport.css";

const CustomerSupport = () => {
  const [subject, setSubject]   = useState("");
  const [message, setMessage]   = useState("");
  const [phone, setPhone]       = useState("");
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [requests, setRequests] = useState([]);
  const currentCustomer = auth.currentUser;

  const fetchRequests = async () => {
    try {
      const q = query(
        collection(db, "supportRequests"),
        where("customerEmail", "==", currentCustomer.email),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (_) {}
  };

  useEffect(() => {
    if (currentCustomer?.email) fetchRequests();
  }, [currentCustomer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await addDoc(collection(db, "supportRequests"), {
        subject,
        message,
        phone,
        customerEmail: currentCustomer.email,
        createdAt: serverTimestamp(),
      });
      setSent(true);
      setSubject("");
      setMessage("");
      setPhone("");
      fetchRequests();
      setTimeout(() => setSent(false), 4000);
    } catch (_) {}
    setSending(false);
  };

  return (
    <CustomerLayout>
      <div className="cs-page">
        {/* ── Hero ── */}
        <div className="cs-hero">
          <div className="cs-hero-icon"><FaHeadset /></div>
          <div>
            <h1 className="cs-hero-title">الدعم والمساعدة</h1>
            <p className="cs-hero-sub">فريقنا مستعد للمساعدة في أي وقت</p>
          </div>
        </div>

        {/* ── Form Card ── */}
        <div className="cs-card">
          <div className="cs-card-header">
            <h2>أرسل طلب دعم</h2>
          </div>
          <form onSubmit={handleSubmit} className="cs-form">
            {sent && (
              <div className="cs-success">
                تم إرسال طلبك بنجاح، سنتواصل معك قريباً
              </div>
            )}
            <div className="cs-field">
              <label>الموضوع</label>
              <input
                type="text"
                className="cs-input"
                placeholder="موضوع طلبك"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="cs-field">
              <label>رقم الهاتف</label>
              <input
                type="tel"
                className="cs-input"
                placeholder="+966 5X XXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                required
              />
            </div>
            <div className="cs-field">
              <label>الرسالة</label>
              <textarea
                className="cs-textarea"
                placeholder="اشرح مشكلتك أو استفسارك بالتفصيل..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
              />
            </div>
            <button type="submit" className="cs-submit-btn" disabled={sending}>
              {sending ? "جاري الإرسال..." : "إرسال الطلب"}
            </button>
          </form>
        </div>

        {/* ── History ── */}
        {requests.length > 0 && (
          <div className="cs-history">
            <h3 className="cs-history-title">طلباتك السابقة</h3>
            <div className="cs-requests">
              {requests.map((r) => (
                <div key={r.id} className="cs-request-card">
                  <div className="cs-request-top">
                    <span className="cs-request-subject">{r.subject}</span>
                    <span className="cs-request-date">
                      {r.createdAt?.toDate
                        ? r.createdAt.toDate().toLocaleDateString("ar-SA")
                        : "قيد المعالجة"}
                    </span>
                  </div>
                  <p className="cs-request-msg">{r.message}</p>
                  {r.phone && (
                    <p className="cs-request-phone" dir="ltr">{r.phone}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerSupport;
