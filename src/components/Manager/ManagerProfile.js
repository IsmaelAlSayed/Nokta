import React, { useEffect, useRef, useState } from "react";
import { auth, db, storage } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaCamera, FaSpinner } from "react-icons/fa";
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
  const [logoPreview, setLogoPreview]         = useState("");
  const [logoUploading, setLogoUploading]     = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [msg, setMsg]                         = useState("");
  const [msgType, setMsgType]                 = useState("success");
  const logoInputRef                          = useRef(null);

  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, "users", currentUser.uid)).then((snap) => {
      if (snap.exists()) setProfile((prev) => ({ ...prev, ...snap.data() }));
      setLoading(false);
    });
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);
    setMsg("");
    try {
      const logoRef = ref(storage, `logos/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(logoRef, file);
      const url = await getDownloadURL(logoRef);
      await updateDoc(doc(db, "users", currentUser.uid), { logoUrl: url });
      setProfile((prev) => ({ ...prev, logoUrl: url }));
      setLogoPreview("");
      setMsg("تم رفع الشعار بنجاح");
      setMsgType("success");
    } catch (err) {
      setLogoPreview("");
      const ERRORS = {
        "storage/quota-exceeded": "مساحة التخزين ممتلئة — يرجى ترقية باقة Firebase",
        "storage/unauthorized": "ليس لديك صلاحية رفع الملفات",
      };
      setMsg(ERRORS[err.code] || "فشل رفع الشعار: " + err.message);
      setMsgType("error");
    }
    setLogoUploading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg("");
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        name: profile.name ?? "",
        phoneNumber: profile.phoneNumber ?? "",
        address: profile.address ?? "",
        businessName: profile.businessName ?? "",
      });

      if (newPassword) {
        if (!currentPassword) {
          setMsg("أدخل كلمة المرور الحالية لتحديث كلمة المرور");
          setMsgType("error");
          setSaving(false);
          return;
        }
        const cred = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, cred);
        await updatePassword(currentUser, newPassword);
        setCurrentPassword("");
        setNewPassword("");
      }

      setMsg("تم حفظ التغييرات بنجاح");
      setMsgType("success");
    } catch (err) {
      const ERRORS = {
        "auth/wrong-password":     "كلمة المرور الحالية غير صحيحة",
        "auth/weak-password":      "كلمة المرور الجديدة ضعيفة — 6 أحرف على الأقل",
        "auth/requires-recent-login": "يرجى تسجيل الخروج والدخول مجدداً ثم المحاولة",
      };
      setMsg(ERRORS[err.code] || "حدث خطأ: " + err.message);
      setMsgType("error");
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const displayLogo = logoPreview || profile.logoUrl;
  const displayEmail = profile.loginMethod === "phone" ? profile.phoneNumber : profile.email;

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
          <div
            className={`mgrp-avatar mgrp-avatar-clickable${logoUploading ? " uploading" : ""}`}
            onClick={() => !logoUploading && logoInputRef.current?.click()}
            title="انقر لتغيير الشعار"
          >
            {logoUploading ? (
              <FaSpinner className="mgrp-avatar-spinner" />
            ) : displayLogo ? (
              <img src={displayLogo} alt="logo" className="mgrp-avatar-img" />
            ) : (
              profile.businessName?.charAt(0).toUpperCase() || "م"
            )}
            {!logoUploading && (
              <div className="mgrp-avatar-overlay"><FaCamera /></div>
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="mgrp-file-input"
            onChange={handleLogoChange}
          />
          <p className="mgrp-avatar-hint">
            {logoUploading ? "جاري رفع الشعار..." : "انقر على الصورة لتغيير الشعار"}
          </p>
          <h2 className="mgrp-hero-name">{profile.businessName || profile.name}</h2>
          <p className="mgrp-hero-email">{displayEmail}</p>
          <button className="mgrp-logout-btn" onClick={handleLogout}>تسجيل الخروج</button>
        </div>

        {/* ── Info Form ── */}
        <form className="mgrp-card" onSubmit={handleSave}>
          <p className="mgrp-card-title">المعلومات الشخصية</p>

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

          <button type="submit" className="mgrp-save-btn" disabled={saving || logoUploading}>
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>

          {msg && (
            <p className={`mgrp-msg${msgType === "error" ? " mgrp-msg-error" : ""}`}>{msg}</p>
          )}
        </form>
      </div>
    </ManagerLayout>
  );
};

export default ManagerProfile;
