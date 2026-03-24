import React, { useState, useEffect, useMemo } from "react";
import "../product/product.css";
import Modal from "../modal/modal";
import ConfirmModal from "../modal/confirmmodal";

const Product = () => {
  // ---------------- STATE ----------------
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // NEW: State to track sorting order
  const [sortOrder, setSortOrder] = useState("newest");

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddVariantModalOpen, setIsAddVariantModalOpen] = useState(false);
  const [isDeleteVariantOpen, setIsDeleteVariantOpen] = useState(false);

  // Editing/Targeting states
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingVariant, setEditingVariant] = useState(null);
  const [targetProductForVariant, setTargetProductForVariant] = useState(null);

  // DELETE LOGIC STATES
  const [variantToDelete, setVariantToDelete] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteProductToo, setDeleteProductToo] = useState(false);

  const initialProductForm = {
    name: "",
    price: "",
    min_stock: "",
    sku: "",
    category_id: "",
  };

  const initialVariantForm = {
    v_size: "",
    v_color: "",
  };

  const [productForm, setProductForm] = useState(initialProductForm);
  const [variantForm, setVariantForm] = useState(initialVariantForm);

  // ---------------- FETCH DATA ----------------
  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/categories"),
        fetch("http://127.0.0.1:8000/products"),
      ]);
      setCategories(await catRes.json());
      setProducts(await prodRes.json());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categoryMap = useMemo(() => {
    return Object.fromEntries(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  // ---------------- HANDLERS ----------------
  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (e) => {
    const { name, value } = e.target;
    setVariantForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForms = () => {
    setProductForm(initialProductForm);
    setVariantForm(initialVariantForm);
    setEditingProduct(null);
    setEditingVariant(null);
    setDeleteProductToo(false);
  };

  // CREATE PRODUCT
  const handleAddProduct = async () => {
    const token = localStorage.getItem("access_token");
    const payload = {
      ...productForm,
      price: parseFloat(productForm.price),
      min_stock: parseInt(productForm.min_stock),
      category_id: parseInt(productForm.category_id),
      variants: [
        {
          size: variantForm.v_size || "N/A",
          color: variantForm.v_color || "N/A",
          sku: productForm.sku,
          quantity: 0,
        },
      ],
    };

    const res = await fetch("http://127.0.0.1:8000/products/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await fetchData();
      setIsAddProductModalOpen(false);
      resetForms();
    }
  };

  // MERGED UPDATE
  const handleSaveEdit = async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");

    try {
      const productUpdate = fetch(
        `http://127.0.0.1:8000/products/${editingProduct.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: productForm.name,
            price: parseFloat(productForm.price),
            min_stock: parseInt(productForm.min_stock),
            sku: productForm.sku,
            category_id: parseInt(productForm.category_id),
          }),
        },
      );

      const variantUpdate = fetch(
        `http://127.0.0.1:8000/variants/${editingVariant.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            size: variantForm.v_size,
            color: variantForm.v_color,
          }),
        },
      );

      const [pRes, vRes] = await Promise.all([productUpdate, variantUpdate]);

      if (pRes.ok && vRes.ok) {
        await fetchData();
        setIsEditModalOpen(false);
        resetForms();
      }
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewVariant = async () => {
    const token = localStorage.getItem("access_token");
    const generatedSKU = `${targetProductForVariant.sku}-${variantForm.v_color}-${variantForm.v_size}`;

    const res = await fetch(
      `http://127.0.0.1:8000/products/${targetProductForVariant.id}/variants`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          size: variantForm.v_size || "N/A",
          color: variantForm.v_color || "N/A",
          sku: generatedSKU,
          quantity: 0,
        }),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || "Failed to add variant");
      return;
    }

    await fetchData();
    setIsAddVariantModalOpen(false);
    resetForms();
  };

  // DELETE LOGIC
  const handleConfirmDeleteVariant = async () => {
    const token = localStorage.getItem("access_token");

    const url = deleteProductToo
      ? `http://127.0.0.1:8000/products/${productToDelete}`
      : `http://127.0.0.1:8000/variants/${variantToDelete}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      await fetchData();
      setIsDeleteVariantOpen(false);
      setVariantToDelete(null);
      setProductToDelete(null);
      setDeleteProductToo(false);
    } else {
      const err = await res.json();
      alert(err.detail || "Deletion failed");
    }
  };

  // ---------------- TABLE VIEW (UPDATED WITH SORT) ----------------
  // product.jsx inside the Product component
  const tableRows = [...products]
    // 1. Filter out inactive products first
    .filter((product) => product.is_active !== false)
    .sort((a, b) => {
      if (sortOrder === "newest") return b.id - a.id;
      return a.id - b.id;
    })
    .flatMap((product) => {
      // 2. Filter out inactive variants within the product
      const activeVariants = (product.variants || []).filter(
        (v) => v.is_active !== false,
      );

      return (
        activeVariants.length > 0
          ? activeVariants
          : [{ id: null, size: "N/A", color: "N/A" }]
      ).map((variant) => ({
        ...product,
        currentVariant: variant,
        isNoVariant: variant.id === null,
      }));
    })
    .filter(
      (row) =>
        row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.sku.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  return (
    <div className="product-page">
      <div className="product-header">
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            className="search-input"
            placeholder="Search SKU or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* NEW: Sorting Dropdown */}
          <select
            className="sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="newest">Newest to Oldest</option>
            <option value="oldest">Oldest to Newest</option>
          </select>
        </div>
        <div>
          <button
            className="btn-primary"
            onClick={() => {
              resetForms();
              setIsAddProductModalOpen(true);
            }}
          >
            + Add Product
          </button>
        </div>
      </div>

      <div className="product-con">
        <table className="product-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Variant (C/S)</th>
              <th>Min Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, i) => (
              <tr key={`${row.id}-${row.currentVariant.id || i}`}>
                <td>{row.sku}</td>
                <td>{row.name}</td>
                <td>{categoryMap[row.category_id] || "Uncategorized"}</td>
                <td>
                  {row.currentVariant.color} / {row.currentVariant.size}
                </td>
                <td>{row.min_stock}</td>
                <td className="actions-cell">
                  {/* Edit button: Only show if there IS a variant to edit */}
                  {!row.isNoVariant && (
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setEditingProduct(row);
                        setEditingVariant(row.currentVariant);
                        setProductForm({
                          ...row,
                          category_id: String(row.category_id),
                        });
                        setVariantForm({
                          v_size: row.currentVariant.size,
                          v_color: row.currentVariant.color,
                        });
                        setIsEditModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                  )}

                  <button
                    className="btn-add-sub"
                    onClick={() => {
                      setTargetProductForVariant(row);
                      setVariantForm(initialVariantForm);
                      setIsAddVariantModalOpen(true);
                    }}
                  >
                    + Variant
                  </button>

                  {/* Delete Logic Toggle */}
                  {row.isNoVariant ? (
                    /* SHOW THIS IF PRODUCT IS EMPTY */
                    <button
                      className="btn-delete-text"
                      style={{ width: "40%" }}
                      onClick={() => {
                        setProductToDelete(row.id);
                        setDeleteProductToo(true); // Tells the handler to use the Product DELETE URL
                        setIsDeleteVariantOpen(true);
                      }}
                    >
                      Delete Product
                    </button>
                  ) : (
                    /* SHOW THIS IF DELETING A SPECIFIC VARIANT */
                    <button
                      className="btn-delete-text"
                      onClick={() => {
                        setVariantToDelete(row.currentVariant.id);
                        setProductToDelete(row.id);
                        setDeleteProductToo(false); // Tells the handler to use the Variant DELETE URL
                        setIsDeleteVariantOpen(true);
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <h2>Edit Product & Variant</h2>
        <div className="modal-form-content">
          <label>Product Name</label>
          <input
            name="name"
            value={productForm.name}
            onChange={handleProductChange}
          />
          <label>Price</label>
          <input
            name="price"
            value={productForm.price}
            onChange={handleProductChange}
          />
          <label>Minimum Stock Level</label>
          <input
            name="min_stock"
            value={productForm.min_stock}
            onChange={handleProductChange}
          />
          <label>Category</label>
          <select
            className="size"
            name="category_id"
            value={productForm.category_id}
            onChange={handleProductChange}
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="divider" />

          <h3>Variant Specifics</h3>
          <label>Color</label>
          <input
            name="v_color"
            value={variantForm.v_color}
            onChange={handleVariantChange}
          />
          <label>Size</label>
          <select
            className="size"
            name="v_size"
            value={variantForm.v_size}
            onChange={handleVariantChange}
          >
            <option value="">Select Size</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>
        </div>
        <button
          className="btn-save"
          onClick={handleSaveEdit}
          disabled={loading}
        >
          {loading ? "Saving..." : "Update All"}
        </button>
      </Modal>

      {/* ADD PRODUCT MODAL */}
      <Modal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
      >
        <h2>New Product</h2>
        <div className="form-row">
          <input
            name="name"
            value={productForm.name}
            onChange={handleProductChange}
            placeholder="Product Name"
          />
          <input
            name="sku"
            value={productForm.sku}
            onChange={handleProductChange}
            placeholder="Base SKU"
          />
          <input
            name="price"
            value={productForm.price}
            onChange={handleProductChange}
            placeholder="Price"
          />
          <input
            name="min_stock"
            value={productForm.min_stock}
            onChange={handleProductChange}
            placeholder="Min Stock"
          />

          <select
            name="category_id"
            value={productForm.category_id}
            onChange={handleProductChange}
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <p>Initial Variant</p>
        <div className="form-row">
          <input
            name="v_color"
            value={variantForm.v_color}
            onChange={handleVariantChange}
            placeholder="Color"
          />
          <select
            name="v_size"
            value={variantForm.v_size}
            onChange={handleVariantChange}
          >
            <option value="">Select Size</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>
        </div>
        <button className="btn-save" onClick={handleAddProduct}>
          Create
        </button>
      </Modal>

      {/* ADD VARIANT MODAL */}
      <Modal
        isOpen={isAddVariantModalOpen}
        onClose={() => setIsAddVariantModalOpen(false)}
      >
        <h3>Add Variant to {targetProductForVariant?.name}</h3>
        <div className="form-row">
          <input
            name="v_color"
            value={variantForm.v_color}
            onChange={handleVariantChange}
            placeholder="Color"
          />
          <select
            name="v_size"
            value={variantForm.v_size}
            onChange={handleVariantChange}
          >
            <option value="">Select Size</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>
        </div>
        <button className="btn-save" onClick={handleAddNewVariant}>
          Add Variant
        </button>
      </Modal>

      {/* RE-INTEGRATED CONFIRM MODAL WITH CHECKBOX */}
      <ConfirmModal
        isOpen={isDeleteVariantOpen}
        onClose={() => setIsDeleteVariantOpen(false)}
        onConfirm={handleConfirmDeleteVariant}
        message="Are you sure you want to delete this variant?"
      >
        <div
          style={{
            marginTop: "15px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#d9534f",
          }}
        >
          {/* <input
            type="checkbox"
            id="deleteProd"
            checked={deleteProductToo}
            onChange={(e) => setDeleteProductToo(e.target.checked)}
          />
          <label
            htmlFor="deleteProd"
            style={{ fontWeight: "bold", fontSize: "14px", cursor: "pointer" }}
          >
            Delete entire product and all its variants?
          </label> */}
        </div>
      </ConfirmModal>
    </div>
  );
};

export default Product;
