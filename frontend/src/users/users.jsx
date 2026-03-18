import React, { useEffect, useState } from "react";
import { MdEdit, MdDelete, MdSave, MdCancel } from "react-icons/md";
import "../users/users.css";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // New user states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newStatus, setNewStatus] = useState(true);

  // Editing states
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingEmail, setEditingEmail] = useState("");
  const [editingPassword, setEditingPassword] = useState("");
  const [editingRole, setEditingRole] = useState("");
  const [editingDepartment, setEditingDepartment] = useState("");
  const [editingStatus, setEditingStatus] = useState(true);

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchRoles();
    fetchDepartments();
    fetchUsers();
  }, []);

  const fetchRoles = async () => {
    const res = await fetch("http://localhost:8000/roles", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setRoles(data);
  };

  const fetchDepartments = async () => {
    const res = await fetch("http://localhost:8000/departments", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setDepartments(data);
  };

  const fetchUsers = async () => {
    const res = await fetch("http://localhost:8000/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) setUsers(data);
  };

  // Add new user
  const handleAdd = async () => {
    if (!newName || !newEmail || !newRole) return;
    setLoading(true);
    const res = await fetch("http://localhost:8000/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newName,
        email: newEmail,
        role_id: Number(newRole),
        department_id: newDepartment ? Number(newDepartment) : null,
        status: newStatus,
        password: newPassword || "default123",
      }),
    });
    if (res.ok) {
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("");
      setNewDepartment("");
      setNewStatus(true);
      fetchUsers();
    }
    setLoading(false);
  };

  // Delete user
  const handleDelete = async (id) => {
    await fetch(`http://localhost:8000/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  };

  // Start editing
  const startEdit = (user) => {
    setEditingId(user.id);
    setEditingName(user.name);
    setEditingEmail(user.email);
    setEditingPassword("");
    setEditingRole(user.role_id);
    setEditingDepartment(user.department_id || "");
    setEditingStatus(user.status);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingEmail("");
    setEditingPassword("");
    setEditingRole("");
    setEditingDepartment("");
    setEditingStatus(true);
  };

  // Save edited user
  const saveEdit = async () => {
    if (!editingName || !editingEmail || !editingRole) return;
    await fetch(`http://localhost:8000/users/${editingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: editingName,
        email: editingEmail,
        role_id: Number(editingRole),
        department_id: editingDepartment ? Number(editingDepartment) : null,
        status: editingStatus,
        password: editingPassword || undefined,
      }),
    });
    cancelEdit();
    fetchUsers();
  };

  // Filter users for search
  const filtered = Array.isArray(users)
    ? users.filter((u) => {
        const roleName = roles.find((r) => r.id === u.role_id)?.name || "";
        const deptName =
          departments.find((d) => d.id === u.department_id)?.name || "";
        return (
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          roleName.toLowerCase().includes(search.toLowerCase()) ||
          deptName.toLowerCase().includes(search.toLowerCase())
        );
      })
    : [];

  return (
    <div className="users-page">
      <h2>Users</h2>

      {/* Add + Search */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
          <option value="">Select Role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={newDepartment}
          onChange={(e) => setNewDepartment(e.target.value)}
        >
          <option value="">None</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value === "true")}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button onClick={handleAdd} disabled={loading}>
          {loading ? "Adding..." : "Add"}
        </button>
      </div>

      {/* Users Table */}
      <table
        border="1"
        cellPadding="8"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Password</th>
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

              <td>
                {editingId === u.id ? (
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                  />
                ) : (
                  u.name
                )}
              </td>

              <td>
                {editingId === u.id ? (
                  <input
                    value={editingEmail}
                    onChange={(e) => setEditingEmail(e.target.value)}
                  />
                ) : (
                  u.email
                )}
              </td>

              <td>
                {editingId === u.id ? (
                  <input
                    type="password"
                    placeholder="Password"
                    value={editingPassword}
                    onChange={(e) => setEditingPassword(e.target.value)}
                  />
                ) : (
                  "********"
                )}
              </td>

              <td>
                {editingId === u.id ? (
                  <select
                    value={editingRole}
                    onChange={(e) => setEditingRole(Number(e.target.value))}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  roles.find((r) => r.id === u.role_id)?.name || "N/A"
                )}
              </td>

              <td>
                {editingId === u.id ? (
                  <select
                    value={editingDepartment}
                    onChange={(e) =>
                      setEditingDepartment(Number(e.target.value))
                    }
                  >
                    <option value="">None</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  departments.find((d) => d.id === u.department_id)?.name ||
                  "N/A"
                )}
              </td>

              <td>
                {editingId === u.id ? (
                  <select
                    value={editingStatus}
                    onChange={(e) =>
                      setEditingStatus(e.target.value === "true")
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                ) : u.status ? (
                  "Active"
                ) : (
                  "Inactive"
                )}
              </td>

              <td>
                {editingId === u.id ? (
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
                    <button onClick={() => startEdit(u)}>
                      <MdEdit />
                    </button>
                    <button onClick={() => handleDelete(u.id)}>
                      <MdDelete />
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Users;