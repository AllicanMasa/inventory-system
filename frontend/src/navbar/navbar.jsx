import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../navbar/navbar.css";
import {
  MdSpaceDashboard,
  MdOutlineProductionQuantityLimits,
  MdOutlineCategory,
  MdOutlineInventory2,
  MdOutlineAdminPanelSettings,
} from "react-icons/md";
import { IoLogOutOutline } from "react-icons/io5";
import { AiOutlineProduct, AiOutlineAudit } from "react-icons/ai";

// Permissions helper
const hasPermission = (permissions, requiredPrefixes) =>
  requiredPrefixes.some((prefix) =>
    permissions.some(
      (permission) =>
        permission === prefix || permission.startsWith(`${prefix}:`),
    ),
  );

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");

  const handleLogout = async () => {
    const token = localStorage.getItem("access_token");
    try {
      if (token) {
        await fetch("http://localhost:8000/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      navigate("/");
    }
  };

  return (
    <section className="menu">
      <h2>RTW</h2>
      <p className="sub-label">ready to wear.</p>

      {user && <p className="user-name">Welcome, {user.name}!</p>}

      <section className="options">
        {hasPermission(permissions, [
          "products:view",
          "products:manage",
          "users:manage",
        ]) && (
          <NavLink
            to="/home/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <MdSpaceDashboard className="icon" />
            <span className="nav-text">Dashboard</span>
          </NavLink>
        )}

        {hasPermission(permissions, ["products:manage", "products:view"]) && (
          <NavLink
            to="/home/product"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <MdOutlineProductionQuantityLimits className="icon" />
            <span className="nav-text">Products</span>
          </NavLink>
        )}

        {hasPermission(permissions, ["categories:manage"]) && (
          <NavLink
            to="/home/categories"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <MdOutlineCategory className="icon" />
            <span className="nav-text">Categories</span>
          </NavLink>
        )}

        {hasPermission(permissions, ["suppliers:manage"]) && (
          <NavLink
            to="/home/suppliers"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <AiOutlineProduct className="icon" />
            <span className="nav-text">Suppliers</span>
          </NavLink>
        )}

        {hasPermission(permissions, ["stock:in", "stock:out"]) && (
          <NavLink
            to="/home/inventory"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <MdOutlineInventory2 className="icon" />
            <span className="nav-text">Inventory</span>
          </NavLink>
        )}

        {hasPermission(permissions, ["users:manage"]) && (
          <NavLink
            to="/home/users"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <MdOutlineAdminPanelSettings className="icon" />
            <span className="nav-text">Users</span>
          </NavLink>
        )}

        {hasPermission(permissions, ["audit_logs:view"]) && (
          <NavLink
            to="/home/audit-logs"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <AiOutlineAudit className="icon" />
            <span className="nav-text">Audit Logs</span>
          </NavLink>
        )}

        <button
          type="button"
          className="nav-item logout"
          onClick={handleLogout}
        >
          <IoLogOutOutline className="icon" />
          <span className="nav-text">Logout</span>
        </button>
      </section>
    </section>
  );
};

export default Navbar;
