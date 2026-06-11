import React, { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import {
  collection, getDocs, addDoc, updateDoc, doc, runTransaction, query, where,
} from "firebase/firestore";
import { FaSearch, FaTimes, FaTag, FaShoppingBag } from "react-icons/fa";
import DiscountModal from "./DiscountModal";
import ManagerLayout from "./ManagerLayout";
import { useToast } from "../../context/ToastContext";
import "../../styles/AddOrder.css";

const AddOrder = () => {
  const { showToast } = useToast();

  const [customers, setCustomers]               = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery]           = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const [products, setProducts]                 = useState([]);
  const [categories, setCategories]             = useState([]);
  const [subcategories, setSubcategories]       = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  const [orderItems, setOrderItems]             = useState([]);
  const [totalPrice, setTotalPrice]             = useState(0);
  const [discount, setDiscount]                 = useState({ type: null, value: 0 });
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [error, setError]                       = useState("");
  const [submitting, setSubmitting]             = useState(false);

  const [activeTab, setActiveTab]               = useState("products");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custSnap, prodSnap, catSnap, subSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "products")),
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "subcategories")),
        ]);
        setCustomers(custSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.role === "customer"));
        setProducts(prodSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCategories(catSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setSubcategories(subSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (_) {}
    };
    fetchData();
  }, []);

  useEffect(() => {
    let total = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    if (discount.type === "percentage") total -= total * (discount.value / 100);
    else if (discount.type === "value") total -= discount.value;
    setTotalPrice(Math.max(0, total));
  }, [orderItems, discount]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) { setFilteredCustomers([]); return; }
    const lq = q.toLowerCase();
    setFilteredCustomers(customers.filter(
      (c) => c.name?.toLowerCase().includes(lq) || c.phoneNumber?.includes(q)
    ));
  };

  const handleAddProduct = (product) => {
    setOrderItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id);
      if (idx >= 0) return prev.map((i, ix) => ix === idx ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, quantity: 1 }];
    });
  };

  const handleQtyChange = (index, delta) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty < 1) return prev.filter((_, i) => i !== index);
      updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });
  };

  const handleRemove = (index) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredProducts = products.filter((p) => {
    if (!selectedCategory) return false;
    const okCat = p.category === selectedCategory;
    if (selectedSubcategory) return okCat && p.subcategory === selectedSubcategory;
    return okCat;
  });

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleSubmit = async () => {
    if (!selectedCustomer || orderItems.length === 0) {
      setError("اختر زبوناً وأضف منتجاً على الأقل");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const counterRef = doc(db, "counters", "ordersCounter");
      const serialNumber = await runTransaction(db, async (tx) => {
        const cdoc = await tx.get(counterRef);
        const newCount = cdoc.exists() ? cdoc.data().current + 1 : 1;
        cdoc.exists() ? tx.update(counterRef, { current: newCount }) : tx.set(counterRef, { current: newCount });
        return `ORD-${String(newCount).padStart(13, "0")}`;
      });

      const loyaltySnap = await getDocs(query(collection(db, "loyaltyPoints"), where("customers", "array-contains", selectedCustomer)));
      const loyaltyConfig = loyaltySnap.docs.length > 0 ? { id: loyaltySnap.docs[0].id, ...loyaltySnap.docs[0].data() } : null;
      const earnedPoints = loyaltyConfig ? totalPrice * loyaltyConfig.pointsPerDollar : 0;

      await addDoc(collection(db, "orders"), {
        customerId: selectedCustomer,
        items: orderItems,
        totalPrice,
        earnedLoyaltyPoints: earnedPoints,
        serialNumber,
        createdAt: new Date(),
      });

      if (earnedPoints > 0 && loyaltyConfig) {
        const current = loyaltyConfig.pointsByCustomer?.[selectedCustomer] || 0;
        await updateDoc(doc(db, "loyaltyPoints", loyaltyConfig.id), {
          pointsByCustomer: { ...loyaltyConfig.pointsByCustomer, [selectedCustomer]: current + earnedPoints },
        });
      }

      setSelectedCustomer(""); setOrderItems([]); setTotalPrice(0);
      setDiscount({ type: null, value: 0 }); setSearchQuery(""); setFilteredCustomers([]);
      setActiveTab("products");
      showToast(
        earnedPoints > 0
          ? `تمت إضافة الطلب — النقاط المكتسبة: ${Math.round(earnedPoints)}`
          : "تمت إضافة الطلب بنجاح",
        "success"
      );
    } catch (err) {
      setError("فشل الإرسال: " + err.message);
    }
    setSubmitting(false);
  };

  return (
    <ManagerLayout>
      <div className="ao-page">
        <h1 className="ao-title">إضافة طلب</h1>

        {/* ── Customer search ── */}
        <div className="ao-customer-card">
          <p className="ao-card-label">الزبون</p>
          <div className="ao-search-wrap">
            <FaSearch className="ao-search-icon" />
            <input
              className="ao-search"
              type="text"
              placeholder="البحث بالاسم أو الهاتف..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          {filteredCustomers.length > 0 && (
            <ul className="ao-suggestions">
              {filteredCustomers.map((c) => (
                <li
                  key={c.id}
                  className="ao-suggestion-item"
                  onClick={() => {
                    setSelectedCustomer(c.id);
                    setSearchQuery(c.name || c.email);
                    setFilteredCustomers([]);
                  }}
                >
                  {c.name || c.email} — {c.phoneNumber || "—"}
                </li>
              ))}
            </ul>
          )}
          {selectedCustomer && (
            <div className="ao-selected-customer">
              الزبون المحدد: {searchQuery}
              <button
                style={{ marginRight: 10, background: "none", border: "none", cursor: "pointer", color: "#065f46" }}
                onClick={() => { setSelectedCustomer(""); setSearchQuery(""); }}
              >
                <FaTimes />
              </button>
            </div>
          )}
        </div>

        {error && <p className="ao-error">{error}</p>}

        {/* ── Tabs ── */}
        <div className="ao-tabs">
          <button
            className={`ao-tab ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            <FaTag style={{ marginLeft: 5 }} /> المنتجات
          </button>
          <button
            className={`ao-tab ${activeTab === "order" ? "active" : ""}`}
            onClick={() => setActiveTab("order")}
          >
            <FaShoppingBag style={{ marginLeft: 5 }} />
            الطلب
            {orderItems.length > 0 && (
              <span className="ao-tab-badge">{orderItems.length}</span>
            )}
          </button>
        </div>

        {/* ── Products tab ── */}
        {activeTab === "products" && (
          <>
            <div className="ao-cats">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`ao-cat-chip ${selectedCategory === cat.id ? "active" : ""}`}
                  onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(null); }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {selectedCategory && (
              <div className="ao-subcats">
                {subcategories
                  .filter((s) => s.category === selectedCategory)
                  .map((sub) => (
                    <button
                      key={sub.id}
                      className={`ao-subcat-chip ${selectedSubcategory === sub.id ? "active" : ""}`}
                      onClick={() => setSelectedSubcategory((prev) => prev === sub.id ? null : sub.id)}
                    >
                      {sub.name}
                    </button>
                  ))}
              </div>
            )}

            {selectedCategory ? (
              filteredProducts.length > 0 ? (
                <div className="ao-product-grid">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="ao-product-card" onClick={() => handleAddProduct(p)}>
                      <img src={p.imageUrl} alt={p.name} className="ao-product-img" />
                      <p className="ao-product-name">{p.name}</p>
                      <p className="ao-product-price">{p.price?.toFixed(2)} ₪</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ao-no-products">لا توجد منتجات في هذا التصنيف</p>
              )
            ) : (
              <p className="ao-no-products">اختر تصنيفاً لعرض المنتجات</p>
            )}
          </>
        )}

        {/* ── Order tab ── */}
        {activeTab === "order" && (
          <>
            {orderItems.length === 0 ? (
              <p className="ao-order-empty">لم تضف منتجات بعد. اذهب لتبويب المنتجات.</p>
            ) : (
              <div className="ao-order-items">
                {orderItems.map((item, i) => (
                  <div key={i} className="ao-order-item">
                    <img src={item.imageUrl} alt={item.name} className="ao-oi-img" />
                    <div className="ao-oi-info">
                      <p className="ao-oi-name">{item.name}</p>
                      <p className="ao-oi-price">{item.price?.toFixed(2)} ₪ / وحدة</p>
                    </div>
                    <div className="ao-oi-right">
                      <div className="ao-qty-wrap">
                        <button className="ao-qty-btn" onClick={() => handleQtyChange(i, -1)}>−</button>
                        <span className="ao-qty-num">{item.quantity}</span>
                        <button className="ao-qty-btn" onClick={() => handleQtyChange(i, +1)}>+</button>
                      </div>
                      <p className="ao-oi-total">{(item.price * item.quantity).toFixed(2)} ₪</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {orderItems.length > 0 && (
              <>
                <div className="ao-pricing">
                  <div className="ao-pricing-row">
                    <span>المجموع الفرعي</span>
                    <span>{subtotal.toFixed(2)} ₪</span>
                  </div>
                  {discount.value > 0 && (
                    <div className="ao-pricing-row">
                      <span>
                        خصم{" "}
                        <span className="ao-discount-chip">
                          {discount.type === "percentage" ? `${discount.value}%` : `${discount.value} ₪`}
                        </span>
                      </span>
                      <span>
                        -{discount.type === "percentage"
                          ? (subtotal * discount.value / 100).toFixed(2)
                          : discount.value.toFixed(2)} ₪
                      </span>
                    </div>
                  )}
                  <div className="ao-pricing-row total">
                    <span>الإجمالي</span>
                    <span>{totalPrice.toFixed(2)} ₪</span>
                  </div>
                  <button className="ao-discount-btn" onClick={() => setIsDiscountModalOpen(true)}>
                    + إضافة خصم
                  </button>
                </div>

                <button className="ao-submit-btn" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
                </button>
              </>
            )}
          </>
        )}

        {isDiscountModalOpen && (
          <DiscountModal
            onApply={(d) => { setDiscount(d); setIsDiscountModalOpen(false); }}
            onClose={() => setIsDiscountModalOpen(false)}
          />
        )}
      </div>
    </ManagerLayout>
  );
};

export default AddOrder;
