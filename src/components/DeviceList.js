import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, query, orderByKey, limitToLast, get } from "firebase/database";
import SettingsModal from "./SettingsModal";
import "./DeviceList.css";

function DeviceList({ onSelectDevice, onLogout }) {
  const [showSettings, setShowSettings] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    name: "Device 1",
    location: "Main Building",
    mapsLink: "",
  });
  const [devices, setDevices] = useState([
    {
      id: 1,
      name: "Device 1",
      location: "Main Building",
      status: "offline",
      lastUpdated: "Loading...",
      fillLevel: 0,
      battery: 0,
      fireStatus: false, // Initialize fireStatus
    },
  ]);

  // Load device info from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("deviceInfo");
    if (saved) {
      try {
        const info = JSON.parse(saved);
        setDeviceInfo(info);

        // Update devices array with saved info
        setDevices((prev) =>
          prev.map((device) => ({
            ...device,
            name: info.name,
            location: info.location,
          }))
        );
      } catch (error) {
        console.error("Error parsing device info:", error);
      }
    }
  }, []);

  // Listen for device info updates from App.js
  useEffect(() => {
    const handleDeviceInfoUpdate = (e) => {
      if (e.detail) {
        setDeviceInfo(e.detail);
        setDevices((prev) =>
          prev.map((device) => ({
            ...device,
            name: e.detail.name,
            location: e.detail.location,
          }))
        );
      }
    };

    window.addEventListener("deviceInfoUpdated", handleDeviceInfoUpdate);

    return () => {
      window.removeEventListener("deviceInfoUpdated", handleDeviceInfoUpdate);
    };
  }, []);

  // Fetch real data from Firebase
  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        // NOTE: This logic fetches data for ONE device (from the global '/history' path).
        // In a real multi-device scenario, this would loop through device IDs
        // and fetch from paths like /devices/{deviceId}/latest.
        const historyRef = ref(database, "bins/BIN_001/history");
        const latestQuery = query(historyRef, orderByKey(), limitToLast(1));
        const snapshot = await get(latestQuery);

        if (snapshot.exists()) {
          const data = Object.values(snapshot.val())[0];
          const updateTime = new Date(data.ts || Date.now());
          const now = Date.now();
          const diffMinutes = Math.floor((now - updateTime.getTime()) / 60000);

          // Check if device is offline (more than 5 minutes)
          const isOnline = diffMinutes < 5;

          let timeAgo = "just now";
          if (diffMinutes > 0) {
            if (diffMinutes < 60) {
              timeAgo =
                diffMinutes === 1 ? "1 min ago" : `${diffMinutes} mins ago`;
            } else {
              const hours = Math.floor(diffMinutes / 60);
              timeAgo = hours === 1 ? "1 hour ago" : `${hours} hours ago`;
            }
          }

          setDevices((prev) =>
            prev.map((device) => ({
              ...device,
              status: isOnline ? "online" : "offline",
              lastUpdated: timeAgo,
              fillLevel: data.fill_level || 0,
              battery: data.battery_percent || 0,
              fireStatus: data.fire_status || false, // Fetch fire status
            }))
          );
        } else {
          // No data in Firebase
          setDevices((prev) =>
            prev.map((device) => ({
              ...device,
              status: "offline",
              lastUpdated: "No data",
              fireStatus: false,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching device data:", error);
        setDevices((prev) =>
          prev.map((device) => ({
            ...device,
            status: "offline",
            lastUpdated: "Connection error",
            fireStatus: false,
          }))
        );
      }
    };

    fetchDeviceData();

    // Refresh every 10 seconds
    const interval = setInterval(fetchDeviceData, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = (updatedDevice) => {
    setDeviceInfo(updatedDevice);
    setShowSettings(false);
    localStorage.setItem("deviceInfo", JSON.stringify(updatedDevice));

    // Update devices array immediately
    setDevices((prev) =>
      prev.map((device) => ({
        ...device,
        name: updatedDevice.name,
        location: updatedDevice.location,
      }))
    );

    // Dispatch custom event to sync with App.js
    window.dispatchEvent(
      new CustomEvent("deviceInfoUpdated", {
        detail: updatedDevice,
      })
    );
  };

  const openLocation = (mapsLink) => {
    if (mapsLink) {
      window.open(mapsLink, "_blank");
    }
  };

  return (
    <div className="device-list-container">
      {showSettings && (
        <SettingsModal
          device={deviceInfo}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
        />
      )}

      <div className="device-list-wrapper">
        <header className="device-list-header">
          <div className="header-info">
            <h1>🗑️ Smart Dustbin System</h1>
            <p>Manage and monitor all your smart dustbins</p>
          </div>
          <button onClick={onLogout} className="btn-logout-devices">
            Logout
          </button>
        </header>

        <div className="devices-grid">
          {devices.map((device) => (
            <div key={device.id} className="device-card">
              <div className="device-card-header">
                <div className="device-icon-large">
                  <span>🗑️</span>
                </div>
                <div className="header-right">
                  {/* --- NEW FIRE STATUS INDICATOR --- */}
                  <span
                    className={`fire-status-badge ${
                      device.fireStatus ? "alert" : "safe"
                    }`}
                    title={
                      device.fireStatus ? "Fire Detected" : "No Fire Alert"
                    }
                  >
                    {device.fireStatus ? "🔥 ALERT" : "✔️ SAFE"}
                  </span>

                  {/* --- EXISTING ONLINE/OFFLINE STATUS --- */}
                  <span className={`status-badge ${device.status}`}>
                    <span className="status-dot"></span>
                    {device.status === "online" ? "Online" : "Offline"}
                  </span>

                  <button
                    className="btn-settings-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSettings(true);
                    }}
                    title="Settings"
                  >
                    ⚙️
                  </button>
                </div>
              </div>

              <div
                className="device-info"
                onClick={() => onSelectDevice(device.id)}
              >
                <h2>{device.name}</h2>
                {deviceInfo.mapsLink ? (
                  <button
                    className="device-location-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLocation(deviceInfo.mapsLink);
                    }}
                  >
                    📍 {device.location}
                  </button>
                ) : (
                  <p className="device-location">📍 {device.location}</p>
                )}
              </div>

              <div
                className="device-stats"
                onClick={() => onSelectDevice(device.id)}
              >
                <div className="device-stat">
                  <span className="stat-icon">📊</span>
                  <div>
                    <div className="stat-label">Fill Level</div>
                    <div className="stat-value">{device.fillLevel}%</div>
                  </div>
                </div>
                <div className="device-stat">
                  <span className="stat-icon">🔋</span>
                  <div>
                    <div className="stat-label">Battery</div>
                    <div className="stat-value">{device.battery}%</div>
                  </div>
                </div>
              </div>

              <div
                className="device-footer"
                onClick={() => onSelectDevice(device.id)}
              >
                <span className="device-updated">
                  Updated: {device.lastUpdated}
                </span>
                <span className="device-arrow">→</span>
              </div>
            </div>
          ))}

          <div className="add-device-card">
            <div className="add-device-icon">+</div>
            <h3>Add New Device</h3>
            <p>Connect a new smart dustbin</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeviceList;
