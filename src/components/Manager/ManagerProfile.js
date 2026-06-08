import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaCamera } from "react-icons/fa";
import ManagerLayout from "./ManagerLayout";
import "../../styles/ManagerDashboard.css";

const ManagerProfile = () => {
  const [profile, setProfile] = useState({
    name: "", phoneNumber: "", address: "", businessName: "", email: "", logoUrl: "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [logoFile, setLogoFile]               = useState(null);
  const [logoPreview, setLogoPreview]         = useState("");
  const [loading, setLoading]                 = useState(true);
  const [msg, setMsg]                         = useState("");
  const [msgType, setMsgType]                 = useState("success");

  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, "users", currentUser.uid)).then((snap) => {
      if (snap.exists()) setProfile(snap.data());
      setLoading(false);
    });
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        name: profile.name,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
        businessName: profile.businessName,
      });

      if (logoFile) {
        const storage = getStorage();
        const logoRef = ref(storage, `logos/${currentUser.uid}/${logoFile.name}`);
        await uploadBytes(logoRef, logoFile);
        const url = await getDownloadURL(logoRef);
        await updateDoc(userRef, { logoUrl: url });
        setProfile((prev) => ({ ...prev, logoUrl: url }));
        setLogoFile(null);
        setLogoPreview("");
      }

      if (newPassword) {
        if (!currentPassword) {
          setMsg("أدخل كلمة المرور الحالية لتحديث كلمة المرور");
          setMsgType("error");
          return;
        }
        const cred = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, cred);
        await updatePassword(currentUser, newPassword);
        setCurrentPassword("");
        setNewPassword("");
      }

      setMsg("تم تحديث الملف الشخصي بنجاح");
      setMsgType("success");
    } catch (err) {
      setMsg("حدث خطأ: " + err.message);
      setMsgType("error");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const displayLogo = logoPreview || profile.logoUrl;

  if (loading) return (
    <ManagerLayout>
      <div className="mgrp-loading"><div className="mgrp-spinner" /></div>
    </ManagerLayout>
  );

  return (
    <ManagerLayout>
      <div className="mgrp-page">
        {/* ── Hero ── */}
        <div className="mgrp-hero">
          <div className="mgrp-avatar">
            {displayLogo
              ? <img src={displayLogo} alt="logo" className="mgrp-avatar-img" />
              : (profile.businessName?.charAt(0).toUpperCase() || "م")}
          </div>
          <h2 className="mgrp-hero-name">{profile.businessName || profile.name}</h2>
          <p className="mgrp-hero-email">{profile.email}</p>
          <button className="mgrp-logout-btn" onClick={handleLogout}>تسجيل الخروج</button>
        </div>

        {/* ── Info Form ── */}
        <form className="mgrp-card" onSubmit={handleSave}>
          <p className="mgrp-card-title">المعلومات الشخصية</p>

          {/* Logo upload */}
          <div className="mgrp-field">
            <label className="mgrp-label">شعار المتجر</label>
            <label className="mgrp-file-label">
              <FaCamera />
              <span>{logoFile ? logoFile.name : "اختر صورة الشعار"}</span>
              <input type="file" accept="image/*" className="mgrp-file-input" onChange={handleLogoChange} />
            </label>
          </div>

          <div className="mgrp-field">
            <label className="mgrp-label">الاسم</label>
            <input className="mgrp-input" type="text" name="name" value={profile.name} onChange={handleChange} required />
          </div>

          <div className="mgrp-field">
            <label className="mgrp-label">رقم الهاتف</label>
            <input className="mgrp-input" type="text" name="phoneNumber" value={profile.phoneNumber} onChange={handleChange} />
          </div>

          <div className="mgrp-field">
            <label className="mgrp-label">العنوان</label>
            <textarea className="mgrp-textarea" name="address" value={profile.address} onChange={handleChange} />
          </div>

          <div className="mgrp-field">
            <label className="mgrp-label">اسم المتجر</label>
            <input className="mgrp-input" type="text" name="businessName" value={profile.businessName} onChange={handleChange} />
          </div>

          <div className="mgrp-field">
            <label className="mgrp-label">البريد الإلكتروني (لا يمكن تغييره)</label>
            <input className="mgrp-input" type="email" value={profile.email} disabled />
          </div>

          <p className="mgrp-card-title" style={{ marginTop: 4 }}>تغيير كلمة المرور</p>

          <div className="mgrp-field">
            <label className="mgrp-label">كلمة المرور الحالية</label>
            <div className="mgrp-pw-wrap">
              <input
                className="mgrp-input"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button type="button" className="mgrp-pw-toggle" onClick={() => setShowCurrent((v) => !v)}>
                {showCurrent ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="mgrp-field">
            <label className="mgrp-label">كلمة المرور الجديدة</label>
            <div className="mgrp-pw-wrap">
              <input
                className="mgrp-input"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button type="button" className="mgrp-pw-toggle" onClick={() => setShowNew((v) => !v)}>
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="mgrp-save-btn">حفظ التغييرات</button>

          {msg && (
            <p className={`mgrp-msg${msgType === "error" ? " mgrp-msg-error" : ""}`}>{msg}</p>
          )}
        </form>
      </div>
    </ManagerLayout>
  );
};

export default ManagerProfile;
