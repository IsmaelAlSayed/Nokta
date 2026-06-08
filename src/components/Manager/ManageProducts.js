import React, { useEffect, useState } from "react";
import { db, storage } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import EditProductModal from "./EditProductModal";
import MangerLayout from "./ManagerLayout";
import ConfirmDeleteModal from "./ConfirmDeleteModal"; // Import confirmation modal
import "../../styles/ManageProducts.css";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    subcategory: "",
    image: null,
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  
  // State to manage deletion confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productSnapshot = await getDocs(collection(db, "products"));
        const productList = productSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch categories
        const categorySnapshot = await getDocs(collection(db, "categories"));
        const categoryList = categorySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch subcategories
        const subcategorySnapshot = await getDocs(collection(db, "subcategories"));
        const subcategoryList = subcategorySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(productList);
        setFilteredProducts(productList); // Initially display all products
        setCategories(categoryList);
        setAllSubcategories(subcategoryList);
      } catch (error) {
        setError("Failed to fetch data.");
      }
    };
    fetchData();
  }, []);

  // Update filteredProducts whenever products or searchQuery changes
  useEffect(() => {
    setFilteredProducts(
      products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [products, searchQuery]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle category selection
  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setProductForm({
      ...productForm,
      category: categoryId,
      subcategory: ""
    });
    const filteredSubs = allSubcategories.filter(
      (sub) => sub.category === categoryId
    );
    setSubcategories(filteredSubs);
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductForm((prev) => ({ ...prev, image: file }));
    }
  };

  // Upload image to Firebase Storage
  const uploadImage = async (image) => {
    const timestamp = Date.now();
    const originalName = image.name;
    const uniqueName = `${originalName}_${timestamp}`;
    const imagePath = `products/${uniqueName}`;
    const imageRef = ref(storage, imagePath);
    await uploadBytes(imageRef, image);
    // Wait for the resize extension to process the image (adjust delay as needed)
    await new Promise((resolve) => setTimeout(resolve, 5000));
    // Construct the expected resized image filename (adjust naming as needed)
    const resizedFileName = `${uniqueName}_200x200`;
    const resizedImagePath = `products/${resizedFileName}`;
    return await getDownloadURL(ref(storage, resizedImagePath));
  };

  // Add new product
  const handleAddProduct = async () => {
    const { name, price, description, category, subcategory, image } = productForm;
    if (!name || !price || !category || !image) {
      setError("Name, Price, Category, and Image are required");
      return;
    }
    setUploading(true);
    try {
      const imageUrl = await uploadImage(image);
      const docRef = await addDoc(collection(db, "products"), {
        name,
        price: parseFloat(price),
        description,
        category,
        subcategory: subcategory || null,
        imageUrl,
      });
      const newProduct = {
        id: docRef.id,
        name,
        price: parseFloat(price),
        description,
        category,
        subcategory,
        imageUrl,
      };
      setProducts((prevProducts) => [...prevProducts, newProduct]);
      setProductForm({
        name: "",
        price: "",
        description: "",
        category: "",
        subcategory: "",
        image: null,
      });
      setError("");
    } catch (err) {
      setError("Failed to add product: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Edit product
  const handleEditProduct = (product) => {
    setEditingProduct(product);
  };

  // Save edited product
  const handleSaveEdit = async (updatedProduct) => {
    if (!editingProduct) return;
    setUploading(true);
    try {
      let imageUrl = updatedProduct.imageUrl;
      if (updatedProduct.image) {
        imageUrl = await uploadImage(updatedProduct.image);
      }
      await updateDoc(doc(db, "products", editingProduct.id), {
        name: updatedProduct.name,
        price: parseFloat(updatedProduct.price),
        description: updatedProduct.description,
        category: updatedProduct.category,
        subcategory: updatedProduct.subcategory || null,
        imageUrl: imageUrl,
      });
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === editingProduct.id ? { ...product, ...updatedProduct, imageUrl } : product
        )
      );
      setEditingProduct(null);
      setError("");
    } catch (err) {
      setError("Failed to update product: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Open the delete confirmation modal
  const confirmDeleteProduct = (id) => {
    setProductToDelete(id);
    setShowDeleteModal(true);
  };

  // Delete product
  const handleDeleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, "products", id));
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== id)
      );
    } catch (err) {
      setError("Failed to delete product: " + err.message);
    }
  };

  // Handle search (filtered via useEffect)
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Confirm deletion callback
  const onConfirmDelete = () => {
    handleDeleteProduct(productToDelete);
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  // Cancel deletion callback
  const onCancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  return (
    <MangerLayout>
      <div className="manage-products-container">
        <h1 className="header">Manage Products</h1>
        {error && <p className="error-message">{error}</p>}

        {/* Product Form */}
        <div className="product-form">
          <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
          <input
            type="text"
            name="name"
            value={productForm.name}
            onChange={handleChange}
            placeholder="Product Name"
            className="input-field"
          />
          <input
            type="number"
            name="price"
            value={productForm.price}
            onChange={handleChange}
            placeholder="Price"
            className="input-field"
          />
          <textarea
            name="description"
            value={productForm.description}
            onChange={handleChange}
            placeholder="Description"
            className="input-field"
          />
          {/* Category Dropdown */}
          <select
            name="category"
            value={productForm.category}
            onChange={handleCategoryChange}
            className="input-field"
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {/* Subcategory Dropdown */}
          <select
            name="subcategory"
            value={productForm.subcategory}
            onChange={handleChange}
            className="input-field"
            disabled={!productForm.category}
          >
            <option value="">Select Subcategory (Optional)</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
          <input
            type="file"
            onChange={handleImageChange}
            accept="image/*"
            className="input-field"
          />
          <button
            onClick={handleAddProduct}
            className="submit-button"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Add Product"}
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search products..."
            className="search-input"
          />
        </div>

        {/* Product List */}
        <div className="product-list">
          <h2>Product List</h2>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const category = categories.find((c) => c.id === product.category);
              const subcategory = allSubcategories.find((s) => s.id === product.subcategory);
              return (
                <div key={product.id} className="product-item">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="product-image"
                  />
                  <div className="product-details">
                    <p>
                      <strong>Name:</strong> {product.name}
                    </p>
                    <p>
                      <strong>Category:</strong> {category?.name || "Unknown Category"}
                    </p>
                    <p>
                      <strong>Subcategory:</strong> {subcategory?.name || "None"}
                    </p>
                    <p>
                      <strong>Price:</strong> ${product.price.toFixed(2)}
                    </p>
                    <p>
                      <strong>Description:</strong> {product.description}
                    </p>
                  </div>
                  <div className="product-actions">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDeleteProduct(product.id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No products found.</p>
          )}
        </div>

        {/* Edit Product Modal */}
        {editingProduct && (
          <EditProductModal
            product={editingProduct}
            categories={categories}
            allSubcategories={allSubcategories}
            onClose={() => setEditingProduct(null)}
            onSave={handleSaveEdit}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <ConfirmDeleteModal
            message="Are you sure you want to delete this product?"
            onConfirm={onConfirmDelete}
            onCancel={onCancelDelete}
          />
        )}
      </div>
    </MangerLayout>
  );
};

export default ManageProducts;
