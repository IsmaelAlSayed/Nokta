import React, { useEffect, useState } from "react";
import {
  collection, getDocs, setDoc, deleteDoc, doc, updateDoc, query, where,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword,
} from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { FaPlus, FaTimes, FaEdit, FaTrash, FaSearch, FaEye, FaEyeSlash } from "react-icons/fa";
import MangerLayout from "./ManagerLayout";
import CustomerOrdersModal from "./CustomerOrdersModal";
import CustomerLoyaltyModal from "./CustomerLoyaltyModal";
import "../../styles/ManageCustomers.css";

const COLORS = ["#10b981", "#3b82f6", "#f97316", "#8b5cf6", "#ef4444", "#0ea5e9"];

const ManageCustomersByManager = () => {
  const [customers, setCustomers]               = useState([]);
  const [loyaltyConfigs, setLoyaltyConfigs]     = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery]           = useState("");
  const [deletingId, setDeletingId]             = useState(null);

  /* ── Add modal ── */
  const [showAddModal, setShowAddModal]   = useState(false);
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPwd, setConfirmPwd]       = useState("");
  const [showPwd, setShowPwd]             = useState(false);
  const [addError, setAddError]           = useState("");

  /* ── Edit modal ── */
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm]               = useState({ name: "", phoneNumber: "", address: "", password: "" });
  const [showEditPwd, setShowEditPwd]         = useState(false);

  /* ── Orders / Loyalty modals ── */
  const [selectedCustomer, setSelectedCustomer]           = useState(null);
  const [isOrdersModalOpen, setIsOrdersModalOpen]         = useState(false);
  const [customerOrders, setCustomerOrders]               = useState([]);
  const [loyaltyModalVisible, setLoyaltyModalVisible]     = useState(false);
  const [selectedCustomerForLoyalty, setSelectedCustomerForLoyalty] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const customerSnap = await getDocs(collection(db, "users"));
        const list = customerSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.role === "customer");
        setCustomers(list);
        setFilteredCustomers(list);

        const loySnap = await getDocs(collection(db, "loyaltyPoints"));
        setLoyaltyConfigs(loySnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (_) {}
    };
    fetchData();
  }, []);

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q) { setFilteredCustomers(customers); return; }
    const lq = q.toLowerCase();
    setFilteredCustomers(customers.filter(
      (c) => c.name?.toLowerCase().includes(lq) || c.phoneNumber?.includes(q)
    ));
  };

  const handleAddCustomer = async () => {
    if (!email || !password) { setAddError("البريد وكلمة المرور مطلوبان"); return; }
    const currentManager = auth.currentUser;
    const managerEmail = currentManager.email;
    if (!confirmPwd) { setAddError("أدخل كلمة مرور المدير للتأكيد"); return; }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      await setDoc(doc(db, "users", user.uid), {
        email: user.email, role: "customer", name: "", phoneNumber: "", address: "",
      });
      await signInWithEmailAndPassword(auth, managerEmail, confirmPwd);
      const newCustomer = { id: user.uid, email: user.email, role: "customer" };
      setCustomers((prev) => [...prev, newCustomer]);
      setFilteredCustomers((prev) => [...prev, newCustomer]);
      setEmail(""); setPassword(""); setConfirmPwd(""); setAddError("");
      setShowAddModal(false);
    } catch (err) {
      setAddError(err.message);
    }
  };

  const handleDeleteCustomer = async (id) => {
    try {
      await deleteDoc(doc(db, "users", id));
      const updated = customers.filter((c) => c.id !== id);
      setCustomers(updated); setFilteredCustomers(updated); setDeletingId(null);
    } catch (_) {}
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setEditForm({ name: customer.name || "", phoneNumber: customer.phoneNumber || "", address: customer.address || "", password: "" });
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;
    try {
      await updateDoc(doc(db, "users", editingCustomer.id), {
        name: editForm.name, phoneNumber: editForm.phoneNumber, address: editForm.address,
      });
      const updated = customers.map((c) =>
        c.id === editingCustomer.id ? { ...c, ...editForm } : c
      );
      setCustomers(updated); setFilteredCustomers(updated); setEditingCustomer(null);
    } catch (_) {}
  };

  const handleViewOrders = async (customer) => {
    setSelectedCustomer(customer);
    setIsOrdersModalOpen(true);
    try {
      const q = query(collection(db, "orders"), where("customerId", "==", customer.id));
      const snap = await getDocs(q);
      setCustomerOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (_) {}
  };

  const getCustomerLoyalty = (id) => {
    const names = loyaltyConfigs
      .filter((c) => c.customers?.includes(id))
      .map((c) => c.name);
    return names.join("، ") || "—";
  };

  return (
    <MangerLayout>
      <div className="mc-page">
        {/* Header */}
        <div className="mc-header">
          <div>
            <h1 className="mc-title">إدارة الزبائن</h1>
            <p className="mc-subtitle">{customers.length} زبون مسجل</p>
          </div>
          <button className="mc-btn-add" onClick={() => { setShowAddModal(true); setAddError(""); }}>
            <FaPlus /> إضافة زبون
          </button>
        </div>

        {/* Search */}
        <div className="mc-search-wrap">
          <FaSearch className="mc-search-icon" />
          <input
            className="mc-search"
            type="text"
            placeholder="البحث بالاسم أو الهاتف..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchQuery && (
            <button className="mc-search-clear" onClick={() => handleSearch("")}>
              <FaTimes />
            </button>
          )}
        </div>

        {/* Customer list */}
        {filteredCustomers.length === 0 ? (
          <div className="mc-empty">
            <div className="mc-empty-icon">👥</div>
            <p className="mc-empty-title">لا يوجد زبائن</p>
            <p className="mc-empty-sub">اضغط إضافة زبون للبدء</p>
          </div>
        ) : (
          <ul className="mc-list">
            {filteredCustomers.map((customer, i) => (
              <li key={customer.id} className="mc-card">
                <div className="mc-avatar" style={{ background: COLORS[i % COLORS.length] }}>
                  {customer.name?.charAt(0)?.toUpperCase() || "؟"}
                </div>
                <div className="mc-info">
                  <p className="mc-name">
                    {customer.name || <span className="mc-no-name">بدون اسم</span>}
                  </p>
                  <p className="mc-detail">{customer.phoneNumber || customer.email}</p>
                  <p className="mc-detail" style={{ color: "#10b981", fontSize: 12 }}>
                    {getCustomerLoyalty(customer.id)}
                  </p>
                </div>

                {deletingId === customer.id ? (
                  <div className="mc-confirm">
                    <span>حذف؟</span>
                    <button className="mc-btn-danger-sm" onClick={() => handleDeleteCustomer(customer.id)}>نعم</button>
                    <button className="mc-btn-ghost-sm" onClick={() => setDeletingId(null)}>لا</button>
                  </div>
                ) : (
                  <div className="mc-actions">
                    <button
                      className="mc-icon-btn mc-icon-btn--edit"
                      title="تعديل"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="mc-icon-btn mc-icon-btn--delete"
                      title="حذف"
                      onClick={() => setDeletingId(customer.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* ── Add Modal ── */}
        {showAddModal && (
          <div className="mc-overlay" onClick={() => setShowAddModal(false)}>
            <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
              <div className="mc-modal-header">
                <h2>إضافة زبون جديد</h2>
                <button className="mc-modal-close" onClick={() => setShowAddModal(false)}><FaTimes /></button>
              </div>
              <div className="mc-form">
                {addError && <p className="mc-form-error">{addError}</p>}
                <div className="mc-field">
                  <label>البريد الإلكتروني</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                </div>
                <div className="mc-field">
                  <label>كلمة مرور الزبون</label>
                  <div className="mc-pw-wrap">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button type="button" className="mc-pw-toggle" onClick={() => setShowPwd((v) => !v)}>
                      {showPwd ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div className="mc-field">
                  <label>كلمة مرورك (للتأكيد)</label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="أدخل كلمة مرورك الحالية"
                  />
                </div>
                <div className="mc-modal-footer">
                  <button className="mc-btn-ghost" onClick={() => setShowAddModal(false)}>إلغاء</button>
                  <button className="mc-btn-primary" onClick={handleAddCustomer}>إضافة</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit Modal ── */}
        {editingCustomer && (
          <div className="mc-overlay" onClick={() => setEditingCustomer(null)}>
            <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
              <div className="mc-modal-header">
                <h2>تعديل بيانات الزبون</h2>
                <button className="mc-modal-close" onClick={() => setEditingCustomer(null)}><FaTimes /></button>
              </div>
              <div className="mc-form">
                <div className="mc-field">
                  <label>الاسم</label>
                  <input className="rtl-input" type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="اسم الزبون" />
                </div>
                <div className="mc-field">
                  <label>رقم الهاتف</label>
                  <input type="text" value={editForm.phoneNumber} onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} />
                </div>
                <div className="mc-field">
                  <label>العنوان</label>
                  <input className="rtl-input" type="text" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                </div>
                <div className="mc-modal-footer">
                  <button className="mc-btn-ghost" onClick={() => setEditingCustomer(null)}>إلغاء</button>
                  <button className="mc-btn-primary" onClick={handleSaveEdit}>حفظ</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Modal */}
        {isOrdersModalOpen && selectedCustomer && (
          <CustomerOrdersModal
            customer={selectedCustomer}
            orders={customerOrders}
            onClose={() => setIsOrdersModalOpen(false)}
          />
        )}

        {/* Loyalty Modal */}
        {loyaltyModalVisible && selectedCustomerForLoyalty && (
          <CustomerLoyaltyModal
            customer={selectedCustomerForLoyalty}
            loyaltyConfigs={loyaltyConfigs}
            onClose={() => setLoyaltyModalVisible(false)}
          />
        )}
      </div>
    </MangerLayout>
  );
};

export default ManageCustomersByManager;
