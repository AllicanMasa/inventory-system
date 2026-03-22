import React, { useEffect, useState } from "react";
import "./inventory.css";
import { useNavigate } from "react-router-dom";


const TransactionHistory = () => {
  const [history, setHistory] = useState([]);
  const token = localStorage.getItem("access_token");
    const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:8000/inventory/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Helper to format the labels nicely
  const getBadgeClass = (type) => {
    if (type === "stock_in") return "badge-in";
    if (type === "stock_out") return "badge-out";
    return "badge-neutral";
  };

  return (
    <div className="history-page">
      <div className="inventory-header">
      <button className="view-history" onClick={() => navigate("/home/inventory")}>← Back to Inventory</button>
      </div>
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Product (SKU)</th>
            <th>Type</th>
            <th>Qty</th>
            <th>User</th>
            <th>Supplier/Notes</th>
          </tr>
        </thead>
        <tbody>
          {history.map((t) => (
            <tr key={t.id}>
              <td>{t.date}</td>
              <td>
                <strong>{t.product_name}</strong> <br />
                <small>{t.sku}</small>
              </td>
              <td>
                <span className={`badge ${getBadgeClass(t.type)}`}>
                  {t.type.replace("_", " ").toUpperCase()} 
                  {t.direction ? ` (${t.direction})` : ""}
                </span>
              </td>
              <td style={{ fontWeight: "bold" }}>
                {t.type === "stock_in" ? `+${t.quantity}` : `-${t.quantity}`}
              </td>
              <td>{t.user}</td>
              <td>
                {t.supplier !== "N/A" && <div>Supplier: {t.supplier}</div>}
                <small style={{ color: "#666" }}>{t.notes || ""}</small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;