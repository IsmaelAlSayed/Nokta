import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { FaSearch, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import ManagerLayout from "./ManagerLayout";
import "../../styles/ManageCategories.css";

const ManageCategories = () => {
  const [categories, setCategories]       = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [searchQuery, setSearchQuery]     = useState("");
  const [editingCategory, setEditingCategory] = useState(null);

  /* ── New category ── */
  const [newCategory, setNewCategory]     = useState("");
  /* ── New subcategory ── */
  const [newSubcategory, setNewSubcategory]   = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const [catSnap, subSnap] = await Promise.all([
        getDocs(collection(db, "categories")),
        getDocs(collection(db, "subcategories")),
      ]);
      setCategories(catSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setSubcategories(subSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetch();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const ref = await addDoc(collection(db, "categories"), { name: newCategory });
    setCategories((prev) => [...prev, { id: ref.id, name: newCategory }]);
    setNewCategory("");
  };

  const handleEditCategory = async () => {
    if (!editingCategory?.name?.trim()) return;
    await updateDoc(doc(db, "categories", editingCategory.id), { name: editingCategory.name });
    setCategories((prev) =>
      prev.map((c) => (c.id === editingCategory.id ? { ...c, name: editingCategory.name } : c))
    );
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (id) => {
    await deleteDoc(doc(db, "categories", id));
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setSubcategories((prev) => prev.filter((s) => s.category !== id));
  };

  const handleAddSubcategory = async () => {
    if (!newSubcategory.trim() || !selectedCategory) return;
    const ref = await addDoc(collection(db, "subcategories"), { name: newSubcategory, category: selectedCategory });
    setSubcategories((prev) => [...prev, { id: ref.id, name: newSubcategory, category: selectedCategory }]);
    setNewSubcategory("");
  };

  const handleDeleteSubcategory = async (id) => {
    await deleteDoc(doc(db, "subcategories", id));
    setSubcategories((prev) => prev.filter((s) => s.id !== id));
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ManagerLayout>
      <div className="mcat-page">
        <h1 className="mcat-title">التصنيفات والتصنيفات الفرعية</h1>

        {/* ── Add Category ── */}
        <div className="mcat-card">
          <p className="mcat-card-title">إضافة تصنيف جديد</p>
          <div className="mcat-add-row">
            <div className="mcat-field">
              <input
                className="mcat-input"
                type="text"
                placeholder="اسم التصنيف"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
            </div>
            <button className="mcat-btn-add" onClick={handleAddCategory}>إضافة</button>
          </div>
        </div>

        {/* ── Search + Category list ── */}
        <div className="mcat-card">
          <p className="mcat-card-title">التصنيفات ({filteredCategories.length})</p>
          <div className="mcat-search-wrap">
            <FaSearch className="mcat-search-icon" />
            <input
              className="mcat-search"
              type="text"
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredCategories.length === 0 ? (
            <p className="mcat-empty">لا توجد تصنيفات</p>
          ) : (
            <div className="mcat-list">
              {filteredCategories.map((cat) => {
                const subCount = subcategories.filter((s) => s.category === cat.id).length;
                return (
                  <div key={cat.id} className="mcat-item">
                    <div>
                      <p className="mcat-item-name">{cat.name}</p>
                      <p className="mcat-item-count">{subCount} تصنيف فرعي</p>
                    </div>
                    <div className="mcat-item-actions">
                      <button className="mcat-icon-btn mcat-icon-btn-edit" onClick={() => setEditingCategory({ ...cat })}>
                        <FaEdit />
                      </button>
                      <button className="mcat-icon-btn mcat-icon-btn-del" onClick={() => handleDeleteCategory(cat.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Add Subcategory ── */}
        <div className="mcat-card">
          <p className="mcat-card-title">إضافة تصنيف فرعي</p>
          <div className="mcat-field">
            <label>التصنيف الرئيسي</label>
            <select className="mcat-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">اختر التصنيف</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="mcat-add-row">
            <div className="mcat-field">
              <input
                className="mcat-input"
                type="text"
                placeholder="اسم التصنيف الفرعي"
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubcategory()}
              />
            </div>
            <button className="mcat-btn-add" onClick={handleAddSubcategory} disabled={!selectedCategory}>إضافة</button>
          </div>
        </div>

        {/* ── Subcategory list ── */}
        <div className="mcat-card">
          <p className="mcat-card-title">التصنيفات الفرعية ({subcategories.length})</p>
          {subcategories.length === 0 ? (
            <p className="mcat-empty">لا توجد تصنيفات فرعية</p>
          ) : (
            <div className="mcat-sub-list">
              {subcategories.map((sub) => {
                const parent = categories.find((c) => c.id === sub.category);
                return (
                  <div key={sub.id} className="mcat-sub-item">
                    <div>
                      <p className="mcat-sub-name">{sub.name}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {parent && <span className="mcat-sub-parent">{parent.name}</span>}
                      <button className="mcat-icon-btn mcat-icon-btn-del" onClick={() => handleDeleteSubcategory(sub.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Edit modal ── */}
        {editingCategory && (
          <div className="mcat-overlay" onClick={() => setEditingCategory(null)}>
            <div className="mcat-modal" onClick={(e) => e.stopPropagation()}>
              <div className="mcat-modal-header">
                <h2>تعديل التصنيف</h2>
                <button className="mcat-modal-close" onClick={() => setEditingCategory(null)}><FaTimes /></button>
              </div>
              <div className="mcat-modal-body">
                <div className="mcat-field">
                  <label>اسم التصنيف</label>
                  <input
                    className="mcat-input"
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  />
                </div>
                <div className="mcat-modal-footer">
                  <button className="mcat-btn-cancel" onClick={() => setEditingCategory(null)}>إلغاء</button>
                  <button className="mcat-btn-save" onClick={handleEditCategory}>حفظ</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
};

export default ManageCategories;
