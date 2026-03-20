import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../login/login.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Login failed");
      }

      const data = await response.json();

      setUser(data.user); // show welcome
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem(
        "permissions",
        JSON.stringify(data.permissions || [])
      );

      // ⛔ IMPORTANT: delay navigation BEFORE turning off loading
      setTimeout(() => {
        navigate("/home/dashboard");
      }, 1500);

    } catch (err) {
      setError(err.message);
      setLoading(false); // stop loading only on error
    }
  };

  return (
    <div className="login-main">

      {/* ✅ Show overlay ONLY when login success */}
      {loading && user && (
        <div className="overlay">
          <div className="welcome-message">
            <h2>Welcome, {user.name}!</h2>
            <div className="spinner"></div>
          </div>
        </div>
      )}

      <section className="login">
        <h2 className="title">RTW</h2>
        <p className="sub-title">ready to wear</p>

        <p className="lbl">Email</p>
        <input
          type="text"
          className="username"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <p className="lbl">Password</p>
        <input
          type="password"
          className="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading && !user ? "Logging in..." : "Login"}
        </button>
      </section>
    </div>
  );
};

export default Login;