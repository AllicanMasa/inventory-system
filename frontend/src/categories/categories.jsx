import React, { useEffect, useState } from "react";
import { MdEdit, MdDelete, MdSave, MdCancel } from "react-icons/md";
import '../categories/categories.css';
import ConfirmModal from "../modal/confirmmodal"; // import it

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const token = localStorage.getItem("access_token");

  const fetchCategories = async () => {
    const res = await fetch("http://localhost:8000/categories", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async () => {
    if (!newName) return;
    setLoading(true);
    const res = await fetch("http://localhost:8000/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      setNewName("");
      fetchCategories();
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:8000/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchCategories();
  };

  const startEdit = (id, name) => {
    setEditingId(id);
    setEditingName(name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async () => {
    if (!editingName) return;
    await fetch(`http://localhost:8000/categories/${editingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: editingName }),
    });
    cancelEdit();
    fetchCategories();
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="categories-page">
      {/* Add + Search */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="New category"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button onClick={handleAdd} disabled={loading}>
          {loading ? "Adding..." : "Add"}
        </button>
      </div>

      {/* Categories Table */}
      <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td>
                {editingId === c.id ? (
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                  />
                ) : (
                  c.name
                )}
              </td>
              <td>
                {editingId === c.id ? (
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
                    <button onClick={() => startEdit(c.id, c.name)}>
                      <MdEdit />
                    </button>
                    <button
                      onClick={() => {
                        setCategoryToDelete(c);
                        setIsConfirmOpen(true);
                      }}
                    >
                      <MdDelete />
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan="2" style={{ textAlign: "center" }}>
                No categories found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        message={`Are you sure you want to delete "${categoryToDelete?.name}"?`}
        onConfirm={async () => {
          await handleDelete(categoryToDelete.id);
          setIsConfirmOpen(false);
        }}
      />
    </div>
  );
};

export default Categories;