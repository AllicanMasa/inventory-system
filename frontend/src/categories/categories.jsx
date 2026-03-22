import React, { useEffect, useState } from "react";
import { MdEdit, MdDelete, MdSave, MdCancel } from "react-icons/md";
import "../categories/categories.css";
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
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="categories-page">
      {/* Add + Search */}
      <div className="categories-header">
        <div>
          <input
            type="text"
            className="search-input"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="add-func">
          <input
            type="text"
            placeholder="New category"
            className="add-categories"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            className="save-categ"
            onClick={handleAdd}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <table className="category-table">
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
                    <button className="btn-save" onClick={saveEdit}>
                      <MdSave />
                    </button>
                    <button className="btn-cancel" onClick={cancelEdit}>
                      <MdCancel />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn-edit-categ"
                      onClick={() => startEdit(c.id, c.name)}
                    >
                      <MdEdit />
                    </button>
                    <button
                      className="btn-delete-categ"
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
