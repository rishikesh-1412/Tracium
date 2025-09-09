import React, { useState, useEffect } from "react";
import { FaSun, FaMoon } from "react-icons/fa";

export default function JobDependencies({ productName }) {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");
  const [iconRotate, setIconRotate] = useState(false);

  // State for job dependencies
  const [dependencies, setDependencies] = useState([]);
  const [depLoading, setDepLoading] = useState(true);

  // Fetch views based on productName
  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/tracium/list/views/${productName}`)
      .then((res) => res.json())
      .then((data) => {
        setViews(data.products || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching views:", err);
        setLoading(false);
      });
  }, [productName]);

  // Fetch dependencies for 'Audience'
  useEffect(() => {
    setDepLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/tracium/list/view_dependency/${productName}`)
      .then((res) => res.json())
      .then((data) => {
        setDependencies(data.products || []);
        setDepLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching dependencies:", err);
        setDepLoading(false);
      });
  }, [productName]);

  const toggleTheme = () => {
    setIconRotate(true);
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
    setTimeout(() => setIconRotate(false), 300);
  };

  const isDark = theme === "dark";

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        padding: "10px 10px 90px 10px",
        boxSizing: "border-box",
        backgroundColor: isDark ? "rgb(43, 41, 48)" : "#fafafa",
        color: isDark ? "#eee" : "#000",
        transition: "background-color 0.3s, color 0.3s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontWeight: "bold", fontSize: "20px" }}>{productName} Job Mappings</h2>
        <div
          onClick={toggleTheme}
          style={{
            fontSize: "24px",
            cursor: "pointer",
            transition: "transform 0.3s",
            transform: iconRotate ? "rotate(360deg)" : "rotate(0deg)",
          }}
        >
          {isDark ? <FaSun color="#FFD700" /> : <FaMoon color="#4B5563" />}
        </div>
      </div>

      {/* Job Dependency Table */}
      <div style={{ marginTop: "20px" }}>
        {/* <h3 style={{ marginBottom: "10px" }}>{productName} Job Mappings</h3> */}
        {depLoading ? (
          <div>Loading dependencies...</div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: isDark ? "grey" : "#fff",
              color: isDark ? "#eee" : "#000",
            }}
          >
            <thead>
              <tr style={{ background: isDark ? "#333" : "#f0f0f0" }}>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>View Name</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Input View Name</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Raw Input</th>
              </tr>
            </thead>
            <tbody>
              {dependencies.length > 0 ? (
                dependencies.map((dep) => (
                  <tr key={dep.id}>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{dep.view_name}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{dep.input_view_name}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{dep.raw_input || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center", padding: "10px" }}>
                    No dependencies available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Views Table */}
      <h3 style={{ marginBottom: "10px" }}>{productName} Job Details</h3>
      {loading ? (
        <div style={{ marginTop: "20px" }}>Loading data...</div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
            backgroundColor: isDark ? "grey" : "#fff",
            color: isDark ? "#eee" : "#000",
          }}
        >
          <thead>
            <tr style={{ background: isDark ? "#333" : "#f0f0f0" }}>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>View Name</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Frequency</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Timezone</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>DC</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Monitoring</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Input Path</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Output Path</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Active</th>
            </tr>
          </thead>
          <tbody>
            {views.length > 0 ? (
              views.map((v, index) => (
                <tr
                  key={v.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? (isDark ? "#444" : "#fafafa") : "transparent",
                  }}
                >
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{v.view_name}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{v.frequency}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{v.timezone}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{v.dc}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>
                    {v.monitoring_level}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", maxWidth: "250px", wordBreak: "break-word" }}>
                    {v.input_path}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", maxWidth: "250px", wordBreak: "break-word" }}>
                    {v.output_path}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>
                    {v.is_active === "true" ? (
                      <span style={{ backgroundColor: "#d1fae5", color: "#065f46", padding: "4px 8px", borderRadius: "6px", fontSize: "12px" }}>
                        Active
                      </span>
                    ) : (
                      <span style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "4px 8px", borderRadius: "6px", fontSize: "12px" }}>
                        Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "10px" }}>
                  No views available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
