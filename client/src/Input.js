import React, { useState, useEffect } from "react";

export default function Selector({ filters, setFilters, onLoadGraph }) {
  const [products, setProducts] = useState([]);

  const today = new Date();
  const minStartDate = new Date();
  minStartDate.setDate(today.getDate() - 30);

  const formatDate = (d) => d.toISOString().split("T")[0]; // yyyy-mm-dd

  useEffect(() => {
    // Fetch products from API
    fetch(`${process.env.REACT_APP_API_URL}/tracium/list/products`)
      .then((res) => res.json())
      .then((data) => {
        if (data.products) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => {
      let updated = { ...prev, [name]: value };

      // Validation 1: StartDate cannot be less than today - 30
      if (name === "startDate" && value < formatDate(minStartDate)) {
        updated.startDate = formatDate(minStartDate);
      }

      // Validation 2: EndDate must be >= StartDate
      if (name === "endDate" && value < updated.startDate) {
        updated.endDate = updated.startDate;
      }

      return updated;
    });
  };

  const boxStyle = {
    display: "flex",
    flexDirection: "column",
    fontSize: "14px",
    fontWeight: 500,
    color: "#333",
  };

  const inputStyle = {
    padding: "6px 8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginTop: "4px",
    minWidth: "140px",
    fontSize: "14px",
  };

  return (
    <div
      style={{
        padding: "12px 20px",
        display: "flex",
        gap: "20px",
        alignItems: "center",
        background: "linear-gradient(90deg, #f8f9fa, #eef2f7)",
        borderBottom: "1px solid #ddd",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Product Name First */}
      <div style={boxStyle}>
        <label>Product</label>
        <select
          name="productName"
          value={filters.productName}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">Select</option>
          {products.map((p, i) => (
            <option key={i} value={p.product_name}>
              {p.product_name}
            </option>
          ))}
        </select>
      </div>

      <div style={boxStyle}>
        <label>Start Date</label>
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          min={formatDate(minStartDate)}
          max={formatDate(today)}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>

      <div style={boxStyle}>
        <label>Start Hour</label>
        <select
          name="startHour"
          value={filters.startHour}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">Select Hour</option>
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i.toString().padStart(2, "0")}>
              {i.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
      </div>

      <div style={boxStyle}>
        <label>End Date</label>
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          min={filters.startDate || formatDate(minStartDate)}
          max={formatDate(today)}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>

      <div style={boxStyle}>
        <label>End Hour</label>
        <select
          name="endHour"
          value={filters.endHour}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">Select Hour</option>
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i.toString().padStart(2, "0")}>
              {i.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
      </div>

      {/* Load Graph button */}
      <div style={{ display: "flex", flexDirection: "column", marginTop: "20px" }}>
        <button
          onClick={onLoadGraph}
          style={{
            padding: "8px 16px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            height: "fit-content",
            transition: "all 0.3s ease-in-out",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "linear-gradient(135deg,rgb(190, 230, 238) 0%,rgb(225, 225, 242) 25%,rgb(216, 212, 228) 75%,rgb(163, 177, 187) 100%)";
            e.target.style.border = "black";
            e.target.style.color = "black";
            // e.target.style.transform = "scale(1.08)";
            // e.target.style.boxShadow = "0 4px 12px rgba(0, 123, 255, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "#007bff";
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "none";
            e.target.innerText = "Submit";
            e.target.style.color = "white";
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
