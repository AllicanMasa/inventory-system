import React, { useState, useEffect } from "react";
import "../product/product.css";
import Modal from "../modal/modal";
import ConfirmModal from "../modal/confirmmodal";

const Product = () => {
  // ── Core / Editing states ───────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    min_stock: "",
    sku: "",
    category_id: "",
  });

  // ── Data states ─────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // ── Delete confirmation ─────────────────────────────────────────
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  // ── Search & Filter states ──────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    sku: "",
    name: "",
    priceMin: "",
    priceMax: "",
    minStockMin: "",
    minStockMax: "",
    category: "",
  });

  // ── Data fetching ───────────────────────────────────────────────
  useEffect(() => {
    fetch("http://127.0.0.1:8000/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch((err) => console.error("Failed to fetch categories", err));
  }, []);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/products")
      .then((res) => res.json())
      .then(setProducts)
      .catch((err) => console.error("Failed to fetch products", err));
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────
  const categoryMap = Object.fromEntries(
    categories.map((cat) => [cat.id, cat.name]),
  );

  const isFormValid =
    form.name.trim() !== "" &&
    form.price !== "" &&
    form.min_stock !== "" &&
    form.sku !== "" &&
    form.category_id !== "";

  // ── Form handlers ───────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "price") {
      if (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 10) {
        setForm({ ...form, price: value });
      }
      return;
    }

    if (name === "min_stock") {
      if (/^[0-9]*$/.test(value) && value.length <= 6) {
        setForm({ ...form, min_stock: value });
      }
      return;
    }

    if (name === "sku") {
      if (/^[0-9]*$/.test(value) && value.length <= 20) {
        setForm({ ...form, sku: value });
      }
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const resetForm = () => {
    setForm({
      name: "",
      price: "",
      min_stock: "",
      sku: "",
      category_id: "",
    });
    setEditingProduct(null);
  };

  // ── CRUD operations ─────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("You are not logged in");
        return;
      }

      const method = editingProduct ? "PUT" : "POST";
      const url = editingProduct
        ? `http://127.0.0.1:8000/products/${editingProduct.id}`
        : "http://127.0.0.1:8000/products/";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save product");

      const data = await res.json();

      if (editingProduct) {
        setProducts(products.map((p) => (p.id === data.id ? data : p)));
        alert("Product updated!");
      } else {
        setProducts((prev) => [...prev, data]);
        alert("Product added!");
      }

      resetForm();
      setOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: product.price.toString(),
      min_stock: product.min_stock.toString(),
      sku: product.sku.toString(),
      category_id: product.category_id.toString(),
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch(
        `http://127.0.0.1:8000/products/${selectedProductId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) throw new Error("Failed to delete");

      setProducts(products.filter((p) => p.id !== selectedProductId));
      setIsDeleteOpen(false);
      setSelectedProductId(null);
    } catch (err) {
      console.error(err);
      alert(err.message || "Delete failed");
    }
  };

  // ── Filtering logic ─────────────────────────────────────────────
  const filteredProducts = products
    .filter((p) => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;

      return (
        p.sku.toString().toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        (categoryMap[p.category_id] || "").toLowerCase().includes(term)
      );
    })
    .filter((p) => {
      if (filters.sku && !p.sku.toString().includes(filters.sku)) return false;
      if (
        filters.name &&
        !p.name.toLowerCase().includes(filters.name.toLowerCase())
      )
        return false;

      if (filters.priceMin && Number(p.price) < Number(filters.priceMin))
        return false;
      if (filters.priceMax && Number(p.price) > Number(filters.priceMax))
        return false;

      if (
        filters.minStockMin &&
        Number(p.min_stock) < Number(filters.minStockMin)
      )
        return false;
      if (
        filters.minStockMax &&
        Number(p.min_stock) > Number(filters.minStockMax)
      )
        return false;

      if (filters.category && p.category_id !== Number(filters.category))
        return false;

      return true;
    });

  // ── UI handlers ─────────────────────────────────────────────────
  const openAddModal = () => {
    resetForm();
    setOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      sku: "",
      name: "",
      priceMin: "",
      priceMax: "",
      minStockMin: "",
      minStockMax: "",
      category: "",
    });
  };

  // ────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────
  return (
    <div className="product">

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <h2>{editingProduct ? "Edit Product" : "New Item Information"}</h2>

        <input
          placeholder="Product Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          maxLength={100}
        />

        <input
          placeholder="Product Price"
          name="price"
          value={form.price}
          onChange={handleChange}
          maxLength={10}
        />

        <input
          placeholder="Minimum Stock"
          name="min_stock"
          value={form.min_stock}
          onChange={handleChange}
          maxLength={6}
        />

        <input
          placeholder="SKU"
          name="sku"
          value={form.sku}
          onChange={handleChange}
          maxLength={20}
        />

        <select
          name="category_id"
          value={form.category_id}
          onChange={handleChange}
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <button onClick={handleSubmit} disabled={!isFormValid}>
          Save
        </button>
      </Modal>

      <div style={{ margin: "1.5rem 0" }}>
        {/* Global Search */}
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="search"
            placeholder="Search by SKU, name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "0.6rem",
              width: "320px",
              maxWidth: "100%",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>

        <h3>Products ({filteredProducts.length})</h3>

        <button className="open-btn" onClick={openAddModal}>
        Add New Item
      </button>

        <table
          border="1"
          cellPadding="10"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Price</th>
              <th>Min Stock</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>

            {/* Filter Row */}
            <tr style={{ background: "#fafafa" }}>
              <th>
                <input
                  value={filters.sku}
                  onChange={(e) =>
                    setFilters({ ...filters, sku: e.target.value })
                  }
                  placeholder="Filter SKU"
                  style={{ width: "90%" }}
                />
              </th>
              <th>
                <input
                  value={filters.name}
                  onChange={(e) =>
                    setFilters({ ...filters, name: e.target.value })
                  }
                  placeholder="Filter name"
                  style={{ width: "90%" }}
                />
              </th>
              <th>
                <input
                  placeholder="min"
                  size={6}
                  value={filters.priceMin}
                  onChange={(e) =>
                    setFilters({ ...filters, priceMin: e.target.value })
                  }
                />
                {" – "}
                <input
                  placeholder="max"
                  size={6}
                  value={filters.priceMax}
                  onChange={(e) =>
                    setFilters({ ...filters, priceMax: e.target.value })
                  }
                />
              </th>
              <th>
                <input
                  placeholder="min"
                  size={6}
                  value={filters.minStockMin}
                  onChange={(e) =>
                    setFilters({ ...filters, minStockMin: e.target.value })
                  }
                />
                {" – "}
                <input
                  placeholder="max"
                  size={6}
                  value={filters.minStockMax}
                  onChange={(e) =>
                    setFilters({ ...filters, minStockMax: e.target.value })
                  }
                />
              </th>
              <th>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                  style={{ width: "100%" }}
                >
                  <option value="">All</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </th>
              <th style={{ textAlign: "center" }}>
                <button
                  onClick={clearFilters}
                  style={{
                    padding: "0.4rem 0.8rem",
                    fontSize: "0.9rem",
                    background: "#ffebee",
                    border: "1px solid #ef9a9a",
                    borderRadius: "4px",
                    color: "#c62828",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  No products match your search / filters
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.price}</td>
                  <td>{product.min_stock}</td>
                  <td>{categoryMap[product.category_id] || "—"}</td>
                  <td>
                    <button onClick={() => handleEdit(product)}>Edit</button>
                    <button
                      onClick={() => {
                        setSelectedProductId(product.id);
                        setIsDeleteOpen(true);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this product?"
      />
    </div>
  );
};

export default Product;
