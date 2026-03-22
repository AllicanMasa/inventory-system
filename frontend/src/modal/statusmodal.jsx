import React from "react";
import "./modal.css";

const StatusModal = ({ isOpen, onClose, type, message }) => {
  if (!isOpen) return null;

  // Configuration based on type
  const config = {
    success: {
      title: "Success!",
      color: "#28a745",
      icon: "check_circle",
    },
    error: {
      title: "Process Failed",
      color: "#dc3545",
      icon: "error",
    },
    connection: {
      title: "Connection Error",
      color: "#ffc107",
      icon: "wifi_off",
    },
  };

  const current = config[type] || config.error;

  return (
    <div className="modal-overlay">
      <div className="modal-content status-modal" style={{ textAlign: "center", padding: "30px" }}>
        <div style={{ fontSize: "60px", color: current.color, marginBottom: "15px" }}>
          {/* If using Material Icons or similar, otherwise use a local SVG/emoji */}
          <span className="material-icons">{current.icon}</span>
        </div>
        <h2 style={{ color: "#333" }}>{current.title}</h2>
        <p style={{ color: "#666", fontSize: "1.1rem", margin: "15px 0" }}>{message}</p>
        <button 
          className="btn-primary" 
          onClick={onClose}
          style={{ backgroundColor: current.color, border: "none", minWidth: "120px" }}
        >
          {type === "connection" ? "Try Again" : "Close"}
        </button>
      </div>
    </div>
  );
};

export default StatusModal;