import React from "react";
import "../modal/modal.css";

const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modalOverlay">
      <div className="confirm-modalContent">
        <h3>Confirm Action</h3>
        <p style={{marginTop: "2.5rem"}}>{message}</p>

        <div style={{ marginTop: "2rem", display: "flex"}}>
          <button style={{backgroundColor: "red"}} onClick={onConfirm}>Yes</button>
          <button style={{backgroundColor: "gray"}} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;