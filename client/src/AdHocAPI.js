import React, { useState, useEffect } from "react";
import { FaSun, FaMoon } from "react-icons/fa"; // Animated icons

export default function AdHocAPI({ productName, startDate, endDate }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [theme, setTheme] = useState("light"); // light or dark
  const [iconRotate, setIconRotate] = useState(false); // For rotation animation

  useEffect(() => {
    if (!productName || !startDate || !endDate) return;

    setLoading(true);

    fetch(`${process.env.REACT_APP_API_URL}/tracium/healthCheck/${productName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data) => {
        setData(data.results || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, [productName, startDate, endDate]);

  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.frequency]) acc[item.frequency] = [];
    acc[item.frequency].push(item);
    return acc;
  }, {});

  const toggleExpand = (frequency, index) => {
    const key = `${frequency}-${index}`;
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTheme = () => {
    setIconRotate(true); // start rotation animation
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
    setTimeout(() => setIconRotate(false), 300); // reset rotation after animation
  };

  const renderTable = (title, items, frequency) => {
    const isDark = theme === "dark";
    return (
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontWeight: "bold", color: isDark ? "#fff" : "#333" }}>{title}</h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "10px",
            backgroundColor: isDark ? "grey" : "#fff",
            color: isDark ? "#eee" : "#000",
          }}
        >
          <thead>
            <tr style={{ background: isDark ? "#333" : "#f0f0f0" }}>
              <th style={{ border: "1px solid #ddd", padding: "8px", width: "25%" }}>Job Name</th>
              <th style={{ border: "1px solid #ddd", padding: "8px", width: "15%" }}>Absent Entry Count</th>
              <th style={{ border: "1px solid #ddd", padding: "8px", width: "60%" }}>Absent Entries</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((job, index) => {
                const key = `${frequency}-${index}`;
                const isExpanded = expandedRows[key];
                const entriesToShow = isExpanded ? job.absentEntries : job.absentEntries.slice(0, 4);
                const hasMore = job.absentEntries.length > 4;

                return (
                  <tr key={index}>
                    <td style={{ border: "1px solid #ddd", padding: "8px", verticalAlign: "top" }}>
                      {job.jobName}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        verticalAlign: "top",
                        textAlign: "center",
                      }}
                    >
                      {job.absentEntries.length}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}
                    >
                      {entriesToShow.length > 0 ? entriesToShow.join(", ") : "None"}
                      {hasMore && (
                        <div style={{ marginTop: "5px" }}>
                          <button
                            onClick={() => toggleExpand(frequency, index)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "12px",
                              cursor: "pointer",
                              border: "1px solid #ccc",
                              backgroundColor: isDark ? "#444" : "#fff",
                              color: isDark ? "#fff" : "#000",
                              borderRadius: "4px",
                              boxShadow: "1px 1px 3px rgba(0,0,0,0.1)",
                            }}
                          >
                            {isExpanded ? "Show Less" : `Show More (${job.absentEntries.length - 4})`}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: "center", padding: "10px" }}>
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const isDark = theme === "dark";

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        padding: "20px",
        boxSizing: "border-box",
        paddingBottom: "70px",
        backgroundColor: isDark ? "rgb(43, 41, 48)" : "#fafafa",
        color: isDark ? "#eee" : "#000",
        transition: "background-color 0.3s, color 0.3s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontWeight: "bold", fontSize: "20px" }}>Overall Performance</h2>
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
      <p>Product: {productName}</p>
      <p>Start Date: {startDate}</p>
      <p>End Date: {endDate}</p>

      {loading ? (
        <div style={{ marginTop: "20px" }}>Loading data...</div>
      ) : (
        <>
          {renderTable("Hourly Performance", groupedData.hourly || [], "hourly")}
          {renderTable("Daily Performance", groupedData.daily || [], "daily")}
          {renderTable("Weekly Performance", groupedData.weekly || [], "weekly")}
          {renderTable("Monthly Performance", groupedData.monthly || [], "monthly")}
        </>
      )}
    </div>
  );
}
