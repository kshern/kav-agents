import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px",
        fontSize: "16px",
        borderRadius: "5px",
        border: "1px solid #ccc",
        backgroundColor: "#f0f0f0",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
};

export default Button;
