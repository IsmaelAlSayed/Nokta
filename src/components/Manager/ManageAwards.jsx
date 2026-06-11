import React, { useState, useEffect } from "react";
import { db, storage, auth } from "../../firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FaPlus, FaTimes, FaEdit, FaTrash, FaTrophy, FaCamera } from "react-icons/fa";
import MangerLayout from "./ManagerLayout";
import "../../styles/ManageAwards.css";

const ManageAwards = () => {
  const [awards, setAwards]         = useState([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [msg, setMsg]               = useState("");
  const [msgType, setMsgType]       = useState("ok");
  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [prizeName, setPrizeName]   = useState("");
  const [exchangingValue, setExchangingValue] = useState("");
  const [prizeImage, setPrizeImage] = useState(null);

  const currentManager = auth.currentUser;

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, "awards"), where("managerId", "==", currentManager.uid));
        const snap = await getDocs(q);
        setAwards(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (_) {}
    };
    fetch();
  }, [currentManager.uid]);

  const uploadImage = async (image) => {
    const name = `${image.name}_${Date.now()}`;
    const imgRef = ref(storage, `awards/${name}`);
    await uploadBytes(imgRef, image);
    return await getDownloadURL(imgRef);
  };

  const openAdd = () => {
    setEditingId(null);
    setPrizeName("");
    setExchangingValue("");
    setPrizeImage(null);
    setShowModal(true);
  };

  const openEdit = (award) => {
    setEditingId(award.id);
    setPrizeName(award.prizeName);
    setExchangingValue(award.exchangingValue);
    setPrizeImage(null);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!prizeName.trim()) { setMsg("اسم الجائزة مطلوب"); setMsgType("err"); return; }
    if (isNaN(exchangingValue) || Number(exchangingValue) <= 0) { setMsg("قيمة الاستبدال يجب أن تكون موجبة"); setMsgType("err"); return; }

    setIsLoading(true);
    try {
      let imageUrl = "";
      if (prizeImage) imageUrl = await uploadImage(prizeImage);

      const data = { prizeName, exchangingValue: Number(exchangingValue), managerId: currentManager.uid };
      if (imageUrl) data.imageUrl = imageUrl;

      if (editingId) {
        await updateDoc(doc(db, "awards", editingId), data);
        setMsg("تم التحديث بنجاح"); setMsgType("ok");
      } else {
        await addDoc(collection(db, "awards"), data);
        setMsg("تمت الإضافة بنجاح"); setMsgType("ok");
      }

      const q = query(collection(db, "awards"), where("managerId", "==", currentManager.uid));
      const snap = await getDocs(q);
      setAwards(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setShowModal(false);
    } catch (_) {
      setMsg("حدث خطأ أثناء الحفظ"); setMsgType("err");
    }
    setIsLoading(false);
  };

  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "awards", id));
      setAwards((prev) => prev.filter((a) => a.id !== id));
      setMsg("تم الحذف"); setMsgType("ok");
    } catch (_) {}
    setIsLoading(false);
  };

  return (
    <MangerLayout>
      <div className="maw-page">
        <div className="maw-header">
          <h1 className="maw-title">الجوائز</h1>
          <button className="maw-btn-add" onClick={openAdd}>
            <FaPlus /> إضافة جائزة
          </button>
        </div>

        {msg && (
          <p className={`maw-msg maw-msg-${msgType}`}>{msg}</p>
        )}

        {awards.length === 0 ? (
          <p className="maw-empty">لا توجد جوائز حتى الآن</p>
        ) : (
          <div className="maw-grid">
            {awards.map((award) => (
              <div key={award.id} className="maw-card">
                {award.imageUrl ? (
                  <img src={award.imageUrl} alt={award.prizeName} className="maw-card-img" />
                ) : (
                  <div className="maw-card-img-placeholder"><FaTrophy /></div>
                )}
                <p className="maw-card-name">{award.prizeName}</p>
                <p className="maw-card-pts">{award.exchangingValue} نقطة</p>
                <div className="maw-card-actions">
                  <button className="maw-icon-btn maw-icon-btn-edit" onClick={() => openEdit(award)}>
                    <FaEdit /> تعديل
                  </button>
                  <button className="maw-icon-btn maw-icon-btn-del" onClick={() => handleDelete(award.id)} disabled={isLoading}>
                    <FaTrash /> حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="maw-overlay" onClick={() => setShowModal(false)}>
            <div className="maw-modal" onClick={(e) => e.stopPropagation()}>
              <div className="maw-modal-header">
                <h2>{editingId ? "تعديل الجائزة" : "إضافة جائزة جديدة"}</h2>
                <button className="maw-modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
              </div>
              <form className="maw-form" onSubmit={handleSave}>
                <div className="maw-field">
                  <label>اسم الجائزة</label>
                  <input className="maw-input" type="text" value={prizeName} onChange={(e) => setPrizeName(e.target.value)} required />
                </div>
                <div className="maw-field">
                  <label>قيمة الاستبدال (نقطة)</label>
                  <input className="maw-input" type="number" value={exchangingValue} onChange={(e) => setExchangingValue(e.target.value)} required />
                </div>
                <div className="maw-field">
                  <label>صورة الجائزة (اختياري)</label>
                  <label className="maw-file-label">
                    <FaCamera />
                    <span>{prizeImage ? prizeImage.name : "اختر صورة"}</span>
                    <input type="file" accept="image/*" className="maw-file-input" onChange={(e) => setPrizeImage(e.target.files[0])} />
                  </label>
                </div>
                <div className="maw-modal-footer">
                  <button type="button" className="maw-btn-cancel" onClick={() => setShowModal(false)}>إلغاء</button>
                  <button type="submit" className="maw-btn-save" disabled={isLoading}>
                    {isLoading ? "جاري..." : editingId ? "حفظ" : "إضافة"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MangerLayout>
  );
};

export default ManageAwards;
