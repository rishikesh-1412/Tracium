import React, { useState, useEffect } from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import Modal from "react-modal";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// Bind modal to the app element
Modal.setAppElement("#root");

export default function JobDependencies({ productName }) {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");
  const [iconRotate, setIconRotate] = useState(false);

  const [dependencies, setDependencies] = useState([]);
  const [depLoading, setDepLoading] = useState(true);

  const [hoveredViewId, setHoveredViewId] = useState(null);
  const [actionView, setActionView] = useState(null);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const [monitoringValue, setMonitoringValue] = useState(0);

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
        toast.error("Failed to fetch views.");
        setLoading(false);
      });
  }, [productName]);

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
        toast.error("Failed to fetch dependencies.");
        setDepLoading(false);
      });
  }, [productName]);

  const toggleTheme = () => {
    setIconRotate(true);
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
    setTimeout(() => setIconRotate(false), 300);
  };

  const isDark = theme === "dark";

  const refreshViews = () => {
    setLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/tracium/list/views/${productName}`)
      .then((res) => res.json())
      .then((data) => {
        setViews(data.products || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error refreshing views:", err);
        toast.error("Failed to refresh views.");
        setLoading(false);
      });
  };

  const openModal = (content) => {
    setModalContent(content);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setModalContent(null);
    setActionView(null);
  };

  const handleActivate = (view) => {
    setActionView(view);
    setMonitoringValue(view.monitoring_level ? parseInt(view.monitoring_level) : 0);
    setModalIsOpen(true);
  };
  

  const confirmActivate = async (view) => {
    closeModal();
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/tracium/update/activeness/${view.view_name}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valueToSet: "true" }),
      });
  
      await fetch(`${process.env.REACT_APP_API_URL}/tracium/update/monitoring/${view.view_name}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valueToSet: monitoringValue }),  // already Number
      });
  
      toast.success(`${view.view_name} View activated successfully!`);
      refreshViews();
    } catch (error) {
      console.error("Activation error:", error);
      toast.error("Error during activation.");
    }
  };


  const renderModalContent = () => {
    if (!actionView) return null;
  
    if (actionView.is_active === "true") {
      return (
        <div>
        <h2>Deactivate View</h2>
        <p>Are you sure you want to deactivate this view?</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={closeModal} style={{ padding: "8px 16px" }}>Cancel</button>
          <button onClick={() => confirmDeactivate(actionView)} style={{ padding: "8px 16px" }}>Yes, Deactivate</button>
        </div>
      </div>
      );
    } else {
      return (
        <div>
          <h2>{actionView.view_name}</h2>
          <p>Enter monitoring level:</p>
          <select
            value={monitoringValue}
            onChange={(e) => setMonitoringValue(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "20px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          >
            <option value={0}>0 - None</option>
            <option value={1}>1 - Low</option>
            <option value={2}>2 - Medium</option>
            <option value={3}>3 - High</option>
          </select>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button onClick={closeModal} style={{ padding: "8px 16px" }}>Cancel</button>
            <button onClick={() => confirmActivate(actionView)} style={{ padding: "8px 16px" }}>Confirm</button>
          </div>
        </div>
      );
    }
  };
  

  const handleDeactivate = (view) => {
    setActionView(view); // First set the data
    openModal(
      <div>
        <h2>Deactivate View</h2>
        <p>Are you sure you want to deactivate this view?</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={closeModal} style={{ padding: "8px 16px" }}>Cancel</button>
          <button onClick={() => confirmDeactivate(view)} style={{ padding: "8px 16px" }}>Yes, Deactivate</button>
        </div>
      </div>
    );
  };
  

  const confirmDeactivate = async (view) => {
    closeModal();
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/tracium/update/activeness/${view.view_name}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valueToSet: "false" }),
      });

      await fetch(`${process.env.REACT_APP_API_URL}/tracium/update/monitoring/${view.view_name}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valueToSet: 0 }),
      });

      toast.info(`${view.view_name} View deactivated.`);
      refreshViews();
    } catch (error) {
      console.error("Deactivation error:", error);
      toast.error("Error during deactivation.");
    }
  };

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
      <ToastContainer position="top-right" autoClose={3000} />
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Action Modal"
        style={{
          overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            background: isDark ? '#333' : '#fff',
            color: isDark ? '#eee' : '#000',
            borderRadius: '10px',
            maxWidth: '400px',
            width: '90%',
            padding: '20px'
          }
        }}
      >
        {renderModalContent()}
      </Modal>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontWeight: "bold", fontSize: "20px" }}>{productName} Job Details</h2>
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

      {/* Views Table */}
      {loading ? (
        <div style={{ marginTop: "20px" }}>Loading data...</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px", backgroundColor: isDark ? "grey" : "#fff", color: isDark ? "#eee" : "#000" }}>
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
                <tr key={v.id} style={{ backgroundColor: index % 2 === 0 ? (isDark ? "#444" : "#fafafa") : "transparent" }}>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{v.view_name}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{v.frequency}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{v.timezone}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{v.dc}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>{v.monitoring_level}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", maxWidth: "250px", wordBreak: "break-word" }}>{v.input_path}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", maxWidth: "250px", wordBreak: "break-word" }}>{v.output_path}</td>
                  <td
                    style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center", cursor: "pointer" }}
                    onMouseEnter={() => setHoveredViewId(v.id)}
                    onMouseLeave={() => setHoveredViewId(null)}
                    onClick={() => {
                      if (v.is_active === "true") {
                        handleDeactivate(v);
                      } else {
                        handleActivate(v);
                      }
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: v.is_active === "true" ? "#d1fae5" : "#fee2e2",
                        color: v.is_active === "true" ? "#065f46" : "#991b1b",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        transition: "background-color 0.3s, color 0.3s",
                      }}
                    >
                      {hoveredViewId === v.id
                        ? v.is_active === "true"
                          ? "Deactivate it?"
                          : "Activate it?"
                        : v.is_active === "true"
                          ? "Active"
                          : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "10px" }}>No views available</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Dependency Table */}
      <h3 style={{ marginBottom: "10px" }}>{productName} Job Mappings</h3>
      <div style={{ marginTop: "20px" }}>
        {depLoading ? (
          <div>Loading dependencies...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: isDark ? "grey" : "#fff", color: isDark ? "#eee" : "#000" }}>
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

    </div>
  );
}
