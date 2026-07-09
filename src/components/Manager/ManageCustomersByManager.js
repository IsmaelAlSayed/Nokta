import React, { useEffect, useState } from "react";
import {
  collection, getDocs, setDoc, deleteDoc, doc, updateDoc, query, where, arrayUnion,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db, secondaryAuth } from "../../firebaseConfig";
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
  const [loginMethod, setLoginMethod]     = useState("email"); // "email" | "phone"
  const [customerName, setCustomerName]   = useState("");
  const [email, setEmail]                 = useState("");
  const [phone, setPhone]                 = useState("");
  const [password, setPassword]           = useState("");
  const [showPwd, setShowPwd]             = useState(false);
  const [addError, setAddError]           = useState("");
  const [existingUser, setExistingUser]   = useState(null); // customer already in system
  const [checkingEmail, setCheckingEmail] = useState(false);

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

  const currentManager = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [snap1, snap2, loySnap] = await Promise.all([
          getDocs(query(collection(db, "users"), where("managerId",   "==",            currentManager.uid))),
          getDocs(query(collection(db, "users"), where("managerIds",  "array-contains", currentManager.uid))),
          getDocs(query(collection(db, "loyaltyPoints"), where("managerId", "==", currentManager.uid))),
        ]);
        const seen = new Set();
        const list = [...snap1.docs, ...snap2.docs]
          .filter((d) => { if (seen.has(d.id)) return false; seen.add(d.id); return true; })
          .map((d) => ({ id: d.id, ...d.data() }));
        setCustomers(list);
        setFilteredCustomers(list);
        setLoyaltyConfigs(loySnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (_) {}
    };
    fetchData();
  }, [currentManager.uid]);

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q) { setFilteredCustomers(customers); return; }
    const lq = q.toLowerCase();
    setFilteredCustomers(customers.filter(
      (c) => c.name?.toLowerCase().includes(lq) || c.phoneNumber?.includes(q)
    ));
  };

  const phoneToEmail = (p) => `p${p.replace(/\D/g, "")}@phone.nokta`;

  const resetAddModal = () => {
    setCustomerName(""); setEmail(""); setPhone(""); setPassword("");
    setAddError(""); setExistingUser(null); setCheckingEmail(false);
    setShowAddModal(false);
  };

  /* Check if the typed email/phone already exists in Firestore */
  const checkExists = async (method, value) => {
    const trimmed = value.trim();
    if (!trimmed) { setExistingUser(null); return; }
    setCheckingEmail(true);
    try {
      const field = method === "email" ? "email" : "phoneNumber";
      const snap  = await getDocs(
        query(collection(db, "users"), where(field, "==", trimmed), where("role", "==", "customer"))
      );
      setExistingUser(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
    } catch (_) { setExistingUser(null); }
    setCheckingEmail(false);
  };

  const handleAddCustomer = async () => {
    if (!customerName.trim()) { setAddError("اسم الزبون مطلوب"); return; }

    /* ── Case A: customer already exists in the system ── */
    if (existingUser) {
      // Make sure they aren't already linked to this manager
      const alreadyLinked =
        existingUser.managerId === currentManager.uid ||
        existingUser.managerIds?.includes(currentManager.uid);
      if (alreadyLinked) {
        setAddError("هذا الزبون مضاف مسبقاً إلى متجرك");
        return;
      }
      try {
        await updateDoc(doc(db, "users", existingUser.id), {
          managerIds: arrayUnion(currentManager.uid),
        });
        const linked = { ...existingUser, name: customerName.trim() || existingUser.name };
        setCustomers((prev) => [...prev, linked]);
        setFilteredCustomers((prev) => [...prev, linked]);
        resetAddModal();
      } catch (err) { setAddError(err.message); }
      return;
    }

    /* ── Case B: new customer ── */
    if (!password) { setAddError("كلمة المرور مطلوبة"); return; }

    let authEmail;
    let firestoreData;

    if (loginMethod === "email") {
      if (!email.trim()) { setAddError("البريد الإلكتروني مطلوب"); return; }
      authEmail = email.trim();
      firestoreData = { email: authEmail, name: customerName.trim(), role: "customer", loginMethod: "email", phoneNumber: "", address: "", managerId: currentManager.uid, managerIds: [currentManager.uid] };
    } else {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 7) { setAddError("رقم الهاتف غير صالح"); return; }
      authEmail = phoneToEmail(phone);
      firestoreData = { email: authEmail, name: customerName.trim(), role: "customer", loginMethod: "phone", phoneNumber: phone.trim(), address: "", managerId: currentManager.uid, managerIds: [currentManager.uid] };
    }

    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, authEmail, password);
      await setDoc(doc(db, "users", cred.user.uid), firestoreData);
      await signOut(secondaryAuth);
      const newCustomer = { id: cred.user.uid, ...firestoreData };
      setCustomers((prev) => [...prev, newCustomer]);
      setFilteredCustomers((prev) => [...prev, newCustomer]);
      resetAddModal();
    } catch (err) {
      const MAP = {
        "auth/email-already-in-use": "هذا البريد مستخدم مسبقاً",
        "auth/invalid-email": "البريد الإلكتروني غير صالح",
        "auth/weak-password": "كلمة المرور ضعيفة — 6 أحرف على الأقل",
      };
      setAddError(MAP[err.code] || err.message);
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
          <button className="mc-btn-add" onClick={() => { setShowAddModal(true); setAddError(""); setCustomerName(""); setEmail(""); setPhone(""); setPassword(""); setLoginMethod("email"); setExistingUser(null); }}>
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
          <div className="mc-overlay" onClick={resetAddModal}>
            <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
              <div className="mc-modal-header">
                <h2>إضافة زبون جديد</h2>
                <button className="mc-modal-close" onClick={resetAddModal}><FaTimes /></button>
              </div>
              <div className="mc-form">
                {addError && <p className="mc-form-error">{addError}</p>}

                <div className="mc-field">
                  <label>اسم الزبون *</label>
                  <input className="rtl-input" type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="الاسم الكامل" />
                </div>

                <div className="mc-field">
                  <label>طريقة تسجيل الدخول</label>
                  <div className="mc-method-toggle">
                    <button type="button" className={`mc-method-btn${loginMethod === "email" ? " active" : ""}`} onClick={() => { setLoginMethod("email"); setExistingUser(null); setPhone(""); }}>
                      بريد إلكتروني
                    </button>
                    <button type="button" className={`mc-method-btn${loginMethod === "phone" ? " active" : ""}`} onClick={() => { setLoginMethod("phone"); setExistingUser(null); setEmail(""); }}>
                      رقم هاتف
                    </button>
                  </div>
                </div>

                {loginMethod === "email" ? (
                  <div className="mc-field">
                    <label>البريد الإلكتروني *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setExistingUser(null); }}
                      onBlur={(e) => checkExists("email", e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                ) : (
                  <div className="mc-field">
                    <label>رقم الهاتف *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setExistingUser(null); }}
                      onBlur={(e) => checkExists("phone", e.target.value)}
                      placeholder="05X XXX XXXX"
                    />
                  </div>
                )}

                {/* Existing-user notice */}
                {checkingEmail && (
                  <p className="mc-exists-checking">جاري التحقق...</p>
                )}
                {existingUser && !checkingEmail && (
                  <div className="mc-exists-notice">
                    <span>✓</span> هذا الزبون مسجّل مسبقاً — سيُربط بمتجرك دون الحاجة لكلمة مرور
                  </div>
                )}

                {/* Password field — hidden when linking existing user */}
                {!existingUser && (
                  <div className="mc-field">
                    <label>كلمة المرور *</label>
                    <div className="mc-pw-wrap">
                      <input
                        type={showPwd ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="6 أحرف على الأقل"
                      />
                      <button type="button" className="mc-pw-toggle" onClick={() => setShowPwd((v) => !v)}>
                        {showPwd ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mc-modal-footer">
                  <button className="mc-btn-ghost" onClick={resetAddModal}>إلغاء</button>
                  <button className="mc-btn-primary" onClick={handleAddCustomer} disabled={checkingEmail}>
                    {existingUser ? "ربط الزبون" : "إضافة"}
                  </button>
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
