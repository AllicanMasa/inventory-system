import React, { useEffect, useState } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import Modal from "../modal/modal";
import ConfirmModal from "../modal/confirmmodal";
import "../users/users.css";

// ✅ Reusable Form Component
const UserForm = ({
  form,
  setForm,
  roles,
  departments,
  onSubmit,
  loading,
  submitLabel,
}) => {
  return (
    <div className="user-form">
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <select
        value={form.role_id}
        onChange={(e) => setForm({ ...form, role_id: Number(e.target.value) })}
      >
        <option value="">Select Role</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      <select
        value={form.department_id}
        onChange={(e) =>
          setForm({
            ...form,
            department_id: e.target.value ? Number(e.target.value) : "",
          })
        }
      >
        <option value="">None</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        value={form.status}
        onChange={(e) =>
          setForm({ ...form, status: e.target.value === "true" })
        }
      >
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>

      <button onClick={onSubmit} disabled={loading}>
        {loading ? "Processing..." : submitLabel}
      </button>
    </div>
  );
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState(null);

  // Shared form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "",
    department_id: "",
    status: true,
  });

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    const init = async () => {
      await fetchRoles();
      await fetchDepartments();
      await fetchUsers();
    };

    init();
  }, []);

  const fetchRoles = async () => {
    const res = await fetch("http://localhost:8000/roles", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setRoles(await res.json());
  };

  const fetchDepartments = async () => {
    const res = await fetch("http://localhost:8000/departments", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDepartments(await res.json());
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      console.log("USERS:", data);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add User
  const handleAdd = async () => {
    if (!form.name || !form.email || !form.role_id) return;

    setLoading(true);
    const res = await fetch("http://localhost:8000/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        role_id: Number(form.role_id),
        department_id: form.department_id ? Number(form.department_id) : null,
        password: form.password || "default123",
      }),
    });

    if (res.ok) {
      setIsAddOpen(false);
      resetForm();
      await fetchUsers();
    }

    setLoading(false);
  };

  // ✅ Edit User
  const handleEdit = async () => {
    if (!form.name || !form.email || !form.role_id) return;

    await fetch(`http://localhost:8000/users/${selectedUserId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        role_id: Number(form.role_id),
        department_id: form.department_id ? Number(form.department_id) : null,
        password: form.password || undefined,
      }),
    });

    setIsEditOpen(false);
    resetForm();
    fetchUsers();
  };

  const handleDelete = async () => {
    await fetch(`http://localhost:8000/users/${selectedUserId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setIsDeleteOpen(false);
    setSelectedUserId(null);
    fetchUsers();
  };

  const openEditModal = (user) => {
    setSelectedUserId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role_id: user.role_id,
      department_id: user.department_id || "",
      status: user.status,
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      role_id: "",
      department_id: "",
      status: true,
    });
  };

  const filtered = users.filter((u) => {
    const roleName = roles.find((r) => r.id === u.role_id)?.name || "";
    const deptName =
      departments.find((d) => d.id === u.department_id)?.name || "";

    const keyword = search.toLowerCase();

    return (
      (u.name || "").toLowerCase().includes(keyword) ||
      (u.email || "").toLowerCase().includes(keyword) ||
      roleName.toLowerCase().includes(keyword) ||
      deptName.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <input
            placeholder="Search users..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="refresh" onClick={fetchUsers}>
            Refresh
          </button>
        </div>

        <div>
          <button className="add-users" onClick={() => setIsAddOpen(true)}>
            Add User
          </button>
        </div>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{roles.find((r) => r.id === u.role_id)?.name}</td>
              <td>
                {departments.find((d) => d.id === u.department_id)?.name ||
                  "N/A"}
              </td>
              <td>{u.status ? "Active" : "Inactive"}</td>
              <td>
                <button className="btn-edit" onClick={() => openEditModal(u)}>
                  <MdEdit />
                </button>

                <button
                  className="btn-delete"
                  onClick={() => {
                    setSelectedUserId(u.id);
                    setIsDeleteOpen(true);
                  }}
                >
                  <MdDelete />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ADD MODAL */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
        <h2>Add User</h2>
        <UserForm
          form={form}
          setForm={setForm}
          roles={roles}
          departments={departments}
          onSubmit={handleAdd}
          loading={loading}
          submitLabel="Add User"
        />
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <h2>Edit User</h2>
        <UserForm
          form={form}
          setForm={setForm}
          roles={roles}
          departments={departments}
          onSubmit={handleEdit}
          loading={loading}
          submitLabel="Save Changes"
        />
      </Modal>

      {/* DELETE CONFIRM */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this user?"
      />
    </div>
  );
};

export default Users;
