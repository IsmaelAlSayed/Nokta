import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
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

const detectMethod = (value) => (value.includes("@") ? "email" : "phone");

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState({ text: "", ok: false });
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();

  const method = detectMethod(identifier);
  const isEmail = method === "email";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const authEmail = isEmail ? identifier.trim() : phoneToEmail(identifier);
    try {
      const { user } = await signInWithEmailAndPassword(auth, authEmail, password);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) { setError("لا توجد بيانات للمستخدم"); return; }
      const role = userDoc.data().role;
      if (role === "admin") navigate("/admin-dashboard");
      else if (role === "manager") navigate("/manager-dashboard");
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
    if (!resetEmail.trim()) {
      setResetMsg({ text: "يرجى إدخال البريد الإلكتروني", ok: false });
      return;
    }
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

  if (showReset) {
    return (
      <div className="lg-page">
        <div className="lg-container">
          <div className="lg-hero">
            <button
              type="button"
              className="lg-back-btn"
              onClick={() => { setShowReset(false); setResetMsg({ text: "", ok: false }); }}
            >
              &#x2190;
            </button>
            <h1 className="lg-title">استعادة كلمة المرور</h1>
          </div>
          <form className="lg-form" onSubmit={handleResetPassword}>
            <p className="lg-desc">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
            {resetMsg.text && (
              <p className={`lg-msg ${resetMsg.ok ? "lg-msg--ok" : "lg-msg--err"}`}>
                {resetMsg.text}
              </p>
            )}
            <div className="lg-field">
              <label className="lg-label">البريد الإلكتروني</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="example@email.com"
                className="lg-input"
                required
              />
            </div>
            <button className="lg-btn" disabled={resetLoading}>
              {resetLoading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
            </button>
            <p className="lg-footer">كافة الحقوق محفوظة لشركة <br /> GROW UP TECH</p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="lg-page">
      <div className="lg-container">
        <div className="lg-hero">
          <span className="lg-back-icon" />
          <h1 className="lg-title">سجّل دخولك</h1>
          <p className="lg-subtitle">أهلاً بك في منصة ولاء</p>
        </div>

        <form className="lg-form" onSubmit={handleLogin}>
          {error && <p className="lg-msg lg-msg--err">{error}</p>}

          <div className="lg-field">
            <label className="lg-label">
              {identifier && !isEmail ? "رقم الهاتف" : "البريد الإلكتروني أو رقم الهاتف"}
              {identifier && (
                <span className="lg-detect-badge">
                  {isEmail ? "📧 إيميل" : "📱 هاتف"}
                </span>
              )}
            </label>
            <input
              type={isEmail ? "email" : "tel"}
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
              placeholder="example@email.com أو 05XXXXXXXX"
              className="lg-input"
              autoComplete="username"
              required
            />
          </div>

          <div className="lg-field">
            <div className="lg-pass-header">
              <label className="lg-label">كلمة المرور</label>
              {isEmail && identifier && (
                <button
                  type="button"
                  className="lg-forgot"
                  onClick={() => { setResetEmail(identifier); setShowReset(true); }}
                >
                  نسيت كلمة المرور؟
                </button>
              )}
            </div>
            <div className="lg-pass-wrap">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="lg-input lg-input--pass"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="lg-pass-eye"
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button className="lg-btn" disabled={loading}>
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>

          <p className="lg-footer">كافة الحقوق محفوظة لشركة <br /> GROW UP TECH</p>
        </form>
      </div>
    </div>
  );
};

export default Login;
