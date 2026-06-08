import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaSignOutAlt, FaUser, FaLock } from "react-icons/fa";
import { auth, db } from "../../firebaseConfig";
import CustomerLayout from "./CustomerLayout";
import "../../styles/CustomerProfile.css";

const CustomerProfile = () => {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: "",
    password: "",
  });
  const [feedback, setFeedback] = useState({ msg: "", ok: false });
  const navigate = useNavigate();
  const currentCustomer = auth.currentUser;

  useEffect(() => {
    getDoc(doc(db, "users", currentCustomer.uid)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setProfile(d);
        setEditForm({
          name: d.name || "",
          phone: d.phoneNumber || "",
          address: d.address || "",
          password: "",
        });
      }
      setLoading(false);
    });
  }, [currentCustomer.uid]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFeedback({ msg: "", ok: false });
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", currentCustomer.uid), {
        name: editForm.name,
        phoneNumber: editForm.phone,
        address: editForm.address,
      });
      if (editForm.password) {
        if (editForm.password.length < 6) {
          setFeedback({ msg: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", ok: false });
          setSaving(false);
          return;
        }
        await updatePassword(currentCustomer, editForm.password);
      }
      setProfile((p) => ({ ...p, name: editForm.name, phoneNumber: editForm.phone, address: editForm.address }));
      setEditForm((f) => ({ ...f, password: "" }));
      setFeedback({ msg: "تم تحديث الملف الشخصي بنجاح", ok: true });
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setFeedback({ msg: "سجّل خروجاً وأعد الدخول ثم حاول مجدداً", ok: false });
      } else {
        setFeedback({ msg: "حدث خطأ أثناء التحديث، يرجى المحاولة مجدداً", ok: false });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const initials = (editForm.name || currentCustomer?.email || "م").charAt(0).toUpperCase();

  return (
    <CustomerLayout>
      <div className="cp-page">
        {/* ── Hero ── */}
        <div className="cp-hero">
          <div className="cp-avatar">{initials}</div>
          <div className="cp-hero-info">
            <h2 className="cp-hero-name">
              {editForm.name || <span className="cp-unnamed">بدون اسم</span>}
            </h2>
            <p className="cp-hero-email">{currentCustomer?.email}</p>
            <span className="cp-card-badge">
              بطاقة: {profile?.loyalCardNo || "0000"}
            </span>
          </div>
          <button className="cp-logout-btn" onClick={handleLogout} title="تسجيل الخروج">
            <FaSignOutAlt />
          </button>
        </div>

        {loading ? (
          <div className="cp-loading"><div className="cp-spinner" /></div>
        ) : (
          <form onSubmit={handleUpdate}>
            {/* ── Personal Info Card ── */}
            <div className="cp-card">
              <div className="cp-card-header">
                <FaUser className="cp-card-icon" />
                <h3>المعلومات الشخصية</h3>
              </div>
              <div className="cp-form">
                <div className="cp-field">
                  <label>البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={currentCustomer.email}
                    disabled
                    className="cp-input cp-input--disabled"
                  />
                </div>
                <div className="cp-field">
                  <label>الاسم الكامل</label>
                  <input
                    type="text"
                    className="cp-input"
                    placeholder="أدخل اسمك الكامل"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="cp-field">
                  <label>رقم الهاتف</label>
                  <input
                    type="text"
                    className="cp-input"
                    placeholder="+966 5X XXX XXXX"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div className="cp-field">
                  <label>العنوان</label>
                  <input
                    type="text"
                    className="cp-input"
                    placeholder="المدينة / المنطقة"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* ── Password Card ── */}
            <div className="cp-card">
              <div className="cp-card-header">
                <FaLock className="cp-card-icon cp-card-icon--orange" />
                <h3>تغيير كلمة المرور</h3>
              </div>
              <div className="cp-form">
                <div className="cp-field">
                  <label>كلمة المرور الجديدة (اختياري)</label>
                  <div className="cp-pw-wrap">
                    <input
                      type={showPw ? "text" : "password"}
                      className="cp-input"
                      placeholder="6 أحرف على الأقل"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    />
                    <button type="button" className="cp-pw-toggle" onClick={() => setShowPw(!showPw)}>
                      {showPw ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Feedback ── */}
            {feedback.msg && (
              <p className={`cp-feedback ${feedback.ok ? "cp-feedback--ok" : "cp-feedback--err"}`}>
                {feedback.msg}
              </p>
            )}

            <button type="submit" className="cp-save-btn" disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </form>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerProfile;
