import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaUserShield, FaUsers, FaUser, FaChevronLeft } from "react-icons/fa";
import { motion } from "framer-motion";
import AdminLayout from "../Admin/AdminLayout";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import "../../styles/AdminDashboard.css";

const actions = [
  {
    to: "/manage-managers",
    icon: <FaUserShield />,
    title: "إدارة المديرين",
    description: "إضافة وتعديل وحذف حسابات المديرين",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.1)",
  },
  {
    to: "/manage-customers",
    icon: <FaUsers />,
    title: "إدارة العملاء",
    description: "عرض وإدارة جميع عملاء النظام",
    color: "#0ea5e9",
    bg: "rgba(14,165,233,0.1)",
  },
  {
    to: "/profile",
    icon: <FaUser />,
    title: "الملف الشخصي",
    description: "تحديث معلومات حسابك الشخصي",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
  },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState({ managers: 0, customers: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const users = snapshot.docs.map((d) => d.data());
        setStats({
          managers: users.filter((u) => u.role === "manager").length,
          customers: users.filter((u) => u.role === "customer").length,
        });
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const today = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statCards = [
    {
      label: "المديرين",
      value: stats.managers,
      icon: <FaUserShield />,
      cls: "stat-icon--purple",
    },
    {
      label: "العملاء",
      value: stats.customers,
      icon: <FaUsers />,
      cls: "stat-icon--blue",
    },
    {
      label: "إجمالي المستخدمين",
      value: stats.managers + stats.customers,
      icon: <FaUser />,
      cls: "stat-icon--green",
    },
  ];

  return (
    <AdminLayout>

      {/* ── Welcome Banner ── */}
      <div className="dash-welcome">
        <div className="dash-welcome-text">
          <p className="dash-welcome-date">{today}</p>
          <h1 className="dash-welcome-title">مرحباً بك في لوحة التحكم</h1>
          <p className="dash-welcome-sub">نظرة عامة على حالة النظام</p>
        </div>
        <div className="dash-welcome-badge">
          <FaUserShield />
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="dash-stats">
        {statCards.map(({ label, value, icon, cls }) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${cls}`}>{icon}</div>
            <div className="stat-info">
              <span className="stat-label">{label}</span>
              <span className="stat-value">
                {loadingStats ? "…" : value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <h2 className="dash-section-title">الإجراءات السريعة</h2>
      <div className="dash-actions">
        {actions.map(({ to, icon, title, description, color, bg }) => (
          <motion.div
            key={to}
            className="action-card"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <Link to={to} className="action-card-link">
              <div className="action-icon-wrap" style={{ background: bg, color }}>
                {icon}
              </div>
              <div className="action-card-body">
                <h3 className="action-title">{title}</h3>
                <p className="action-desc">{description}</p>
              </div>
              <FaChevronLeft className="action-arrow" style={{ color }} />
            </Link>
          </motion.div>
        ))}
      </div>

    </AdminLayout>
  );
};

export default AdminDashboard;
