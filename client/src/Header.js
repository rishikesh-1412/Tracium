import React from "react";

export default function Header() {

  return (
    <div
      style={{
        width: "100%",
        padding: "15px 40px",
        background: "linear-gradient(90deg, #e6f0ff, rgb(5, 7, 12))",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
        <img
        src="/datatrails-logo.png" // public folder path
        alt="DataTrail Logo"
        style={{ width: 200, height: 70, marginRight: 15, borderRadius: 8 }}
      />
    </div>
  );
}
