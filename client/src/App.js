import React, { useState } from "react";
// import Header from "./Header";
import Graph from "./Graph";
import Selector from "./Input";
import AdHocAPI from "./AdHocAPI";
import DynamicSVGPlaceholderWithEdges from "./SVGPlaceholder";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import JobDependency from "./JobDependencies";
import TraciumLogo from "./tracium_logo.png";


export default function App() {
  const [filters, setFilters] = useState({
    productName: "",
    startDate: "",
    startHour: "",
    endDate: "",
    endHour: "",
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedStartDateHour, setSelectedStartDateHour] = useState(null);
  const [selectedEndDateHour, setSelectedEndDateHour] = useState(null);

  // 🔴 new state to toggle between Graph & AdHoc API
  const [selectedView, setSelectedView] = useState("graph");

  const handleLoadGraph = () => {
    const { productName, startDate, startHour, endDate, endHour } = filters;

    if (selectedView!='jobDependency' && (!productName || !startDate || !startHour || !endDate || !endHour)) {
      toast.warning("Please provide all inputs", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      return;
    }

    setSelectedProduct(productName);
    setSelectedStartDateHour(startDate + "-" + startHour);
    setSelectedEndDateHour(endDate + "-" + endHour);
  };

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "220px",
          background: "linear-gradient(135deg,rgb(231, 233, 224) 0%,rgb(218, 218, 229) 25%,rgb(219, 210, 244) 75%,rgb(163, 179, 193) 100%)",
          color: "black",
          display: "flex",
          flexDirection: "column",
          padding: "20px",
        }}
      >
        <h2 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "bold" }}>
          {/* Dashboard */}
          <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src={TraciumLogo}
            alt="Tracium Logo"
            style={{
              width: "auto",             // fixed base width
              height: "auto",             // keep aspect ratio
              maxWidth: "100%",           // responsive
              marginRight: 12,            // spacing
              borderRadius: 8,
              objectFit: "contain",
              transition: "transform 0.3s ease-in-out",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
          </div>
        </h2>

        <button
          onClick={() => setSelectedView("graph")}
          style={{
            background: selectedView === "graph" ? "#3b82f6" : "transparent",
            color: "black",
            fontWeight: "bold",
            fontSize: "15px",
            border: "none",
            padding: "10px 12px",
            textAlign: "left",
            marginBottom: "10px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Observium Graph
        </button>

        <button
          onClick={() => setSelectedView("adhoc")}
          style={{
            background: selectedView === "adhoc" ? "#3b82f6" : "transparent",
            color: "black",
            fontWeight: "bold",
            fontSize: "15px",
            border: "none",
            padding: "10px 12px",
            textAlign: "left",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          AdHoc API
        </button>

        <button
          onClick={() => window.open(`${process.env.REACT_APP_DISCREPANCY_CHECKER_URL}`, "_blank")}
          style={{
            background: selectedView === "discrepancy-checker" ? "#3b82f6" : "transparent",
            color: "black",
            fontWeight: "bold",
            fontSize: "15px",
            border: "none",
            padding: "10px 12px",
            textAlign: "left",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Observium Discrepancy Checker
        </button>

        <button
          onClick={() => setSelectedView("jobDependency")}
          style={{
            background: selectedView === "jobDependency" ? "#3b82f6" : "transparent",
            color: "black",
            fontWeight: "bold",
            fontSize: "15px",
            border: "none",
            padding: "10px 12px",
            textAlign: "left",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Job Details
        </button>
      </div>

      <div style={{ flex: 1, background: "#f9fafb", overflow: "hidden" }}>
        {/* <Header /> */}
        <Selector
          filters={filters}
          setFilters={setFilters}
          onLoadGraph={handleLoadGraph}
        />

        {(() => {
          if (selectedView === "graph") {
            if (selectedProduct && (selectedStartDateHour.length)>7 && (selectedEndDateHour.length)>7) {
              return (
                <Graph
                  productName={selectedProduct}
                  startDate={selectedStartDateHour}
                  endDate={selectedEndDateHour}
                />
              );
            } else {
              return <DynamicSVGPlaceholderWithEdges />;
            }
          } else if (selectedView === "adhoc") {
            if (selectedProduct && (selectedStartDateHour.length)>7 && (selectedEndDateHour.length)>7) {
              console.log(selectedStartDateHour, selectedEndDateHour)
              return (
                <AdHocAPI
                  productName={selectedProduct}
                  startDate={selectedStartDateHour}
                  endDate={selectedEndDateHour}
                />
              );
            } else {
              return <DynamicSVGPlaceholderWithEdges />;
            }
          } else {
            if (selectedProduct) {
              return (
                <JobDependency
                  productName={selectedProduct}
                />
              );
            } else {
              return <DynamicSVGPlaceholderWithEdges />;
            }
          }
        })()}

        <ToastContainer />
      </div>
    </div>
  );
}
