import React, { useEffect, useState } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import "../suppliers/suppliers.css";
import Stockin from "../modal/modal";
import ConfirmModal from "../modal/confirmmodal";

const Suppliers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const token = localStorage.getItem("access_token");

  // Fetch suppliers
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

  // Open Add Modal
  const openAddModal = () => {
    setModalMode("add");
    setSelectedSupplier(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (s) => {
    setModalMode("edit");
    setSelectedSupplier(s);
    setName(s.name);
    setPhone(s.phone || "");
    setEmail(s.email || "");
    setAddress(s.address || "");
    setIsModalOpen(true);
  };

  // Save (Add or Edit)
  const handleSave = async () => {
    if (!name) return;

    setLoading(true);

    try {
      if (modalMode === "add") {
        await fetch("http://localhost:8000/suppliers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, phone, email, address }),
        });
      } else {
        await fetch(`http://localhost:8000/suppliers/${selectedSupplier.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, phone, email, address }),
        });
      }

      fetchSuppliers();
      setIsModalOpen(false);
      setSelectedSupplier(null);
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

  // Filter
  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.toLowerCase().includes(search.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="suppliers-page">
      <h2>Suppliers</h2>

      {/* Top Bar */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button onClick={openAddModal}>+ Add Supplier</button>

        <input
          type="text"
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <table border="1" cellPadding="8" style={{ width: "100%" }}>
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
                <td>{s.name}</td>
                <td>{s.phone}</td>
                <td>{s.email}</td>
                <td>{s.address}</td>
                <td>
                  <button onClick={() => openEditModal(s)}>
                    <MdEdit />
                  </button>

                  <button
                    onClick={() => {
                      setSupplierToDelete(s);
                      setIsConfirmOpen(true);
                    }}
                  >
                    <MdDelete />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No suppliers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Add/Edit Modal */}
      <Stockin isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3>
          {modalMode === "add"
            ? "Add Supplier"
            : `Edit ${selectedSupplier?.name}`}
        </h3>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Phone"
          value={phone}
          maxLength={11}
          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
        />

        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
          <button onClick={handleSave} disabled={loading || !name}>
            {loading ? "Saving..." : modalMode === "add" ? "Save" : "Update"}
          </button>
        </div>
      </Stockin>

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setSupplierToDelete(null);
        }}
        message={`Are you sure you want to delete "${supplierToDelete?.name}"?`}
        onConfirm={async () => {
          if (!supplierToDelete) return;
          await handleDelete(supplierToDelete.id);
          setIsConfirmOpen(false);
          setSupplierToDelete(null);
        }}
      />
    </div>
  );
};

export default Suppliers;
