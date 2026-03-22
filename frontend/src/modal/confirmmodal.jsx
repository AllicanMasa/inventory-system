import React from "react";
import "../modal/modal.css";

// Added 'children' to the props destructuring
const ConfirmModal = ({ isOpen, onClose, onConfirm, message, children }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modalOverlay">
      <div className="confirm-modalContent">
        <h3>Confirm Action</h3>
        <p className="message">{message}</p>

        {/* 
           This is where the checkbox from Product.jsx will render.
           If there are no children, it simply renders nothing here.
        */}
        {children}

        <div style={{ marginTop: "2rem", display: "flex", gap: "10px" }}>
          <button
            style={{
              backgroundColor: "red",
              color: "white",
              border: "none",
              padding: "8px 16px",
              cursor: "pointer",
            }}
            onClick={onConfirm}
          >
            Yes, Delete
          </button>
          <button
            style={{
              backgroundColor: "gray",
              color: "white",
              border: "none",
              padding: "8px 16px",
              cursor: "pointer",
            }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
