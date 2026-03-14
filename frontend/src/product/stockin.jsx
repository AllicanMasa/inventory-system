import React from "react";
import "../product/product.css";

const Stockin = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modalOverlay">
      <div className="modalContent">
        <button onClick={onClose} className="modalClose">
          ×
        </button>

        {children}
      </div>
    </div>
  );
};

export default Stockin;