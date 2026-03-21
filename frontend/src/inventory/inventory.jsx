import React, { useEffect, useState } from "react";
import "../inventory/inventory.css";
import Modal from "../modal/modal";

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    product_id: "",
    type: "",
    direction: "",
    supplier_id: "",
    quantity: "",
    notes: "",
  });

  const token = localStorage.getItem("access_token");

  // Fetch inventory
  const fetchInventory = async () => {
    try {
      const res = await fetch("http://localhost:8000/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch suppliers
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

  // Type change
  const handleTypeChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      type: value,
      direction: value === "RETURN" ? prev.direction : "",
      supplier_id: value === "IN" ? prev.supplier_id : "",
    }));
  };

  // Submit stock transaction
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.product_id || !form.quantity || !form.type) {
      alert("Product, type, and quantity are required");
      return;
    }

    // Construct payload based on type
    const payload = {
      product_id: parseInt(form.product_id),
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
        product_id: "",
        type: "",
        direction: "",
        supplier_id: "",
        quantity: "",
        notes: "",
      });
      fetchInventory();
    } catch (err) {
      console.error(err);
      alert("Failed to save transaction");
    }
  };

  return (
    <div className="inventory-page">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Quantity</th>
            <th>Min Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.product_id}>
              <td>{item.name}</td>
              <td>{item.sku}</td>
              <td className={item.quantity <= item.min_stock ? "low-stock" : ""}>
                {item.quantity}
              </td>
              <td>{item.min_stock}</td>
              <td>
                <button
                  onClick={() => {
                    setForm({
                      product_id: item.product_id,
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
          ))}
        </tbody>
      </table>

      {/* Modal */}
      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <h3>Stock Transaction</h3>
        <form onSubmit={handleSubmit}>
          <select value={form.type} onChange={handleTypeChange} required>
            <option value="">Select Type</option>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
            <option value="RETURN">Return</option>
          </select>

          {/* Supplier only for IN */}
          {form.type === "IN" && (
            <select
              value={form.supplier_id}
              onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
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

          {/* Direction only for RETURN */}
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