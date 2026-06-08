import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { FaEye, FaEyeSlash, FaUser, FaLock } from "react-icons/fa";
import AdminLayout from "../Admin/AdminLayout";
import { useToast } from "../../context/ToastContext";
import "../../styles/ProfilePage.css";

const AVATAR_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const avatarColor = (str) =>
  str ? AVATAR_COLORS[str.charCodeAt(0) % AVATAR_COLORS.length] : "#6366f1";
const getInitials = (name, email) =>
  (name || email || "A").charAt(0).toUpperCase();

const ProfilePage = () => {
  const { showToast } = useToast();

  const [userData,    setUserData]    = useState(null);
  const [email,       setEmail]       = useState("");
  const [infoForm,    setInfoForm]    = useState({ name: "", phoneNumber: "", address: "" });
  const [pwForm,      setPwForm]      = useState({ password: "", confirmPassword: "" });
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);
  const [pwLoading,   setPwLoading]   = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const current = auth.currentUser;
      if (current) {
        setEmail(current.email || "");
        const snap = await getDoc(doc(db, "users", current.uid));
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          setInfoForm({
            name:        data.name        || "",
            phoneNumber: data.phoneNumber || "",
            address:     data.address     || "",
          });
        }
      }
      setPageLoading(false);
    };
    fetch();
  }, []);

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setInfoLoading(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        name:        infoForm.name,
        phoneNumber: infoForm.phoneNumber,
        address:     infoForm.address,
      });
      setUserData((prev) => ({ ...prev, ...infoForm }));
      showToast("تم حفظ المعلومات الشخصية بنجاح", "success");
    } catch {
      showToast("حدث خطأ أثناء الحفظ، يرجى المحاولة مجدداً", "error");
    } finally {
      setInfoLoading(false);
    }
  };

  const handleSavePw = async (e) => {
    e.preventDefault();
    if (pwForm.password.length < 6) {
      showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "warning");
      return;
    }
    if (pwForm.password !== pwForm.confirmPassword) {
      showToast("كلمتا المرور غير متطابقتين", "error");
      return;
    }
    setPwLoading(true);
    try {
      await updatePassword(auth.currentUser, pwForm.password);
      setPwForm({ password: "", confirmPassword: "" });
      showToast("تم تغيير كلمة المرور بنجاح", "success");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        showToast("سجّل خروجاً وأعد الدخول ثم حاول مجدداً", "warning");
      } else {
        showToast("حدث خطأ أثناء تغيير كلمة المرور", "error");
      }
    } finally {
      setPwLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <AdminLayout>
        <div className="pp-loading">
          <div className="pp-spinner" />
        </div>
      </AdminLayout>
    );
  }

  const displayName = userData?.name || "";
  const initials    = getInitials(displayName, email);
  const bgColor     = avatarColor(email);

  return (
    <AdminLayout>
      <div className="pp-page">

        {/* ── Hero ── */}
        <div className="pp-hero">
          <div className="pp-avatar" style={{ background: bgColor }}>
            {initials}
          </div>
          <div className="pp-hero-info">
            <h2 className="pp-hero-name">
              {displayName || <span className="pp-hero-unnamed">بدون اسم</span>}
            </h2>
            <p className="pp-hero-email">{email}</p>
            <span className="pp-role-badge">مدير عام</span>
          </div>
        </div>

        {/* ── Personal Info Card ── */}
        <div className="pp-card">
          <div className="pp-card-header">
            <FaUser className="pp-card-icon" />
            <h3>المعلومات الشخصية</h3>
          </div>
          <form onSubmit={handleSaveInfo} className="pp-form">

            <div className="pp-field">
              <label>البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                disabled
                className="pp-input pp-input--disabled"
              />
            </div>

            <div className="pp-row">
              <div className="pp-field">
                <label>الاسم الكامل</label>
                <input
                  type="text"
                  className="pp-input rtl-input"
                  placeholder="أدخل اسمك الكامل"
                  value={infoForm.name}
                  onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                />
              </div>
              <div className="pp-field">
                <label>رقم الهاتف</label>
                <input
                  type="text"
                  className="pp-input"
                  placeholder="+966 5X XXX XXXX"
                  value={infoForm.phoneNumber}
                  onChange={(e) => setInfoForm({ ...infoForm, phoneNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="pp-field">
              <label>العنوان</label>
              <input
                type="text"
                className="pp-input rtl-input"
                placeholder="المدينة / المنطقة"
                value={infoForm.address}
                onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
              />
            </div>

            <div className="pp-form-footer">
              <button type="submit" className="pp-btn-primary" disabled={infoLoading}>
                {infoLoading ? "جاري الحفظ..." : "حفظ المعلومات"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Change Password Card ── */}
        <div className="pp-card">
          <div className="pp-card-header">
            <FaLock className="pp-card-icon pp-card-icon--blue" />
            <h3>تغيير كلمة المرور</h3>
          </div>
          <form onSubmit={handleSavePw} className="pp-form">

            <div className="pp-row">
              <div className="pp-field">
                <label>كلمة المرور الجديدة</label>
                <div className="pp-pw-wrap">
                  <input
                    type={showPw ? "text" : "password"}
                    className="pp-input"
                    placeholder="6 أحرف على الأقل"
                    value={pwForm.password}
                    onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                  />
                  <button type="button" className="pp-pw-toggle"
                    onClick={() => setShowPw(!showPw)}>
                    {showPw ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="pp-field">
                <label>تأكيد كلمة المرور</label>
                <div className="pp-pw-wrap">
                  <input
                    type={showConfirm ? "text" : "password"}
                    className="pp-input"
                    placeholder="أعد إدخال كلمة المرور"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  />
                  <button type="button" className="pp-pw-toggle"
                    onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password strength hint */}
            {pwForm.password && (
              <div className={`pp-pw-hint ${pwForm.password.length >= 6 ? "pp-pw-hint--ok" : "pp-pw-hint--weak"}`}>
                {pwForm.password.length >= 6
                  ? "✓ كلمة المرور مقبولة"
                  : `${6 - pwForm.password.length} أحرف إضافية مطلوبة`}
              </div>
            )}

            <div className="pp-form-footer">
              <button
                type="submit"
                className="pp-btn-primary pp-btn-primary--blue"
                disabled={pwLoading}
              >
                {pwLoading ? "جاري التغيير..." : "تغيير كلمة المرور"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </AdminLayout>
  );
};

export default ProfilePage;
