// inventory.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../inventory/inventory.css";
import Modal from "../modal/modal";

const Inventory = () => {
  const [variants, setVariants] = useState([]); // now variant-level items
  const [suppliers, setSuppliers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    variant_id: "", // changed from product_id
    type: "",
    direction: "",
    supplier_id: "",
    quantity: "",
    notes: "",
  });

  const token = localStorage.getItem("access_token");
  const navigate = useNavigate();

  // Fetch all variants with product info
  const fetchInventory = async () => {
    try {
      // CHANGE THIS URL from /variants to /inventory
      const res = await fetch("http://localhost:8000/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch inventory");
      const data = await res.json();
      setVariants(data);
    } catch (err) {
      console.error("Fetch variants error:", err);
    }
  };

  // Fetch suppliers (unchanged)
  const fetchSuppliers = async () => {
    try {
      const res = await fetch("http://localhost:8000/suppliers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchSuppliers();
  }, []);

  const handleTypeChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      type: value,
      direction: value === "RETURN" ? prev.direction : "",
      supplier_id: value === "IN" ? prev.supplier_id : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.variant_id || !form.quantity || !form.type) {
      alert("Variant, type, and quantity are required");
      return;
    }

    const payload = {
      variant_id: parseInt(form.variant_id), // ← now sending variant_id
      type: form.type.toUpperCase(),
      quantity: parseInt(form.quantity, 10),
      notes: form.notes || null,
    };

    if (form.type === "IN" && form.supplier_id) {
      payload.supplier_id = parseInt(form.supplier_id, 10);
    }

    if (form.type === "RETURN") {
      if (!form.direction) {
        alert("Direction is required for RETURN");
        return;
      }
      payload.direction = form.direction.toUpperCase();
    }

    try {
      const res = await fetch("http://localhost:8000/inventory/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.detail || "Error saving transaction");
        return;
      }

      alert("Stock transaction saved!");
      setOpen(false);
      setForm({
        variant_id: "",
        type: "",
        direction: "",
        supplier_id: "",
        quantity: "",
        notes: "",
      });
      fetchInventory(); // refresh
    } catch (err) {
      console.error(err);
      alert("Failed to save transaction");
    }
  };

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <button
          className="view-history"
          onClick={() => navigate("/home/transactionhistory")}
        >
          View Transaction History
        </button>
      </div>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Variant</th>
            <th>SKU</th>
            <th>Size</th>
            <th>Color</th>
            <th>Quantity</th>
            <th>Min Stock*</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {variants.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", padding: "2rem" }}>
                No variants found
              </td>
            </tr>
          ) : (
            variants.map((v) => (
              <tr
                key={v.id}
                className={v.quantity <= (v.min_stock || 0) ? "low-stock" : ""}
              >
                <td>{v.product_name}</td>
                <td>
                  {v.size || "—"} / {v.color || "—"}
                </td>
                <td>{v.sku}</td>
                <td>{v.size || "—"}</td>
                <td>{v.color || "—"}</td>
                <td
                  className={
                    v.quantity <= (v.min_stock || 0) ? "low-stock" : ""
                  }
                >
                  {v.quantity}
                </td>
                <td>{v.min_stock ?? "—"}</td>
                <td>
                  <button
                    className="btn-manage"
                    onClick={() => {
                      setForm({
                        variant_id: v.id,
                        type: "",
                        direction: "",
                        supplier_id: "",
                        quantity: "",
                        notes: "",
                      });
                      setOpen(true);
                    }}
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal - now works with variant_id */}
      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <h3>Stock Transaction</h3>
        <form onSubmit={handleSubmit}>
          <select value={form.type} onChange={handleTypeChange} required>
            <option value="">Select Type</option>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
            <option value="RETURN">Return</option>
          </select>

          {form.type === "IN" && (
            <select
              value={form.supplier_id}
              onChange={(e) =>
                setForm({ ...form, supplier_id: e.target.value })
              }
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {form.type === "RETURN" && (
            <select
              value={form.direction}
              onChange={(e) => setForm({ ...form, direction: e.target.value })}
              required
            >
              <option value="">Select Direction</option>
              <option value="IN">Return from Department</option>
              <option value="OUT">Return to Supplier</option>
            </select>
          )}

          <input
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            required
            min="1"
          />

          <textarea
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <button type="submit">Submit</button>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
