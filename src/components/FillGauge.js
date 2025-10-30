import React from "react";
import "./FillGauge.css";

function FillGauge({ fillLevel = 50 }) {
  const level = Math.max(0, Math.min(100, Math.floor(fillLevel)));

  // Determine the primary color class based on fill level
  const getFillColorClass = (level) => {
    if (level > 85) return "fill-color-red";
    if (level > 60) return "fill-color-yellow";
    return "fill-color-green";
  };

  const getStatusText = (level) => {
    if (level === 100) return "FULL";
    if (level > 85) return "ALMOST FULL";
    if (level > 60) return "HALF FULL";
    if (level > 30) return "LOW";
    return "EMPTY";
  };

  const fillColorClass = getFillColorClass(level);
  const statusText = getStatusText(level);

  // Dynamic class to simulate the lid opening when full
  const lidClassName = level === 100 ? "dustbin-lid lid-full" : "dustbin-lid";

  return (
    <div className="gauge-container">
      <div className="gauge__card">
        {/* Data Card Section (Left) - This is the PRIMARY data display location */}
        <div className="gauge__data">
          <p className="gauge__text">Dustbin Fill</p>
          <h1 className="gauge__percentage">{level}%</h1>
          <p className="gauge__status">{statusText}</p>
        </div>

        {/* Dustbin Visual Container (Right) */}
        <div className="dustbin-container">
          {/* Dustbin Lid */}
          <div className={lidClassName}>
            <div className="lid-handle"></div>
          </div>

          {/* Dustbin Body */}
          <div className="dustbin-body">
            {/* Filled waste section */}
            <div
              className={`waste-fill ${fillColorClass}`}
              style={{ height: `${level}%` }}
            >
              {/* Subtle waste texture and wave effect */}
              {level > 0 && <div className="waste-fill-pattern"></div>}
              {/* The wave effect uses the ::before pseudo-element in CSS */}
            </div>

            {/* NOTE: Removed the fill-level-overlay to fix the display duplication */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FillGauge;
