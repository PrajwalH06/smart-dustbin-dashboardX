import React from "react";

function Alerts({ fillLevel, batteryPercent, fireStatus }) {
  const alerts = [];

  if (fireStatus) {
    alerts.push({
      id: "fire",
      message: "🔥 FIRE DETECTED! Immediate action required!",
    });
  }

  if (fillLevel > 85) {
    alerts.push({
      id: "fill",
      message: "⚠️ Dustbin is almost full! Please empty soon.",
    });
  }

  if (batteryPercent < 20) {
    alerts.push({
      id: "battery",
      message: "🔋 Low battery! Please charge or replace battery.",
    });
  }

  return (
    <div id="alertsContainer">
      {alerts.length > 0 ? (
        alerts.map((alert) => (
          <div key={alert.id} className="alert">
            {alert.message}
          </div>
        ))
      ) : (
        <div style={{ padding: "10px", color: "#155724" }}>
          ✅ No critical alerts.
        </div>
      )}
    </div>
  );
}

export default Alerts;
