import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebaseConfig";
import {
  collection, getDocs, setDoc, deleteDoc, doc, updateDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  FaEye, FaEyeSlash, FaPlus, FaEdit, FaTrash, FaSearch, FaTimes,
} from "react-icons/fa";
import AdminLayout from "./AdminLayout";
import "../../styles/ManageCustomers.css";

const AVATAR_COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#6366f1", "#ef4444", "#8b5cf6"];
const avatarColor  = (id) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials  = (c) => (c.name ? c.name : c.email).charAt(0).toUpperCase();

const FIREBASE_ERRORS = {
  "auth/email-already-in-use": "هذا البريد الإلكتروني مستخدم مسبقاً",
  "auth/invalid-email":        "البريد الإلكتروني غير صالح",
  "auth/weak-password":        "كلمة المرور ضعيفة — 6 أحرف على الأقل",
  "auth/wrong-password":       "كلمة مرور المدير العام غير صحيحة",
  "auth/invalid-credential":   "بيانات الاعتماد غير صحيحة",
};
const toArabicErr = (code) => FIREBASE_ERRORS[code] || "حدث خطأ، يرجى المحاولة مجدداً";

const Modal = ({ title, onClose, children }) => (
  <div className="mc-overlay" onClick={onClose}>
    <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
      <div className="mc-modal-header">
        <h2>{title}</h2>
        <button className="mc-modal-close" onClick={onClose}><FaTimes /></button>
      </div>
      {children}
    </div>
  </div>
);

