import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/Login.css";

const firebaseErrors = {
  "auth/user-not-found": "لا يوجد حساب مرتبط بهذا الإيميل أو الرقم",
  "auth/wrong-password": "كلمة المرور غير صحيحة",
  "auth/invalid-email": "البريد الإلكتروني غير صالح",
  "auth/user-disabled": "تم تعطيل هذا الحساب، يرجى التواصل مع الدعم",
  "auth/too-many-requests": "محاولات كثيرة جداً، يرجى المحاولة بعد قليل",
  "auth/network-request-failed": "خطأ في الاتصال، تحقق من الإنترنت وأعد المحاولة",
  "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
};

const getFriendlyError = (code) =>
  firebaseErrors[code] || "حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مجدداً";

const phoneToEmail = (p) => `p${p.replace(/\D/g, "")}@phone.nokta`;
const detectMethod = (v) => (v.includes("@") ? "email" : "phone");

/* ── Nokta "N" logo ── */
const NoktalLogo = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="nGrad" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* N strokes */}
    <g filter="url(#glow)">
      <line x1="18" y1="54" x2="18" y2="18" stroke="url(#nGrad)" strokeWidth="5.5" strokeLinecap="round"/>
      <line x1="18" y1="18" x2="54" y2="54" stroke="url(#nGrad)" strokeWidth="5.5" strokeLinecap="round"/>
      <line x1="54" y1="54" x2="54" y2="18" stroke="url(#nGrad)" strokeWidth="5.5" strokeLinecap="round"/>
      {/* corner dots */}
      <circle cx="18" cy="18" r="5" fill="#06b6d4" />
      <circle cx="18" cy="54" r="5" fill="#3b82f6" />
      <circle cx="54" cy="18" r="5" fill="#3b82f6" />
      <circle cx="54" cy="54" r="5" fill="#06b6d4" />
    </g>
  </svg>
);

const EyeIcon = ({ open }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    )}
  </svg>
);

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [showPass, setShowPass]     = useState(false);

  const [showReset, setShowReset]       = useState(false);
  const [resetEmail, setResetEmail]     = useState("");
  const [resetMsg, setResetMsg]         = useState({ text: "", ok: false });
  const [resetLoading, setResetLoading] = useState(false);

  const navigate  = useNavigate();
  const isEmail   = detectMethod(identifier) === "email";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const authEmail = isEmail ? identifier.trim() : phoneToEmail(identifier);
    try {
      const { user } = await signInWithEmailAndPassword(auth, authEmail, password);
      const userDoc  = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) { setError("لا توجد بيانات للمستخدم"); return; }
      const role = userDoc.data().role;
      if (role === "admin")         navigate("/admin-dashboard");
      else if (role === "manager")  navigate("/manager-dashboard");
      else if (role === "customer") navigate("/home");
      else setError("صلاحية غير معرفة، يرجى التواصل مع الدعم");
    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMsg({ text: "", ok: false });
    if (!resetEmail.trim()) { setResetMsg({ text: "يرجى إدخال البريد الإلكتروني", ok: false }); return; }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetMsg({ text: "تم إرسال رابط الاستعادة إلى بريدك الإلكتروني", ok: true });
    } catch (err) {
      setResetMsg({ text: getFriendlyError(err.code), ok: false });
    } finally {
      setResetLoading(false);
    }
  };

  /* ── Reset Password Screen ── */
  if (showReset) {
    return (
      <div className="lg-page">
        <div className="lg-logo-wrap"><NoktalLogo /></div>
        <h1 className="lg-brand">استعادة كلمة المرور</h1>
        <p className="lg-tagline">أدخل بريدك الإلكتروني لإرسال رابط الاستعادة</p>

        <div className="lg-card">
          <form onSubmit={handleResetPassword} className="lg-form">
            {resetMsg.text && (
              <p className={`lg-msg ${resetMsg.ok ? "lg-msg--ok" : "lg-msg--err"}`}>
                {resetMsg.text}
              </p>
            )}
            <div className="lg-input-wrap">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                className="lg-input"
                required
              />
            </div>
            <button className="lg-btn" disabled={resetLoading}>
              {resetLoading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
            </button>
          </form>
        </div>

        <button className="lg-back-link" onClick={() => { setShowReset(false); setResetMsg({ text: "", ok: false }); }}>
          ← العودة لتسجيل الدخول
        </button>
        <p className="lg-footer">كافة الحقوق محفوظة لشركة GROW UP TECH</p>
      </div>
    );
  }

  /* ── Main Login Screen ── */
  return (
    <div className="lg-page">
      {/* Logo + brand */}
      <div className="lg-logo-wrap"><NoktalLogo /></div>
      <h1 className="lg-brand">أهلاً بك في نقطة</h1>
      <p className="lg-tagline">سجّل دخولك للوصول إلى برامج الولاء</p>

      {/* Card */}
      <div className="lg-card">
        <form onSubmit={handleLogin} className="lg-form">
          {error && <p className="lg-msg lg-msg--err">{error}</p>}

          {/* Identifier */}
          <div className="lg-input-wrap">
            <span className="lg-input-icon lg-input-icon--r">
              {identifier && !isEmail ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.83a16 16 0 0 0 8.32 8.32l.9-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              )}
            </span>
            <input
              type="text"
              inputMode={isEmail ? "email" : "tel"}
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
              placeholder="البريد الإلكتروني أو رقم الهاتف"
              className="lg-input lg-input--icon-r"
              autoComplete="username"
              required
            />
          </div>

          {/* Password */}
          <div className="lg-input-wrap">
            <button
              type="button"
              className="lg-input-icon lg-input-icon--l lg-eye"
              onClick={() => setShowPass((v) => !v)}
              tabIndex={-1}
            >
              <EyeIcon open={showPass} />
            </button>
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="lg-input lg-input--icon-l"
              autoComplete="current-password"
              required
            />
          </div>

          <button className="lg-btn" disabled={loading}>
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>

          {isEmail && identifier && (
            <button
              type="button"
              className="lg-forgot"
              onClick={() => { setResetEmail(identifier); setShowReset(true); }}
            >
              هل نسيت كلمة المرور؟
            </button>
          )}
        </form>
      </div>

      <Link to="/stores" className="lg-browse">🏪 تصفح المتاجر بدون تسجيل</Link>
      <p className="lg-footer">كافة الحقوق محفوظة لشركة GROW UP TECH</p>
    </div>
  );
};

export default Login;
