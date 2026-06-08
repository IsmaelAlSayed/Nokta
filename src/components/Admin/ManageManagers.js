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
import { FaEye, FaEyeSlash, FaPlus, FaEdit, FaTrash, FaSearch, FaTimes } from "react-icons/fa";
import AdminLayout from "./AdminLayout";
import "../../styles/ManageManagers.css";

const AVATAR_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const avatarColor  = (id) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials  = (m) =>
  (m.name ? m.name : m.email).charAt(0).toUpperCase();

const FIREBASE_ERRORS = {
  "auth/email-already-in-use": "هذا البريد الإلكتروني مستخدم مسبقاً",
  "auth/invalid-email":        "البريد الإلكتروني غير صالح",
  "auth/weak-password":        "كلمة المرور ضعيفة — 6 أحرف على الأقل",
  "auth/wrong-password":       "كلمة مرور المدير العام غير صحيحة",
  "auth/invalid-credential":   "بيانات الاعتماد غير صحيحة",
};
const toArabicErr = (code) => FIREBASE_ERRORS[code] || "حدث خطأ، يرجى المحاولة مجدداً";

/* ─── Reusable modal overlay ─── */
const Modal = ({ title, onClose, children }) => (
  <div className="mm-overlay" onClick={onClose}>
    <div className="mm-modal" onClick={(e) => e.stopPropagation()}>
      <div className="mm-modal-header">
        <h2>{title}</h2>
        <button className="mm-modal-close" onClick={onClose}><FaTimes /></button>
      </div>
      {children}
    </div>
  </div>
);

