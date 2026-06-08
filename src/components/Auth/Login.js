import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import "../../styles/Login.css"; // Importing the CSS file

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === "admin") {
          navigate("/admin-dashboard");
        } else if (role === "manager") {
          navigate("/manager-dashboard");
        } else if (role === "customer") {
          navigate("/home");
        } else {
          setError("Invalid role");
        }
      } else {
        setError("No role found for user.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

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
            placeholder="اسم الحساب"
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
          <a href="#" className="forgot-password">نسيت كلمة المرور</a>
        </div>
        <button className="login-button">تسجيل الدخول</button>

        <div className="divider">
          <div className="line"></div>
        </div>

        <div className="social-login-buttons">
          <button className="social-button">Apple</button>
          <button className="social-button">Google</button>
        </div>

        <p className="login-footer">
          كافة الحقوق محفوظة لشركة <br /> GROW UP TECH
        </p>
      </form>
    </div>
  );
};

export default Login;