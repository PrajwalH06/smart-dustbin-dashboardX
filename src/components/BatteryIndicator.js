import React from "react";
import "./Battery.css";

const getLiquidColorClass = (level) => {
  if (level <= 20) {
    return "color-red";
  } else if (level <= 40) {
    return "color-orange";
  } else if (level <= 80) {
    return "color-yellow";
  } else {
    return "color-green";
  }
};

/**
 * Determines the status text displayed below the main percentage.
 */
const getStatusText = (level) => {
  if (level === 100) return "Charged";
  if (level <= 20) return "Low Battery";
  return "Normal";
};

function BatteryIndicator({ batteryPercent = 75, isCharging = false }) {
  // Ensure level is between 0 and 100
  const level = Math.max(0, Math.min(100, Math.floor(batteryPercent)));

  const liquidClass = getLiquidColorClass(level);
  const statusText = getStatusText(level);

  // Note: The structure is designed for the dashboard's two-column card layout:
  // 1. battery__data (Left)
  // 2. battery-icon-container (Right)

  return (
    <div className="battery-container">
      {/* 1. Data Section (Left) - Primary numerical display */}
      <div className="battery__data">
        <p className="battery__text">Charge Status</p>
        <h1 className="battery__percentage">{level}%</h1>
        <p className="battery__status">
          {statusText}
          {/* Add charging icon if needed */}
        </p>
      </div>

      {/* 2. Square Icon Visual (Right) - The new icon */}
      <div className="battery-icon-container">
        <div className="battery-icon-border">
          <div
            className={`battery-level-fill ${liquidClass}`}
            style={{ height: `${level}%` }} // Key: Height is used for vertical filling
          >
            {/* Percentage text overlaid on the icon */}
            <div className="battery-value-overlay">{level}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BatteryIndicator;
