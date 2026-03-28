import React, { useState, useEffect } from "react";
import "../dashboard/dashboard.css";
import Inventory from "../dashboard/inventorychart";
import { authFetch } from "../authfetch/authfetch";

const Dashboard = () => {
  // 1. Define states for your dynamic data
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStockIn: 0,
    totalStockOut: 0,
    totalReturns: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);

  const fetchData = async () => {
    try {
      // 🔹 Fetch Online Users
      const userRes = await authFetch(
        "http://localhost:8000/dashboard/online-users",
      );
      if (userRes) {
        const userData = await userRes.json();
        console.log("ONLINE USERS:", userData); // 👈 ADD THIS
        setOnlineUsers(userData);
      }

      // 🔹 Fetch Inventory Stats
      const statsRes = await authFetch("http://localhost:8000/dashboard/stats");
      if (statsRes) {
        const statsData = await statsRes.json();

        console.log("Stats Data from API:", statsData);

        setStats({
          totalProducts: statsData.totalProducts || 0,
          totalStockIn: statsData.purchases || 0,
          totalStockOut: statsData.stockOutCount || 0,
          totalReturns: statsData.returns || 0,
        });
      }

      // 🔹 Fetch Recent Transactions
      const historyRes = await authFetch(
        "http://localhost:8000/inventory/history",
      );
      if (historyRes) {
        const historyData = await historyRes.json();
        setRecentTransactions(historyData.slice(0, 5));
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) return;

    fetchData();

    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard">
      <section className="container">
        <section className="product">
          <h3>Inventory Overview</h3>
          <div className="product-con">
            <div className="stats">
              <p>Total Products</p>
              <h3>{stats.totalProducts}</h3>
            </div>
            <div className="stats">
              <p>Total Stock In</p>
              <h3>{stats.totalStockIn}</h3>
            </div>
            <div className="stats">
              <p>Total Stock Out</p>
              <h3>{stats.totalStockOut}</h3>
            </div>
            <div className="stats">
              <p>Total Returns</p>
              <h3>{stats.totalReturns}</h3>
            </div>
          </div>
        </section>

        <section className="lowstock">
          <h3>Recent Transactions</h3>
          <div className="lowstock-con">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Type</th>
                  <th>Product</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td className="transaction-type">
                      <span className={`badge-${t.type.toLowerCase()}`}>
                        {t.type} {t.direction ? `(${t.direction})` : ""}
                      </span>
                    </td>
                    <td>{t.product_name}</td>
                    <td>{t.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section className="container-bottom">
        <section className="inventory-chart">
          <h3>Inventory Stock Levels</h3>
          <Inventory />
        </section>

        <section className="online-status">
          <h3>Online</h3>
          <div className="user-list">
            {onlineUsers.length > 0 ? (
              onlineUsers.map((user) => (
                <div key={user.id} className="user-pill">
                  <span className="online-indicator">●</span> {user.name}
                </div>
              ))
            ) : (
              <p style={{ fontSize: "12px", color: "gray" }}>No staff online</p>
            )}
          </div>
        </section>
      </section>
    </div>
  );
};

export default Dashboard;
