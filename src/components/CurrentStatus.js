import React from "react";
import "./CurrentStatus.css";

// Helper to render a status line
const StatusLine = ({ icon, label, value, isEnabled }) => {
  let valueText;
  let statusClass;

  if (value !== undefined) {
    // Case 1: This is for "Power Mode" which has a custom string value
    valueText = value;
    // Use isEnabled to determine color: green for "Normal", yellow for "Low Power"
    statusClass = isEnabled ? "status-enabled" : "status-warning";
  } else {
    // Case 2: This is for boolean toggles (Enabled/Disabled)
    valueText = isEnabled ? "Enabled" : "Disabled";
    statusClass = isEnabled ? "status-enabled" : "status-disabled";
  }

  return (
    <li className="status-item">
      <span className="status-label">
        <span className="status-icon">{icon}</span>
        {label}
      </span>
      <span className={`status-value ${statusClass}`}>{valueText}</span>
    </li>
  );
};

function CurrentStatus({ deviceInfo }) {
  if (!deviceInfo) {
    return (
      <div className="current-status-container">
        <p>Loading device configuration...</p>
      </div>
    );
  }

  const {
    powerMode,
    autoSleepEnabled,
    flameEnabled,
    ultrasonicEnabled,
    bootSmsEnabled,
  } = deviceInfo;

  return (
    <div className="current-status-container">
      <ul className="status-list">
        <StatusLine
          icon="⚡️"
          label="Power Mode"
          value={powerMode === "low_power" ? "Low Power" : "Normal"}
          isEnabled={powerMode === "normal"}
        />
        <StatusLine
          icon="🔋"
          label="Auto-Sleep"
          isEnabled={autoSleepEnabled}
        />
        <StatusLine icon="🔥" label="Flame Sensor" isEnabled={flameEnabled} />
        <StatusLine
          icon="📏"
          label="Ultrasonic Sensor"
          isEnabled={ultrasonicEnabled}
        />
        <StatusLine icon="📱" label="Boot SMS" isEnabled={bootSmsEnabled} />
      </ul>
    </div>
  );
}

export default CurrentStatus;
