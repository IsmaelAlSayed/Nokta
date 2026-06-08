import React, { useState, useEffect } from "react";
import { db, storage, auth } from "../../firebaseConfig";
import {
  collection, getDocs, setDoc, deleteDoc, doc, updateDoc, query, where, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FaPlus, FaTimes, FaEdit, FaTrash, FaUsers, FaCamera } from "react-icons/fa";
import AssignedCustomersModal from "./AssignedCustomersModal";
import MangerLayout from "./ManagerLayout";
import "../../styles/LoyaltyPoints.css";

const EMPTY_PRIZE = { prizeName: "", exchangingValue: "", tier: "", prizeImage: null, prizeImageUrl: "" };

const LoyaltyPoints = () => {
  const [loyaltyPointsList, setLoyaltyPointsList] = useState([]);
  const [isLoading, setIsLoading]                 = useState(false);
  const [msg, setMsg]                             = useState("");
  const [msgType, setMsgType]                     = useState("ok");

  /* ── Form ── */
  const [editingId, setEditingId]           = useState(null);
  const [name, setName]                     = useState("");
  const [pointsPerDollar, setPointsPerDollar] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [prizes, setPrizes]                 = useState([]);
  const [currentPrize, setCurrentPrize]     = useState(EMPTY_PRIZE);

  /* ── Customers ── */
  const [customers, setCustomers]           = useState([]);
  const [searchTerm, setSearchTerm]         = useState("");

  /* ── Assigned Customers Modal ── */
  const [modalOpen, setModalOpen]           = useState(false);
  const [currentLoyalty, setCurrentLoyalty] = useState(null);

  const currentManager = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [loySnap, custSnap] = await Promise.all([
          getDocs(query(collection(db, "loyaltyPoints"), where("managerId", "==", currentManager.uid))),
          getDocs(collection(db, "users")),
        ]);
        setLoyaltyPointsList(loySnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCustomers(custSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.role === "customer"));
      } catch (_) {}
      setIsLoading(false);
    };
    fetchData();
  }, [currentManager.uid]);

  const uploadPrizeImage = async (image) => {
    if (!image) return "";
    const name = `${image.name}_${Date.now()}`;
    const imgRef = ref(storage, `prizes/${name}`);
    await uploadBytes(imgRef, image);
    return await getDownloadURL(imgRef);
  };

  const handleAddPrize = async () => {
    if (!currentPrize.prizeName.trim()) { setMsg("اسم الجائزة مطلوب"); setMsgType("err"); return; }
    if (isNaN(currentPrize.exchangingValue) || Number(currentPrize.exchangingValue) <= 0) {
      setMsg("قيمة الاستبدال يجب أن تكون موجبة"); setMsgType("err"); return;
    }
    let prizeImageUrl = "";
    if (currentPrize.prizeImage) {
      try { prizeImageUrl = await uploadPrizeImage(currentPrize.prizeImage); }
      catch (_) { setMsg("فشل رفع صورة الجائزة"); setMsgType("err"); return; }
    }
    setPrizes((prev) => [...prev, {
      prizeName: currentPrize.prizeName,
      exchangingValue: Number(currentPrize.exchangingValue),
      tier: currentPrize.tier ? Number(currentPrize.tier) : null,
      prizeImageUrl,
    }]);
    setCurrentPrize(EMPTY_PRIZE);
    setMsg("");
  };

  const handleSaveConfiguration = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setMsg("أدخل اسم البرنامج"); setMsgType("err"); return; }
    if (isNaN(pointsPerDollar) || Number(pointsPerDollar) <= 0) {
      setMsg("نقاط الشيكل يجب أن تكون موجبة"); setMsgType("err"); return;
    }
    setIsLoading(true);
    try {
      const configData = { name, pointsPerDollar: Number(pointsPerDollar), customers: selectedCustomers, managerId: currentManager.uid, prizes };
      if (editingId) {
        await setDoc(doc(db, "loyaltyPoints", editingId), configData);
        setMsg("تم التحديث بنجاح"); setMsgType("ok");
      } else {
        const newDoc = doc(collection(db, "loyaltyPoints"));
        await setDoc(newDoc, configData);
        setMsg("تم الإنشاء بنجاح"); setMsgType("ok");
      }
      const snap = await getDocs(query(collection(db, "loyaltyPoints"), where("managerId", "==", currentManager.uid)));
      setLoyaltyPointsList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      resetForm();
    } catch (_) {
      setMsg("فشل الحفظ"); setMsgType("err");
    }
    setIsLoading(false);
  };

  const handleDeleteLoyalty = async (loyaltyId) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟")) return;
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "loyaltyPoints", loyaltyId));
      setLoyaltyPointsList((prev) => prev.filter((i) => i.id !== loyaltyId));
      setMsg("تم الحذف"); setMsgType("ok");
    } catch (_) {}
    setIsLoading(false);
  };

  const handleEdit = (config) => {
    setEditingId(config.id);
    setName(config.name);
    setPointsPerDollar(config.pointsPerDollar);
    setSelectedCustomers(config.customers || []);
    setPrizes(config.prizes || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null); setName(""); setPointsPerDollar("");
    setSelectedCustomers([]); setPrizes([]); setCurrentPrize(EMPTY_PRIZE);
  };

  const filteredCustomers = customers.filter(
    (c) => c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.phoneNumber?.includes(searchTerm)
  );

  return (
    <MangerLayout>
      <div className="lp-page">
        <h1 className="lp-title">برامج الولاء</h1>

        {msg && <p className={`lp-msg lp-msg-${msgType}`}>{msg}</p>}

        {/* ── Create / Edit Form ── */}
        <form className="lp-card" onSubmit={handleSaveConfiguration}>
          <p className="lp-card-title">{editingId ? "تعديل البرنامج" : "إنشاء برنامج جديد"}</p>

          <div className="lp-field">
            <label className="lp-label">اسم البرنامج</label>
            <input className="lp-input" type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} required />
          </div>

          <div className="lp-field">
            <label className="lp-label">نقطة لكل شيكل</label>
            <input className="lp-input" type="number" step="0.1" min="0" value={pointsPerDollar} onChange={(e) => setPointsPerDollar(e.target.value)} disabled={isLoading} required />
          </div>

          {/* Prizes */}
          <div className="lp-card" style={{ boxShadow: "none", background: "#f8fafc", padding: 12 }}>
            <p className="lp-card-title" style={{ paddingBottom: 8, marginBottom: 0 }}>الجوائز</p>
            <div className="lp-prize-grid">
              <div className="lp-field" style={{ gridColumn: "span 2" }}>
                <input className="lp-input" type="text" placeholder="اسم الجائزة" value={currentPrize.prizeName} onChange={(e) => setCurrentPrize((p) => ({ ...p, prizeName: e.target.value }))} />
              </div>
              <div className="lp-field">
                <input className="lp-input" type="number" placeholder="قيمة الاستبدال" value={currentPrize.exchangingValue} onChange={(e) => setCurrentPrize((p) => ({ ...p, exchangingValue: e.target.value }))} />
              </div>
              <div className="lp-field">
                <input className="lp-input" type="number" placeholder="المستوى (اختياري)" value={currentPrize.tier} onChange={(e) => setCurrentPrize((p) => ({ ...p, tier: e.target.value }))} />
              </div>
              <label className="lp-file-label">
                <FaCamera /> {currentPrize.prizeImage ? currentPrize.prizeImage.name : "صورة الجائزة (اختياري)"}
                <input type="file" accept="image/*" className="lp-file-input" onChange={(e) => setCurrentPrize((p) => ({ ...p, prizeImage: e.target.files[0] }))} />
              </label>
              <button type="button" className="lp-prize-add-btn" onClick={handleAddPrize}>
                <FaPlus style={{ marginLeft: 6 }} /> إضافة جائزة للقائمة
              </button>
            </div>

            {prizes.length > 0 && (
              <div className="lp-prizes">
                {prizes.map((prize, i) => (
                  <div key={i} className="lp-prize-item">
                    {prize.prizeImageUrl && <img src={prize.prizeImageUrl} alt={prize.prizeName} className="lp-prize-img" />}
                    <div className="lp-prize-info">
                      <p className="lp-prize-name">{prize.prizeName}</p>
                      <p className="lp-prize-pts">{prize.exchangingValue} نقطة</p>
                    </div>
                    <button type="button" className="lp-prize-remove" onClick={() => setPrizes((p) => p.filter((_, ix) => ix !== i))}>
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer assignment */}
          <div className="lp-card" style={{ boxShadow: "none", background: "#f8fafc", padding: 12 }}>
            <p className="lp-card-title" style={{ paddingBottom: 8, marginBottom: 0 }}>تحديد الزبائن</p>
            <input
              className="lp-cust-search"
              type="text"
              placeholder="بحث بالاسم أو الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="lp-cust-list">
              {filteredCustomers.map((c) => (
                <div key={c.id} className="lp-cust-item">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(c.id)}
                    onChange={(e) => {
                      setSelectedCustomers((prev) =>
                        e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                      );
                    }}
                  />
                  <span className="lp-cust-name">{c.name || "—"}</span>
                  <span className="lp-cust-phone">{c.phoneNumber}</span>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="lp-save-btn" disabled={isLoading}>
            {isLoading ? "جاري..." : editingId ? "تحديث البرنامج" : "إنشاء البرنامج"}
          </button>
          {editingId && (
            <button type="button" className="lp-cancel-btn" onClick={resetForm}>إلغاء التعديل</button>
          )}
        </form>

        {/* ── Existing configs ── */}
        {isLoading && loyaltyPointsList.length === 0 ? (
          <div className="lp-loading"><div className="lp-spinner" /></div>
        ) : (
          <>
            <p className="lp-card-title">البرامج الحالية ({loyaltyPointsList.length})</p>
            {loyaltyPointsList.map((config) => (
              <div key={config.id} className="lp-config-item">
                <div className="lp-config-top">
                  <div>
                    <p className="lp-config-name">{config.name}</p>
                    <p className="lp-config-rate">{config.pointsPerDollar} نقطة / شيكل</p>
                  </div>
                  <div className="lp-config-pts-badge">
                    <span className="lp-config-pts-val">{config.customers?.length || 0}</span>
                    <span className="lp-config-pts-lbl">زبون</span>
                  </div>
                </div>
                <div className="lp-config-actions">
                  <button className="lp-cfg-btn lp-cfg-btn-edit" onClick={() => handleEdit(config)} disabled={isLoading}>
                    <FaEdit style={{ marginLeft: 4 }} /> تعديل
                  </button>
                  <button className="lp-cfg-btn lp-cfg-btn-cust" onClick={() => { setCurrentLoyalty(config); setModalOpen(true); }}>
                    <FaUsers style={{ marginLeft: 4 }} /> الزبائن
                  </button>
                  <button className="lp-cfg-btn lp-cfg-btn-del" onClick={() => handleDeleteLoyalty(config.id)} disabled={isLoading}>
                    <FaTrash style={{ marginLeft: 4 }} /> حذف
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {modalOpen && currentLoyalty && (
          <AssignedCustomersModal
            loyalty={currentLoyalty}
            customers={customers}
            onClose={() => setModalOpen(false)}
          />
        )}
      </div>
    </MangerLayout>
  );
};

export default LoyaltyPoints;