const ManageCustomers = () => {
  const [customers,  setCustomers]  = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [search,     setSearch]     = useState("");

  // Add modal
  const [showAdd,     setShowAdd]     = useState(false);
  const [addForm,     setAddForm]     = useState({ email: "", password: "", adminPw: "" });
  const [showNewPw,   setShowNewPw]   = useState(false);
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [addError,    setAddError]    = useState("");
  const [addLoading,  setAddLoading]  = useState(false);

  // Edit modal
  const [editing,     setEditing]     = useState(null);
  const [editForm,    setEditForm]    = useState({ name: "", phoneNumber: "", address: "" });
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm
  const [confirmId, setConfirmId] = useState(null);

  /* ── Fetch ── */
  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.role === "customer");
      setCustomers(list);
      setFiltered(list);
    };
    fetch();
  }, []);

  /* ── Search ── */
  const handleSearch = (q) => {
    setSearch(q);
    if (!q.trim()) return setFiltered(customers);
    const lc = q.toLowerCase();
    setFiltered(
      customers.filter(
        (c) =>
          c.name?.toLowerCase().includes(lc) ||
          c.email?.toLowerCase().includes(lc) ||
          c.phoneNumber?.includes(lc),
      ),
    );
  };

  const syncFiltered = (list) =>
    setFiltered(
      search
        ? list.filter(
            (c) =>
              c.name?.toLowerCase().includes(search.toLowerCase()) ||
              c.email?.toLowerCase().includes(search.toLowerCase()),
          )
        : list,
    );

  /* ── Add ── */
  const openAdd = () => {
    setAddForm({ email: "", password: "", adminPw: "" });
    setAddError("");
    setShowAdd(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const { email, password, adminPw } = addForm;
    if (!email || !password || !adminPw) {
      setAddError("يرجى ملء جميع الحقول");
      return;
    }
    setAddLoading(true);
    setAddError("");
    const admin = auth.currentUser;
    try {
      const credential = EmailAuthProvider.credential(admin.email, adminPw);
      await reauthenticateWithCredential(admin, credential);

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", user.uid), {
        email: user.email, role: "customer",
        name: "", phoneNumber: "", address: "",
      });

      await signInWithEmailAndPassword(auth, admin.email, adminPw);

      const newCustomer = { id: user.uid, email: user.email, role: "customer", name: "", phoneNumber: "" };
      const updated = [...customers, newCustomer];
      setCustomers(updated);
      syncFiltered(updated);
      setShowAdd(false);
    } catch (err) {
      setAddError(toArabicErr(err.code));
    } finally {
      setAddLoading(false);
    }
  };

  /* ── Edit ── */
  const openEdit = (c) => {
    setEditing(c);
    setEditForm({ name: c.name || "", phoneNumber: c.phoneNumber || "", address: c.address || "" });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await updateDoc(doc(db, "users", editing.id), editForm);
      const updated = customers.map((c) =>
        c.id === editing.id ? { ...c, ...editForm } : c,
      );
      setCustomers(updated);
      syncFiltered(updated);
      setEditing(null);
    } finally {
      setEditLoading(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "users", id));
    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    syncFiltered(updated);
    setConfirmId(null);
  };

  /* ─────────────── Render ─────────────── */
  return (
    <AdminLayout>
      <div className="mc-page">

        {/* Header */}
        <div className="mc-header">
          <div>
            <h1 className="mc-title">إدارة العملاء</h1>
            <p className="mc-subtitle">{customers.length} عميل مسجّل في النظام</p>
          </div>
          <button className="mc-btn-add" onClick={openAdd}>
            <FaPlus /> إضافة عميل
          </button>
        </div>

        {/* Search */}
        <div className="mc-search-wrap">
          <FaSearch className="mc-search-icon" />
          <input
            type="text"
            className="mc-search"
            placeholder="البحث بالاسم أو البريد أو رقم الهاتف..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {search && (
            <button className="mc-search-clear" onClick={() => handleSearch("")}>
              <FaTimes />
            </button>
          )}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="mc-empty">
            <div className="mc-empty-icon">🙍</div>
            <p className="mc-empty-title">
              {search ? "لا توجد نتائج للبحث" : "لا يوجد عملاء بعد"}
            </p>
            <p className="mc-empty-sub">
              {search ? "جرّب كلمة بحث مختلفة" : 'اضغط "إضافة عميل" لبدء الإضافة'}
            </p>
          </div>
        ) : (
          <ul className="mc-list">
            {filtered.map((c) => (
              <li key={c.id} className="mc-card">
                <div className="mc-avatar" style={{ background: avatarColor(c.id) }}>
                  {getInitials(c)}
                </div>

                <div className="mc-info">
                  <p className="mc-name">
                    {c.name || <span className="mc-no-name">بدون اسم</span>}
                  </p>
                  <p className="mc-detail">{c.email}</p>
                  {c.phoneNumber && <p className="mc-detail">{c.phoneNumber}</p>}
                </div>

                {confirmId === c.id ? (
                  <div className="mc-confirm">
                    <span>تأكيد الحذف؟</span>
                    <button className="mc-btn-danger-sm" onClick={() => handleDelete(c.id)}>
                      حذف
                    </button>
                    <button className="mc-btn-ghost-sm" onClick={() => setConfirmId(null)}>
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <div className="mc-actions">
                    <button
                      className="mc-icon-btn mc-icon-btn--edit"
                      onClick={() => openEdit(c)}
                      title="تعديل"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="mc-icon-btn mc-icon-btn--delete"
                      onClick={() => setConfirmId(c.id)}
                      title="حذف"
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
        {showAdd && (
          <Modal title="إضافة عميل جديد" onClose={() => setShowAdd(false)}>
            <form onSubmit={handleAdd} className="mc-form">
              {addError && <p className="mc-form-error">{addError}</p>}

              <div className="mc-field">
                <label>البريد الإلكتروني للعميل</label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="mc-field">
                <label>كلمة المرور</label>
                <div className="mc-pw-wrap">
                  <input
                    type={showNewPw ? "text" : "password"}
                    placeholder="6 أحرف على الأقل"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    required
                  />
                  <button type="button" className="mc-pw-toggle"
                    onClick={() => setShowNewPw(!showNewPw)}>
                    {showNewPw ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="mc-divider"><span>تأكيد هويتك كمدير عام</span></div>

              <div className="mc-field">
                <label>كلمة مرورك الحالية (Admin)</label>
                <div className="mc-pw-wrap">
                  <input
                    type={showAdminPw ? "text" : "password"}
                    placeholder="كلمة مرورك الحالية"
                    value={addForm.adminPw}
                    onChange={(e) => setAddForm({ ...addForm, adminPw: e.target.value })}
                    required
                  />
                  <button type="button" className="mc-pw-toggle"
                    onClick={() => setShowAdminPw(!showAdminPw)}>
                    {showAdminPw ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="mc-modal-footer">
                <button type="button" className="mc-btn-ghost"
                  onClick={() => setShowAdd(false)}>إلغاء</button>
                <button type="submit" className="mc-btn-primary" disabled={addLoading}>
                  {addLoading ? "جاري الإضافة..." : "إضافة العميل"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ── Edit Modal ── */}
        {editing && (
          <Modal title="تعديل بيانات العميل" onClose={() => setEditing(null)}>
            <form onSubmit={handleSaveEdit} className="mc-form">
              <div className="mc-field">
                <label>الاسم</label>
                <input type="text" placeholder="اسم العميل"
                  className="rtl-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="mc-field">
                <label>رقم الهاتف</label>
                <input type="text" placeholder="+966 5X XXX XXXX"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} />
              </div>
              <div className="mc-field">
                <label>العنوان</label>
                <input type="text" placeholder="المدينة / المنطقة"
                  className="rtl-input"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
              <div className="mc-modal-footer">
                <button type="button" className="mc-btn-ghost"
                  onClick={() => setEditing(null)}>إلغاء</button>
                <button type="submit" className="mc-btn-primary" disabled={editLoading}>
                  {editLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            </form>
          </Modal>
        )}

      </div>
    </AdminLayout>
  );
};

export default ManageCustomers;
