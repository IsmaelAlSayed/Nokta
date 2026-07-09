import React from "react";
import { Link } from "react-router-dom";
import {
  FaUsers, FaBoxOpen, FaShoppingCart, FaGift,
  FaTags, FaTrophy, FaFileInvoice, FaHeadset,
} from "react-icons/fa";
import ManagerLayout from "../Manager/ManagerLayout";
import "../../styles/ManagerDashboard.css";

const CARDS = [
  { to: "/manager/manage-customers", icon: <FaUsers />,        title: "إدارة الزبائن",  sub: "عرض وإضافة وإدارة الزبائن" },
  { to: "/manager/manage-products",  icon: <FaBoxOpen />,      title: "المنتجات",       sub: "إضافة وتعديل وحذف المنتجات" },
  { to: "/manager/loyalty-points",   icon: <FaGift />,         title: "نقاط الولاء",    sub: "إدارة برامج المكافآت" },
  { to: "/manager/add-order",        icon: <FaShoppingCart />, title: "إضافة طلب",     sub: "إنشاء طلب جديد للزبائن" },
  { to: "/manager/awards",           icon: <FaTrophy />,       title: "الجوائز",        sub: "إدارة الجوائز والمكافآت" },
  { to: "/manager/manage-category",  icon: <FaTags />,         title: "التصنيفات",      sub: "إضافة وتعديل تصنيفات المنتجات" },
  { to: "/manager/customer-orders",  icon: <FaFileInvoice />,  title: "طلبات المتجر",  sub: "عرض وإدارة طلبات المتجر" },
  { to: "/manager/support-requests", icon: <FaHeadset />,      title: "طلبات الدعم",   sub: "متابعة رسائل دعم الزبائن" },
];

const ManagerDashboard = () => (
  <ManagerLayout>
    <div className="mgrd-page">
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

export default ManagerDashboard;