const ManageManagers = () => {
  const [managers,  setManagers]  = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [search,    setSearch]    = useState("");

  // Add modal
  const [showAdd,         setShowAdd]         = useState(false);
  const [addForm,         setAddForm]         = useState({ email: "", password: "", adminPw: "" });
  const [showNewPw,       setShowNewPw]       = useState(false);
  const [showAdminPw,     setShowAdminPw]     = useState(false);
  const [addError,        setAddError]        = useState("");
  const [addLoading,      setAddLoading]      = useState(false);

  // Edit modal
  const [editing,    setEditing]    = useState(null);
  const [editForm,   setEditForm]   = useState({ name: "", phoneNumber: "", address: "" });
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm
  const [confirmId, setConfirmId] = useState(null);

  /* ── Fetch ── */
  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.role === "manager");
      setManagers(list);
      setFiltered(list);
    };
    fetch();
  }, []);

  /* ── Search ── */
  const handleSearch = (q) => {
    setSearch(q);
    if (!q.trim()) return setFiltered(managers);
    const lc = q.toLowerCase();
    setFiltered(
      managers.filter(
        (m) =>
          m.name?.toLowerCase().includes(lc) ||
          m.email?.toLowerCase().includes(lc) ||
          m.phoneNumber?.includes(lc),
      ),
    );
  };

  const syncFiltered = (list) =>
    setFiltered(search ? list.filter((m) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()),
    ) : list);

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
      // Re-authenticate admin before creating user (to keep session after Firebase switches)
      const credential = EmailAuthProvider.credential(admin.email, adminPw);
      await reauthenticateWithCredential(admin, credential);

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", user.uid), {
        email: user.email, role: "manager",
        name: "", phoneNumber: "", address: "",
      });

      // Restore admin session
      await signInWithEmailAndPassword(auth, admin.email, adminPw);

      const newMgr = { id: user.uid, email: user.email, role: "manager", name: "", phoneNumber: "" };
      const updated = [...managers, newMgr];
      setManagers(updated);
      syncFiltered(updated);
      setShowAdd(false);
    } catch (err) {
      setAddError(toArabicErr(err.code));
    } finally {
      setAddLoading(false);
    }
  };

  /* ── Edit ── */
  const openEdit = (m) => {
    setEditing(m);
    setEditForm({ name: m.name || "", phoneNumber: m.phoneNumber || "", address: m.address || "" });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await updateDoc(doc(db, "users", editing.id), editForm);
      const updated = managers.map((m) => m.id === editing.id ? { ...m, ...editForm } : m);
      setManagers(updated);
      syncFiltered(updated);
      setEditing(null);
    } finally {
      setEditLoading(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "users", id));
    const updated = managers.filter((m) => m.id !== id);
    setManagers(updated);
    syncFiltered(updated);
    setConfirmId(null);
  };

  /* ─────────────── Render ─────────────── */
  return (
    <AdminLayout>
      <div className="mm-page">

        {/* Header */}
        <div className="mm-header">
          <div>
            <h1 className="mm-title">إدارة المديرين</h1>
            <p className="mm-subtitle">{managers.length} مدير مسجّل في النظام</p>
          </div>
          <button className="mm-btn-add" onClick={openAdd}>
            <FaPlus /> إضافة مدير
          </button>
        </div>

        {/* Search */}
        <div className="mm-search-wrap">
          <FaSearch className="mm-search-icon" />
          <input
            type="text"
            className="mm-search"
            placeholder="البحث بالاسم أو البريد أو رقم الهاتف..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {search && (
            <button className="mm-search-clear" onClick={() => handleSearch("")}>
              <FaTimes />
            </button>
          )}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="mm-empty">
            <div className="mm-empty-icon">👥</div>
            <p className="mm-empty-title">
              {search ? "لا توجد نتائج للبحث" : "لا يوجد مديرون بعد"}
            </p>
            <p className="mm-empty-sub">
              {search ? "جرّب كلمة بحث مختلفة" : 'اضغط "إضافة مدير" لبدء الإضافة'}
            </p>
          </div>
        ) : (
          <ul className="mm-list">
            {filtered.map((m) => (
              <li key={m.id} className="mm-card">
                <div className="mm-avatar" style={{ background: avatarColor(m.id) }}>
                  {getInitials(m)}
                </div>

                <div className="mm-info">
                  <p className="mm-name">
                    {m.name || <span className="mm-no-name">بدون اسم</span>}
                  </p>
                  <p className="mm-detail">{m.email}</p>
                  {m.phoneNumber && <p className="mm-detail">{m.phoneNumber}</p>}
                </div>

                {confirmId === m.id ? (
                  <div className="mm-confirm">
                    <span>تأكيد الحذف؟</span>
                    <button className="mm-btn-danger-sm" onClick={() => handleDelete(m.id)}>
                      حذف
                    </button>
                    <button className="mm-btn-ghost-sm" onClick={() => setConfirmId(null)}>
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <div className="mm-actions">
                    <button
                      className="mm-icon-btn mm-icon-btn--edit"
                      onClick={() => openEdit(m)}
                      title="تعديل"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="mm-icon-btn mm-icon-btn--delete"
                      onClick={() => setConfirmId(m.id)}
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
          <Modal title="إضافة مدير جديد" onClose={() => setShowAdd(false)}>
            <form onSubmit={handleAdd} className="mm-form">
              {addError && <p className="mm-form-error">{addError}</p>}

              <div className="mm-field">
                <label>البريد الإلكتروني للمدير</label>
                <input
                  type="email"
                  placeholder="manager@example.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="mm-field">
                <label>كلمة المرور</label>
                <div className="mm-pw-wrap">
                  <input
                    type={showNewPw ? "text" : "password"}
                    placeholder="6 أحرف على الأقل"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    required
                  />
                  <button type="button" className="mm-pw-toggle"
                    onClick={() => setShowNewPw(!showNewPw)}>
                    {showNewPw ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="mm-divider"><span>تأكيد هويتك كمدير عام</span></div>

              <div className="mm-field">
                <label>كلمة مرورك الحالية (Admin)</label>
                <div className="mm-pw-wrap">
                  <input
                    type={showAdminPw ? "text" : "password"}
                    placeholder="كلمة مرورك الحالية"
                    value={addForm.adminPw}
                    onChange={(e) => setAddForm({ ...addForm, adminPw: e.target.value })}
                    required
                  />
                  <button type="button" className="mm-pw-toggle"
                    onClick={() => setShowAdminPw(!showAdminPw)}>
                    {showAdminPw ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="mm-modal-footer">
                <button type="button" className="mm-btn-ghost"
                  onClick={() => setShowAdd(false)}>إلغاء</button>
                <button type="submit" className="mm-btn-primary" disabled={addLoading}>
                  {addLoading ? "جاري الإضافة..." : "إضافة المدير"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ── Edit Modal ── */}
        {editing && (
          <Modal title="تعديل بيانات المدير" onClose={() => setEditing(null)}>
            <form onSubmit={handleSaveEdit} className="mm-form">
              <div className="mm-field">
                <label>الاسم</label>
                <input type="text" placeholder="اسم المدير"
                  className="rtl-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="mm-field">
                <label>رقم الهاتف</label>
                <input type="text" placeholder="+966 5X XXX XXXX"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} />
              </div>
              <div className="mm-field">
                <label>العنوان</label>
                <input type="text" placeholder="المدينة / المنطقة"
                  className="rtl-input"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
              <div className="mm-modal-footer">
                <button type="button" className="mm-btn-ghost"
                  onClick={() => setEditing(null)}>إلغاء</button>
                <button type="submit" className="mm-btn-primary" disabled={editLoading}>
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

export default ManageManagers;
