import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import "../../styles/Login.css";

const firebaseErrors = {
  "auth/user-not-found": "لا يوجد حساب مرتبط بهذا البريد الإلكتروني",
  "auth/wrong-password": "كلمة المرور غير صحيحة",
  "auth/invalid-email": "البريد الإلكتروني غير صالح",
  "auth/user-disabled": "تم تعطيل هذا الحساب، يرجى التواصل مع الدعم",
  "auth/too-many-requests": "محاولات كثيرة جداً، يرجى المحاولة بعد قليل",
  "auth/network-request-failed": "خطأ في الاتصال، تحقق من الإنترنت وأعد المحاولة",
  "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
};

const getFriendlyError = (code) =>
  firebaseErrors[code] || "حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مجدداً";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState({ text: "", ok: false });
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        setError("لا توجد بيانات للمستخدم");
        return;
      }
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
      setResetMsg({
        text: "تم إرسال رابط الاستعادة إلى بريدك الإلكتروني",
        ok: true,
      });
    } catch (err) {
      setResetMsg({ text: getFriendlyError(err.code), ok: false });
    } finally {
      setResetLoading(false);
    }
  };

  if (showReset) {
    return (
      <div className="login-container">
        <div className="login-header-section">
          <div className="login-header-content">
            <button
              type="button"
              className="login-back-btn"
              onClick={() => {
                setShowReset(false);
                setResetMsg({ text: "", ok: false });
              }}
            >
              &#x2190;
            </button>
            <h1 className="login-title">استعادة كلمة المرور</h1>
          </div>
        </div>
        <form className="login-form" onSubmit={handleResetPassword}>
          <p className="login-description">
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
          </p>
          {resetMsg.text && (
            <p className={`login-message ${resetMsg.ok ? "login-message--ok" : "login-error"}`}>
              {resetMsg.text}
            </p>
          )}
          <div className="login-input-group">
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              className="login-input"
              required
            />
          </div>
          <button className="login-button" disabled={resetLoading}>
            {resetLoading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
          </button>
          <p className="login-footer">
            كافة الحقوق محفوظة لشركة <br /> GROW UP TECH
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-header-section">
        <div className="login-header-content">
          <span className="login-back-icon">&#x2190;</span>
          <h1 className="login-title">سجل دخول في حسابك</h1>
        </div>
      </div>
      <form className="login-form" onSubmit={handleLogin}>
        <p className="login-description">قم بتسجيل الدخول لحسابك في منصة ولاء</p>
        {error && <p className="login-error">{error}</p>}
        <div className="login-input-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            className="login-input"
            required
          />
        </div>
        <div className="login-input-group">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            className="login-input"
            required
          />
          <button
            type="button"
            className="forgot-password"
            onClick={() => {
              setResetEmail(email);
              setShowReset(true);
            }}
          >
            نسيت كلمة المرور؟
          </button>
        </div>
        <button className="login-button" disabled={loading}>
          {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
        </button>
        <p className="login-footer">
          كافة الحقوق محفوظة لشركة <br /> GROW UP TECH
        </p>
      </form>
    </div>
  );
};

export default Login;
