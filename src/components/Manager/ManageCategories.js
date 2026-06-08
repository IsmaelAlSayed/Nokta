import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import ManagerLayout from "./ManagerLayout";
import "../../styles/ManageCategories.css";

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [newSubcategory, setNewSubcategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch categories and subcategories from Firestore
  useEffect(() => {
    const fetchData = async () => {
      const categorySnapshot = await getDocs(collection(db, "categories"));
      const categoryList = categorySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const subcategorySnapshot = await getDocs(collection(db, "subcategories"));
      const subcategoryList = subcategorySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCategories(categoryList);
      setSubcategories(subcategoryList);
    };

    fetchData();
  }, []);

  // Add a new category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    const docRef = await addDoc(collection(db, "categories"), { name: newCategory });
    setCategories([...categories, { id: docRef.id, name: newCategory }]);
    setNewCategory("");
  };

  // Edit a category
  const handleEditCategory = async () => {
    if (!editingCategory.name.trim()) return;

    await updateDoc(doc(db, "categories", editingCategory.id), {
      name: editingCategory.name,
    });

    setCategories(
      categories.map((cat) =>
        cat.id === editingCategory.id ? { ...cat, name: editingCategory.name } : cat
      )
    );
    setEditingCategory(null);
  };

  // Delete a category
  const handleDeleteCategory = async (id) => {
    await deleteDoc(doc(db, "categories", id));
    setCategories(categories.filter((cat) => cat.id !== id));
    setSubcategories(subcategories.filter((sub) => sub.category !== id));
  };

  // Add a new subcategory
  const handleAddSubcategory = async () => {
    if (!newSubcategory.trim() || !selectedCategory) return;

    const docRef = await addDoc(collection(db, "subcategories"), {
      name: newSubcategory,
      category: selectedCategory,
    });

    setSubcategories([
      ...subcategories,
      { id: docRef.id, name: newSubcategory, category: selectedCategory },
    ]);
    setNewSubcategory("");
  };

  // Delete a subcategory
  const handleDeleteSubcategory = async (id) => {
    await deleteDoc(doc(db, "subcategories", id));
    setSubcategories(subcategories.filter((sub) => sub.id !== id));
  };

  // Filter categories based on search query
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ManagerLayout>
      <div className="manage-categories-container">
        <h1 className="header">Manage Categories & Subcategories</h1>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="input-field"
          />
        </div>

        {/* Category Form */}
        <div className="category-form">
          <h2>Add New Category</h2>
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Enter category name"
            className="input-field"
          />
          <button onClick={handleAddCategory} className="add-button">
            Add Category
          </button>
        </div>

        {/* Category List */}
        <div className="category-list">
          <h2>Categories</h2>
          {filteredCategories.map((category) => (
            <div key={category.id} className="category-item">
              <span>{category.name}</span>
              <div>
                <button
                  className="edit-button"
                  onClick={() => setEditingCategory(category)}
                >
                  Edit
                </button>
                <button
                  className="delete-button"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Subcategory Form */}
        <div className="subcategory-form">
          <h2>Add New Subcategory</h2>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newSubcategory}
            onChange={(e) => setNewSubcategory(e.target.value)}
            placeholder="Enter subcategory name"
            className="input-field"
          />
          <button onClick={handleAddSubcategory} className="add-button">
            Add Subcategory
          </button>
        </div>

        {/* Subcategory List */}
        <div className="subcategory-list">
          <h2>Subcategories</h2>
          {subcategories.map((sub) => (
            <div key={sub.id} className="subcategory-item">
              <span>
                {sub.name} -{" "}
                {categories.find((cat) => cat.id === sub.category)?.name || "Unknown Category"}
              </span>
              <button
                className="delete-button"
                onClick={() => handleDeleteSubcategory(sub.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {/* Edit Category Modal */}
        {editingCategory && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Edit Category</h2>
              <input
                type="text"
                value={editingCategory.name}
                onChange={(e) =>
                  setEditingCategory({ ...editingCategory, name: e.target.value })
                }
                className="input-field"
              />
              <button onClick={handleEditCategory} className="save-button">
                Save
              </button>
              <button onClick={() => setEditingCategory(null)} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
};

export default ManageCategories;
