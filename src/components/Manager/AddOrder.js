import React, { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  runTransaction,
} from "firebase/firestore";
import DiscountModal from "./DiscountModal";
import ManagerLayout from "./ManagerLayout";
import "../../styles/AddOrder.css";

const AddOrder = () => {
  // State variables
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [error, setError] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [discount, setDiscount] = useState({ type: null, value: 0 });
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  // Fetch initial data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers (only those with role "customer")
        const customerSnapshot = await getDocs(collection(db, "users"));
        const customerList = customerSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((user) => user.role === "customer");
        setCustomers(customerList);

        // Fetch products
        const productSnapshot = await getDocs(collection(db, "products"));
        const productList = productSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productList);

        // Fetch categories
        const categorySnapshot = await getDocs(collection(db, "categories"));
        const categoryList = categorySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoryList);

        // Fetch subcategories
        const subcategorySnapshot = await getDocs(collection(db, "subcategories"));
        const subcategoryList = subcategorySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSubcategories(subcategoryList);
      } catch (err) {
        setError("Failed to fetch data.");
      }
    };

    fetchData();
  }, []);

  // Recalculate total whenever order items or discount change
  useEffect(() => {
    const calculateTotal = (items) => {
      let total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      if (discount.type === "percentage") {
        total -= total * (discount.value / 100);
      } else if (discount.type === "value") {
        total -= discount.value;
      }
      return total > 0 ? total : 0;
    };

    setTotalPrice(calculateTotal(orderItems));
  }, [orderItems, discount]);

  // Handle customer search input
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredCustomers([]);
      return;
    }

    const results = customers.filter(
      (customer) =>
        customer.name?.toLowerCase().includes(query) ||
        customer.phoneNumber?.includes(query)
    );
    setFilteredCustomers(results);
  };

  // Handle product addition to the order
  const handleAddProductToOrder = (product) => {
    const itemIndex = orderItems.findIndex((item) => item.productId === product.id);
    let updatedOrderItems = [];
    if (itemIndex >= 0) {
      updatedOrderItems = orderItems.map((item, index) =>
        index === itemIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedOrderItems = [
        ...orderItems,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: 1,
        },
      ];
    }
    setOrderItems(updatedOrderItems);
  };

  // Update product quantity within the order
  const handleQuantityChange = (index, quantity) => {
    if (quantity < 1) return;
    const updatedItems = [...orderItems];
    updatedItems[index].quantity = quantity;
    setOrderItems(updatedItems);
  };

  // Remove a product from the order
  const handleRemoveProductFromOrder = (index) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
  };

  // Handle category and subcategory selection for product filtering
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
  };

  const handleSubcategoryClick = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
  };

  // Filter products based on selected category/subcategory
  const filteredProducts = products.filter((product) => {
    if (!selectedCategory) return false;
    const matchesCategory = product.category === selectedCategory;
    if (selectedSubcategory) {
      return matchesCategory && product.subcategory === selectedSubcategory;
    }
    return matchesCategory;
  });

  // Handle discount application from the modal
  const handleApplyDiscount = (discountData) => {
    setDiscount(discountData);
    setIsDiscountModalOpen(false);
  };

  // Submit the order
  const handleSubmit = async () => {
    if (!selectedCustomer || orderItems.length === 0) {
      setError("Please select a customer and add at least one product.");
      return;
    }
  
    try {
      const orderTotal = totalPrice;
  
      // Generate sequential serial number using a Firestore counter
      const counterRef = doc(db, "counters", "ordersCounter");
      const newSerialNumber = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        if (!counterDoc.exists()) {
          // If no counter exists, initialize it to 1
          transaction.set(counterRef, { current: 1 });
          return 1;
        }
        const newCount = counterDoc.data().current + 1;
        transaction.update(counterRef, { current: newCount });
        return newCount;
      });
  
      // Pad the serial number to 13 digits and prepend with "ORD-"
      const paddedSerial = newSerialNumber.toString().padStart(13, "0");
      const serialNumber = `ORD-${paddedSerial}`;
  
      // Fetch the loyalty configuration for the selected customer.
      // (This assumes that each configuration document has a "customers" array.)
      const loyaltySnapshot = await getDocs(collection(db, "loyaltyPoints"));
      const loyaltyConfig = loyaltySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .find((config) => config.customers.includes(selectedCustomer));
  
      let earnedPoints = 0;
      if (loyaltyConfig) {
        earnedPoints = orderTotal * loyaltyConfig.pointsPerDollar;
      }
  
      // Create the order in Firestore with the unique serial number
      await addDoc(collection(db, "orders"), {
        customerId: selectedCustomer,
        items: orderItems,
        totalPrice: orderTotal,
        earnedLoyaltyPoints: earnedPoints,
        serialNumber, // Unique sequential serial number
        createdAt: new Date(),
      });
  
      // If earned points exist and the customer belongs to a loyalty configuration,
      // update that configuration's pointsByCustomer field.
      if (earnedPoints > 0 && loyaltyConfig) {
        // Get current points for the customer from the configuration (default to 0)
        const currentConfigPoints =
          loyaltyConfig.pointsByCustomer && loyaltyConfig.pointsByCustomer[selectedCustomer]
            ? loyaltyConfig.pointsByCustomer[selectedCustomer]
            : 0;
  
        // Update the loyalty configuration document with the new total for this customer.
        await updateDoc(doc(db, "loyaltyPoints", loyaltyConfig.id), {
          pointsByCustomer: {
            ...loyaltyConfig.pointsByCustomer,
            [selectedCustomer]: currentConfigPoints + earnedPoints,
          },
        });
      }
  
      // Reset form state after submission
      setSelectedCustomer("");
      setOrderItems([]);
      setTotalPrice(0);
      setDiscount({ type: null, value: 0 });
      setSearchQuery("");
      setFilteredCustomers([]);
      setError("");
      alert(
        `Order added successfully! ${
          earnedPoints > 0 ? `Loyalty Points Earned: ${earnedPoints}` : ""
        }`
      );
    } catch (err) {
      console.error("Error adding order:", err);
      setError("Failed to add order. Please try again.");
    }
  };

  return (
    <ManagerLayout>
      <div className="main-container">
        {/* Products Section */}
        <div className="products-section">
          <h2>Categories</h2>
          <div className="category-list">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-button ${
                  selectedCategory === category.id ? "active" : ""
                }`}
                onClick={() => handleCategoryClick(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Subcategories List */}
          {selectedCategory && (
            <>
              <h3>Subcategories</h3>
              <div className="subcategory-list">
                {subcategories
                  .filter((sub) => sub.category === selectedCategory)
                  .map((sub) => (
                    <button
                      key={sub.id}
                      className={`subcategory-button ${
                        selectedSubcategory === sub.id ? "active" : ""
                      }`}
                      onClick={() => handleSubcategoryClick(sub.id)}
                    >
                      {sub.name}
                    </button>
                  ))}
              </div>
            </>
          )}

          {/* Products Grid */}
          <h2>Products</h2>
          <div className="product-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => handleAddProductToOrder(product)}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="product-image"
                  />
                  <p className="product-name">{product.name}</p>
                  <p className="product-price">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p>No products found in this category.</p>
            )}
          </div>
        </div>

        {/* Order Section */}
        <div className="add-order-container">
          <h1 className="header">Add Order</h1>
          {error && <p className="error-message">{error}</p>}

          {/* Customer Search */}
          <div className="form-group">
            <label>Search Customer</label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by name or phone number"
              className="input-field"
            />
            {filteredCustomers.length > 0 && (
              <ul className="customer-list">
                {filteredCustomers.map((customer) => (
                  <li
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer.id);
                      setSearchQuery(customer.name || customer.email);
                      setFilteredCustomers([]);
                    }}
                    className="customer-item"
                  >
                    {customer.name || customer.email} -{" "}
                    {customer.phoneNumber || "No phone"}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Selected Customer */}
          {selectedCustomer && (
            <div className="selected-customer">
              <p>
                <strong>Selected Customer:</strong> {searchQuery}
              </p>
            </div>
          )}

          {/* Order Items */}
          <div className="order-items-section">
            <h2 className="order-items-header">Order Items</h2>
            {orderItems.length === 0 ? (
              <p className="empty-order-message">
                No items added yet. Click on a product to add it to the order.
              </p>
            ) : (
              <div className="order-items-grid">
                {orderItems.map((item, index) => (
                  <div key={index} className="order-item-card">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="order-item-image"
                    />
                    <div className="order-item-details">
                      <h3 className="order-item-name">{item.name}</h3>
                      <p className="order-item-price">
                        Price: ${item.price.toFixed(2)}
                      </p>
                      <div className="order-item-actions">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              index,
                              parseInt(e.target.value, 10)
                            )
                          }
                          className="order-item-quantity"
                        />
                        <p className="order-item-total">
                          Total: ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveProductFromOrder(index)}
                        className="remove-item-button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing and Discount Section */}
          <div className="pricing-section">
            <h2 className="subtotal">
              Subtotal: $
              {orderItems
                .reduce((sum, item) => sum + item.price * item.quantity, 0)
                .toFixed(2)}
            </h2>
            {discount.value > 0 && (
              <h3 className="discount">
                Discount (
                {discount.type === "percentage"
                  ? `${discount.value}%`
                  : `$${discount.value.toFixed(2)}`}
                ): -$
                {discount.type === "percentage"
                  ? (
                      orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0) *
                      (discount.value / 100)
                    ).toFixed(2)
                  : discount.value.toFixed(2)}
              </h3>
            )}
            <h2 className="total">Total: ${totalPrice.toFixed(2)}</h2>
            <button
              className="add-discount-button"
              onClick={() => setIsDiscountModalOpen(true)}
            >
              <span className="discount-icon">+</span> Add Discount
            </button>
          </div>

          {/* Order Submission */}
          <button onClick={handleSubmit} className="submit-button">
            Submit Order
          </button>

          {/* Discount Modal */}
          {isDiscountModalOpen && (
            <DiscountModal
              onApply={handleApplyDiscount}
              onClose={() => setIsDiscountModalOpen(false)}
            />
          )}
        </div>
      </div>
    </ManagerLayout>
  );
};

export default AddOrder;
