import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../navbar/navbar.css";
import {
  MdSpaceDashboard,
  MdOutlineProductionQuantityLimits,
  MdOutlineCategory,
  MdOutlineInventory2,
  MdOutlineAdminPanelSettings,
} from "react-icons/md";
import { AiOutlineProduct } from "react-icons/ai";
import { FaUser } from "react-icons/fa";

const hasPermission = (permissions, requiredPrefixes) =>
  requiredPrefixes.some((prefix) =>
    permissions.some((permission) => permission === prefix || permission.startsWith(`${prefix}:`)),
  );

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");

  const canViewDashboard = hasPermission(permissions, ["products:manage", "users:manage", "settings:manage"]);
  const canManageProducts = hasPermission(permissions, ["products:manage"]);
  const canManageCategories = hasPermission(permissions, ["categories:manage"]);
  const canManageSuppliers = hasPermission(permissions, ["suppliers:manage"]);
  const canUseInventory = hasPermission(permissions, ["stock:in", "stock:out"]);
  const canManageUsers = hasPermission(permissions, ["users:manage"]);
  const canViewAuditLogs = hasPermission(permissions, ["audit_logs:view"]);

  const handleLogout = async () => {
    const token = localStorage.getItem("access_token");

    try {
      if (token) {
        await fetch("http://localhost:8000/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
    <div>
      <section className="menu">
        <h2>RTW</h2>
        {user && (
          <p>
            {user.name} ({user.role})
          </p>
        )}
        <section className="options">
          {canViewDashboard && (
            <Link to="/home/dashboard" className="nav-item">
              <MdSpaceDashboard className="icon" />
              <span className="nav-text">Dashboard</span>
            </Link>
          )}

          {canManageProducts && (
            <Link to="/home/product" className="nav-item">
              <MdOutlineProductionQuantityLimits className="icon" />
              <span className="nav-text">Products</span>
            </Link>
          )}

          {canManageCategories && (
            <Link to="/home/category" className="nav-item">
              <MdOutlineCategory className="icon" />
              <span className="nav-text">Categories</span>
            </Link>
          )}

          {canManageSuppliers && (
            <Link to="/home/suppliers" className="nav-item">
              <AiOutlineProduct className="icon" />
              <span className="nav-text">Suppliers</span>
            </Link>
          )}

          {canUseInventory && (
            <Link to="/home/inventory" className="nav-item">
              <MdOutlineInventory2 className="icon" />
              <span className="nav-text">Inventory</span>
            </Link>
          )}

          {canManageUsers && (
            <Link to="/home/users" className="nav-item">
              <MdOutlineAdminPanelSettings className="icon" />
              <span className="nav-text">Users</span>
            </Link>
          )}

          {canViewAuditLogs && (
            <Link to="/home/users" className="nav-item">
              <FaUser className="icon" />
              <span className="nav-text">Audit Logs</span>
            </Link>
          )}

          <button type="button" className="nav-item" onClick={handleLogout}>
            <FaUser className="icon" />
            <span className="nav-text">Logout</span>
          </button>
        </section>
      </section>
    </div>
  );
};

export default Navbar;
