import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import "../../styles/EditProductModal.css";

const EditProductModal = ({ product, onSave, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [editForm, setEditForm] = useState({
    name: product.name,
    price: product.price,
    description: product.description,
    category: product.category || "",
    subcategory: product.subcategory || "",
    image: null, // New image file
    imageUrl: product.imageUrl, // Existing image URL
  });

  // Fetch categories with IDs
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categorySnapshot = await getDocs(collection(db, "categories"));
        const categoryList = categorySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setCategories(categoryList);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!editForm.category) return;

      try {
        const subcategorySnapshot = await getDocs(collection(db, "subcategories"));
        const filteredSubs = subcategorySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(sub => sub.category === editForm.category);

        setSubcategories(filteredSubs);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
      }
    };

    fetchSubcategories();
  }, [editForm.category]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle category change and reset subcategory
  const handleCategoryChange = async (e) => {
    const selectedCategory = e.target.value;
    setEditForm((prev) => ({ ...prev, category: selectedCategory, subcategory: "" })); // Reset subcategory
  
    try {
      console.log("Fetching subcategories for category:", selectedCategory); // Debugging Log
  
      const subcategorySnapshot = await getDocs(collection(db, "subcategories"));
      const filteredSubcategories = subcategorySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() })) // Ensure structured data
        .filter((sub) => sub.category.toLowerCase() === selectedCategory.toLowerCase()) // Match category
        .map((sub) => sub.name); // Extract only names
  
      console.log("Filtered Subcategories:", filteredSubcategories); // Debugging Log
  
      setSubcategories(filteredSubcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };  

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm((prev) => ({ ...prev, image: file }));
    }
  };

  // Remove current image
  const handleRemoveImage = () => {
    setEditForm((prev) => ({ ...prev, imageUrl: null, image: null }));
  };

  // Save changes
  const handleSave = () => {
    onSave(editForm);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Product</h2>
        <input
          type="text"
          name="name"
          value={editForm.name}
          onChange={handleChange}
          placeholder="Product Name"
          className="input-field"
        />
        <input
          type="number"
          name="price"
          value={editForm.price}
          onChange={handleChange}
          placeholder="Product Price"
          className="input-field"
        />
        <textarea
          name="description"
          value={editForm.description}
          onChange={handleChange}
          placeholder="Product Description"
          className="input-field"
        />

        {/* Category Dropdown */}
{/* Category Dropdown */}
<select
          name="category"
          value={editForm.category}
          onChange={handleCategoryChange}
          className="input-field"
        >
          <option value="">Select Category (Required)</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {/* Updated Subcategory Dropdown */}
        <select
          name="subcategory"
          value={editForm.subcategory}
          onChange={handleChange}
          className="input-field"
          disabled={!editForm.category}
        >
          <option value="">Select Subcategory (Optional)</option>
          {subcategories.map(sub => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>

        {/* Display Current Image */}
        {editForm.imageUrl ? (
          <div className="current-image">
            <img src={editForm.imageUrl} alt="Product" className="product-image-preview" />
            <button onClick={handleRemoveImage} className="remove-image-button">
              Remove Image
            </button>
          </div>
        ) : (
          <p className="no-image-text">No image available</p>
        )}

        {/* Upload New Image */}
        <input
          type="file"
          onChange={handleImageChange}
          accept="image/*"
          className="input-field"
        />

        <div className="modal-actions">
          <button onClick={handleSave} className="save-button">
            Save
          </button>
          <button onClick={onClose} className="cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;
