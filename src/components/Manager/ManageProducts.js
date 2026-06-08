import React, { useEffect, useState } from "react";
import { db, storage } from "../../firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FaPlus, FaTimes, FaEdit, FaTrash, FaSearch, FaCamera } from "react-icons/fa";
import MangerLayout from "./ManagerLayout";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import "../../styles/ManageProducts.css";

const EMPTY_FORM = { name: "", price: "", description: "", category: "", subcategory: "", image: null };

const ManageProducts = () => {
  const [products, setProducts]           = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery]     = useState("");
  const [categories, setCategories]       = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [showModal, setShowModal]         = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [previewUrl, setPreviewUrl]       = useState("");
  const [uploading, setUploading]         = useState(false);
  const [error, setError]                 = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [prodSnap, catSnap, subSnap] = await Promise.all([
          getDocs(collection(db, "products")),
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "subcategories")),
        ]);
        const prods = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(prods); setFilteredProducts(prods);
        setCategories(catSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setAllSubcategories(subSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (_) {}
    };
    fetch();
  }, []);

  useEffect(() => {
    setFilteredProducts(
      products.filter((p) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [products, searchQuery]);

  const openAdd = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setPreviewUrl("");
    setError("");
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({ ...EMPTY_FORM, name: product.name, price: product.price, description: product.description, category: product.category, subcategory: product.subcategory || "" });
    setPreviewUrl(product.imageUrl || "");
    setSubcategories(allSubcategories.filter((s) => s.category === product.category));
    setError("");
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, image: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    setForm((prev) => ({ ...prev, category: catId, subcategory: "" }));
    setSubcategories(allSubcategories.filter((s) => s.category === catId));
  };

  const uploadImage = async (image) => {
    const uniqueName = `${image.name}_${Date.now()}`;
    const imgRef = ref(storage, `products/${uniqueName}`);
    await uploadBytes(imgRef, image);
    await new Promise((r) => setTimeout(r, 5000));
    return await getDownloadURL(ref(storage, `products/${uniqueName}_200x200`));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      setError("الاسم والسعر والتصنيف مطلوبة");
      return;
    }
    if (!editingProduct && !form.image) {
      setError("الصورة مطلوبة");
      return;
    }
    setUploading(true);
    setError("");
    try {
      let imageUrl = editingProduct?.imageUrl || "";
      if (form.image) imageUrl = await uploadImage(form.image);

      const data = {
        name: form.name,
        price: parseFloat(form.price),
        description: form.description,
        category: form.category,
        subcategory: form.subcategory || null,
        imageUrl,
      };

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), data);
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...data } : p))
        );
      } else {
        const ref = await addDoc(collection(db, "products"), data);
        setProducts((prev) => [...prev, { id: ref.id, ...data }]);
      }
      setShowModal(false);
    } catch (err) {
      setError("فشل الحفظ: " + err.message);
    }
    setUploading(false);
  };

  const confirmDelete = (id) => { setProductToDelete(id); setShowDeleteModal(true); };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, "products", id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (_) {}
  };

  return (
    <MangerLayout>
      <div className="mp-page">
        {/* Header */}
        <div className="mp-header">
          <h1 className="mp-title">المنتجات</h1>
          <button className="mp-btn-add" onClick={openAdd}>
            <FaPlus /> إضافة
          </button>
        </div>

        {/* Search */}
        <div className="mp-search-wrap">
          <FaSearch className="mp-search-icon" />
          <input
            className="mp-search"
            type="text"
            placeholder="البحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Product list */}
        {filteredProducts.length === 0 ? (
          <p className="mp-empty">لا توجد منتجات</p>
        ) : (
          <div className="mp-list">
            {filteredProducts.map((product) => {
              const cat = categories.find((c) => c.id === product.category);
              const sub = allSubcategories.find((s) => s.id === product.subcategory);
              return (
                <div key={product.id} className="mp-item">
                  <img src={product.imageUrl} alt={product.name} className="mp-item-img" />
                  <div className="mp-item-info">
                    <p className="mp-item-name">{product.name}</p>
                    <p className="mp-item-meta">{cat?.name || "—"}{sub ? ` ← ${sub.name}` : ""}</p>
                    <p className="mp-item-price">{product.price?.toFixed(2)} ₪</p>
                  </div>
                  <div className="mp-item-actions">
                    <button className="mp-icon-btn mp-icon-btn-edit" onClick={() => openEdit(product)}>
                      <FaEdit />
                    </button>
                    <button className="mp-icon-btn mp-icon-btn-del" onClick={() => confirmDelete(product.id)}>
                      <FaTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add / Edit Modal */}
        {showModal && (
          <div className="mp-overlay" onClick={() => setShowModal(false)}>
            <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
              <div className="mp-modal-header">
                <h2>{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</h2>
                <button className="mp-modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
              </div>
              <form className="mp-form" onSubmit={handleSave}>
                {error && <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{error}</p>}

                {previewUrl && (
                  <img src={previewUrl} alt="preview" className="mp-img-preview" />
                )}

                <div className="mp-field">
                  <label>صورة المنتج</label>
                  <label className="mp-file-label">
                    <FaCamera />
                    <span>{form.image ? form.image.name : "اختر صورة"}</span>
                    <input type="file" accept="image/*" className="mp-file-input" onChange={handleImageChange} />
                  </label>
                </div>

                <div className="mp-field">
                  <label>اسم المنتج</label>
                  <input className="mp-input" type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                </div>

                <div className="mp-field">
                  <label>السعر (₪)</label>
                  <input className="mp-input" type="number" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required />
                </div>

                <div className="mp-field">
                  <label>الوصف</label>
                  <textarea className="mp-textarea" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                </div>

                <div className="mp-field">
                  <label>التصنيف</label>
                  <select className="mp-select" value={form.category} onChange={handleCategoryChange} required>
                    <option value="">اختر التصنيف</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="mp-field">
                  <label>التصنيف الفرعي (اختياري)</label>
                  <select className="mp-select" value={form.subcategory} onChange={(e) => setForm((p) => ({ ...p, subcategory: e.target.value }))} disabled={!form.category}>
                    <option value="">بدون تصنيف فرعي</option>
                    {subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {uploading && <p className="mp-uploading">جاري الرفع، انتظر...</p>}

                <div className="mp-modal-footer">
                  <button type="button" className="mp-btn-cancel" onClick={() => setShowModal(false)}>إلغاء</button>
                  <button type="submit" className="mp-btn-save" disabled={uploading}>
                    {uploading ? "جاري..." : editingProduct ? "حفظ" : "إضافة"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <ConfirmDeleteModal
            message="هل أنت متأكد من حذف هذا المنتج؟"
            onConfirm={() => { handleDeleteProduct(productToDelete); setShowDeleteModal(false); setProductToDelete(null); }}
            onCancel={() => { setShowDeleteModal(false); setProductToDelete(null); }}
          />
        )}
      </div>
    </MangerLayout>
  );
};

export default ManageProducts;
