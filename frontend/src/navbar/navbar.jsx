import React from "react";
import { Link } from "react-router-dom";
import "../navbar/navbar.css";
import {
  MdSpaceDashboard,
  MdOutlineProductionQuantityLimits,
  MdOutlineCategory,
  MdOutlineInventory2,
  MdOutlineAdminPanelSettings,
} from "react-icons/md";
import { AiOutlineProduct } from "react-icons/ai";
import { FaUser } from "react-icons/fa"; // replaced invalid FaBuildingUser

const Navbar = () => {
  return (
    <div>
      <section className="menu">
        <h2>RTW</h2>
        <section className="options">
          <Link to="/home/dashboard" className="nav-item">
            <MdSpaceDashboard className="icon" />
            <span className="nav-text">Dashboard</span>
          </Link>
          <Link to="/home/product" className="nav-item">
            <MdOutlineProductionQuantityLimits className="icon" />
            <span className="nav-text">Products</span>
          </Link>

          <Link to="/home/category" className="nav-item">
            <MdOutlineCategory className="icon" />
            <span className="nav-text">Categories</span>
          </Link>

          <Link to="/home/suppliers" className="nav-item">
            <AiOutlineProduct className="icon" />
            <span className="nav-text">Suppliers</span>
          </Link>

          <Link to="/home/inventory" className="nav-item">
            <MdOutlineInventory2 className="icon" />
            <span className="nav-text">Inventory</span>
          </Link>

          <Link to="/home/users" className="nav-item">
            <MdOutlineAdminPanelSettings className="icon" />
            <span className="nav-text">Users</span>
          </Link>

          <Link to="/home/users" className="nav-item">
            <FaUser className="icon" />
            <span className="nav-text">Audit Logs</span>
          </Link>
        </section>
      </section>
    </div>
  );
};

export default Navbar;
