import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUsers, FaBoxOpen, FaShoppingCart, FaGift,
  FaTags, FaUser, FaTrophy, FaFileInvoice, FaHeadset,
} from "react-icons/fa";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import ManagerLayout from "../Manager/ManagerLayout";
import "../../styles/ManagerDashboard.css";

const CARDS = [
  { to: "/manager/manage-customers", icon: <FaUsers />,       title: "إدارة الزبائن",   sub: "عرض وإضافة وإدارة الزبائن" },
  { to: "/manager/manage-products",  icon: <FaBoxOpen />,     title: "المنتجات",        sub: "إضافة وتعديل وحذف المنتجات" },
  { to: "/manager/add-order",        icon: <FaShoppingCart />, title: "إضافة طلب",      sub: "إنشاء طلب جديد للزبائن" },
  { to: "/manager/loyalty-points",   icon: <FaGift />,        title: "نقاط الولاء",     sub: "إدارة برامج المكافآت" },
  { to: "/manager/manage-category",  icon: <FaTags />,        title: "التصنيفات",       sub: "إضافة وتعديل تصنيفات المنتجات" },
  { to: "/manager/awards",           icon: <FaTrophy />,      title: "الجوائز",         sub: "إدارة الجوائز والمكافآت" },
  { to: "/manager/customer-orders",  icon: <FaFileInvoice />, title: "طلبات المتجر",   sub: "عرض وإدارة طلبات المتجر" },
  { to: "/manager/support-requests", icon: <FaHeadset />,     title: "طلبات الدعم",    sub: "متابعة رسائل دعم الزبائن" },
];

const ManagerDashboard = () => {
  const [bizName, setBizName] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) setBizName(snap.data().businessName || snap.data().name || "");
    });
  }, []);

  return (
    <ManagerLayout>
      <div className="mgrd-page">
        <div className="mgrd-welcome">
          <div className="mgrd-welcome-text">
            <p className="mgrd-greeting">مرحباً بك</p>
            <h1 className="mgrd-name">{bizName || "التاجر"}</h1>
          </div>
          <div className="mgrd-welcome-icon"><FaUser /></div>
        </div>

        <h2 className="mgrd-section-title">الخدمات المتاحة</h2>

        <div className="mgrd-grid">
          {CARDS.map(({ to, icon, title, sub }) => (
            <Link key={to} to={to} className="mgrd-card">
              <div className="mgrd-card-icon">{icon}</div>
              <p className="mgrd-card-title">{title}</p>
              <p className="mgrd-card-sub">{sub}</p>
            </Link>
          ))}
        </div>
      </div>
    </ManagerLayout>
  );
};

export default ManagerDashboard;
