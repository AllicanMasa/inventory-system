import React, { useEffect, useState } from "react";
import { MdEdit, MdDelete, MdSave, MdCancel } from "react-icons/md";
import "../suppliers/suppliers.css";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // New supplier fields
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // Editing fields
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [editingEmail, setEditingEmail] = useState("");

  const [newAddress, setNewAddress] = useState("");
  const [editingAddress, setEditingAddress] = useState("");

  const token = localStorage.getItem("access_token");

  // Fetch suppliers from backend
  const fetchSuppliers = async () => {
    try {
      const res = await fetch("http://localhost:8000/suppliers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      const data = await res.json();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Add new supplier
  const handleAdd = async () => {
    if (!newName) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName,
          phone: newPhone,
          email: newEmail,
          address: newAddress,
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewPhone("");
        setNewEmail("");
        fetchSuppliers();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Delete supplier
  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:8000/suppliers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSuppliers();
    } catch (err) {
      console.error(err);
    }
  };

  // Start editing supplier
  const startEdit = (id, name, phone, email) => {
    setEditingId(id);
    setEditingName(name);
    setEditingPhone(phone || "");
    setEditingEmail(email || "");
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingPhone("");
    setEditingEmail("");
  };

  // Save edited supplier
  const saveEdit = async () => {
    if (!editingName) return;
    try {
      await fetch(`http://localhost:8000/suppliers/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingName,
          phone: editingPhone,
          email: editingEmail,
          address: editingAddress,
        }),
      });
      cancelEdit();
      fetchSuppliers();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter suppliers based on search
  const filtered = Array.isArray(suppliers)
    ? suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          (s.phone && s.phone.toLowerCase().includes(search.toLowerCase())) ||
          (s.email && s.email.toLowerCase().includes(search.toLowerCase())),
      )
    : [];

  return (
    <div className="suppliers-page">
      <h2>Suppliers</h2>

      {/* Add & Search */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="New supplier name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Phone"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
        />
        <input
          type="text"
          placeholder="Email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <input
          type="text"
          placeholder="Address"
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value)}
        />
        <button onClick={handleAdd} disabled={loading}>
          {loading ? "Adding..." : "Add"}
        </button>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Suppliers Table */}
      <table
        border="1"
        cellPadding="8"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length > 0 ? (
            filtered.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>
                  {editingId === s.id ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                    />
                  ) : (
                    s.name
                  )}
                </td>
                <td>
                  {editingId === s.id ? (
                    <input
                      value={editingPhone}
                      onChange={(e) => setEditingPhone(e.target.value)}
                    />
                  ) : (
                    s.phone
                  )}
                </td>
                <td>
                  {editingId === s.id ? (
                    <input
                      value={editingEmail}
                      onChange={(e) => setEditingEmail(e.target.value)}
                    />
                  ) : (
                    s.email
                  )}
                </td>
                <td>
                  {editingId === s.id ? (
                    <input
                      value={editingAddress}
                      onChange={(e) => setEditingAddress(e.target.value)}
                    />
                  ) : (
                    s.address
                  )}
                </td>
                <td>
                  {editingId === s.id ? (
                    <>
                      <button onClick={saveEdit}>
                        <MdSave />
                      </button>
                      <button onClick={cancelEdit}>
                        <MdCancel />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          startEdit(s.id, s.name, s.phone, s.email)
                        }
                      >
                        <MdEdit />
                      </button>
                      <button onClick={() => handleDelete(s.id)}>
                        <MdDelete />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No suppliers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Suppliers;
