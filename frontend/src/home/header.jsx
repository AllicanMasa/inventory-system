import React from "react";
import { useLocation } from "react-router-dom";
import "../home/home.css";
import DateTime from "../dashboard/datetime";

const Header = () => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;

    const page = path.replace("/home/", "").replace("/home", "");

    switch (page) {
      case "dashboard":
      case "":
        return "Dashboard";
      case "product":
        return "Products";
      case "categories":
        return "Categories";
      case "suppliers":
        return "Suppliers";
      case "inventory":
        return "Inventory";
      case "transactionhistory":
        return "Stock Transaction History";
      case "users":
        return "Users";
      case "audit-logs":
        return "Audit Logs";
      default:
        return "Overview";
    }
  };

  return (
    <div className="header">
      <section className="yo">
        <div className="header-title">
          <p>{getPageTitle()}</p>
        </div>
        <div className="time-date">
          <DateTime />
        </div>
      </section>
    </div>
  );
};

export default Header;
