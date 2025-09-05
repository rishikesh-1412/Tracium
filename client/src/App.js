import React, { useState } from "react";
import Header from "./Header";
import Graph from "./Graph";
import Selector from "./Input";
import DynamicSVGPlaceholderWithEdges from "./SVGPlaceholder";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  const handleLoadGraph = () => {
    // Check if all 5 inputs are selected
    const { productName, startDate, startHour, endDate, endHour } = filters;

    if (!productName || !startDate || !startHour || !endDate || !endHour) {
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
    <div style={{ width: "100vw", height: "100vh" }}>
      <Header/>
      <Selector
        filters={filters}
        setFilters={setFilters}
        onLoadGraph={handleLoadGraph}
      />

      {selectedProduct ? (
        <Graph productName={selectedProduct} startDate={selectedStartDateHour} endDate={selectedEndDateHour} />
      ) : (
        <DynamicSVGPlaceholderWithEdges />
      )}

      <ToastContainer />
    </div>
  );
}

