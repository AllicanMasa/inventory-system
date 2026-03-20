import React from "react";
import "../modal/modal.css";

const Stockin = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modalOverlay">
      <div className="modalContent">

        {children}

          <button onClick={onClose} className="modalClose">
          Close
        </button>
      </div>
    </div>
  );
};

export default Stockin;