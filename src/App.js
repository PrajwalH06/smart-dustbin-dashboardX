import React, { useState, useEffect } from "react";
import { database } from "./firebase";
import { ref, query, orderByKey, limitToLast, get } from "firebase/database";
import Login from "./components/Login";
import DeviceList from "./components/DeviceList";
import SettingsModal from "./components/SettingsModal";
import FillGauge from "./components/FillGauge";
import BatteryIndicator from "./components/BatteryIndicator";
import FireStatus from "./components/FireStatus";
import CurrentStatus from "./components/CurrentStatus"; // IMPORTED
import HistoryChart from "./components/HistoryChart";
import Alerts from "./components/Alerts";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // 🔄 New State for Refresh Animation
  const [deviceInfo, setDeviceInfo] = useState({
    name: "Device 1",
    location: "Main Building",
    mapsLink: "",
    // Add defaults for the settings we want to display
    powerMode: "normal",
    autoSleepEnabled: false,
    flameEnabled: true,
    ultrasonicEnabled: true,
    bootSmsEnabled: true,
  });
  const [currentData, setCurrentData] = useState({
    fill_level: 0,
    battery_percent: 0,
    fire_status: false,
    ts: Date.now(),
  });
  const [historyData, setHistoryData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");

  // 1. Initial login check
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  // 2. Dark Mode Management
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(savedMode);

    if (savedMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", newMode);
    if (newMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  };

  // 3. Device Info Management
  useEffect(() => {
    const loadDeviceInfo = () => {
      const saved = localStorage.getItem("deviceInfo");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setDeviceInfo(parsed);
        } catch (error) {
          console.error("Error parsing device info:", error);
        }
      }
    };

    loadDeviceInfo();

    const handleDeviceInfoUpdate = (e) => {
      if (e.detail) {
        setDeviceInfo(e.detail);
      } else {
        loadDeviceInfo();
      }
    };

    window.addEventListener("deviceInfoUpdated", handleDeviceInfoUpdate);

    return () => {
      window.removeEventListener("deviceInfoUpdated", handleDeviceInfoUpdate);
    };
  }, []);

  // Authentication Handlers
  const handleLogin = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
    setSelectedDevice(null);
  };

  const handleSelectDevice = (deviceId) => {
    setSelectedDevice(deviceId);
  };

  const handleBackToDevices = () => {
    setSelectedDevice(null);
  };

  // New function to update settings WITHOUT closing the modal
  const handleSettingUpdate = (updatedSetting) => {
    const newDeviceInfo = { ...deviceInfo, ...updatedSetting };
    setDeviceInfo(newDeviceInfo);
    localStorage.setItem("deviceInfo", JSON.stringify(newDeviceInfo));

    // Also dispatch event to keep DeviceList in sync if it's open
    window.dispatchEvent(
      new CustomEvent("deviceInfoUpdated", {
        detail: newDeviceInfo,
      })
    );
  };

  // This function is for the "Device Info" tab and WILL close the modal
  const handleSaveDeviceInfo = (updatedDevice) => {
    handleSettingUpdate(updatedDevice); // Use the new function to do the update
    setShowSettings(false);
  };

  const openLocation = () => {
    if (deviceInfo.mapsLink) {
      window.open(deviceInfo.mapsLink, "_blank");
    }
  };

  // Data Fetching Functions
  const fetchCurrentStatus = async () => {
    try {
      const historyRef = ref(database, "/bins/BIN_001/history");
      const latestQuery = query(historyRef, orderByKey(), limitToLast(1));
      const snapshot = await get(latestQuery);

      if (snapshot.exists()) {
        const data = Object.values(snapshot.val())[0];
        setCurrentData({
          fill_level: data.fill_level || 0,
          battery_percent: data.battery_percent || 0,
          fire_status: data.fire_status || false,
          ts: data.ts || Date.now(),
        });

        const updateTime = new Date(data.ts || Date.now()).toLocaleString();
        setLastUpdated(updateTime);
      }
    } catch (error) {
      console.error("Error fetching current status:", error);
      setLastUpdated("Connection Error");
    }
  };

  const fetchHistoryData = async (hours = 1) => {
    try {
      const historyRef = ref(database, "/bins/BIN_001/history");
      const historyQuery = query(historyRef, orderByKey(), limitToLast(100));
      const snapshot = await get(historyQuery);

      if (snapshot.exists()) {
        const nowMs = Date.now();
        const startTimeMs = nowMs - hours * 60 * 60 * 1000;

        const history = [];
        snapshot.forEach((child) => {
          const entry = child.val();
          const entryTs = entry.ts || 0;

          if (entryTs >= startTimeMs) {
            history.push({
              ...entry,
              timestamp_iso: new Date(entryTs).toISOString(),
            });
          }
        });

        history.sort((a, b) => a.ts - b.ts);
        setHistoryData(history);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  // 🔄 Manual Refresh Handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchCurrentStatus(), fetchHistoryData()]);
    } catch (error) {
      console.error("Error during manual refresh:", error);
    } finally {
      // Keep spinning animation for at least 500ms for visual feedback
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  useEffect(() => {
    if (isLoggedIn && selectedDevice) {
      fetchCurrentStatus();
      fetchHistoryData();

      const interval = setInterval(() => {
        fetchCurrentStatus();
        fetchHistoryData();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [isLoggedIn, selectedDevice]);

  // Helper functions
  const getStatusBadge = () => {
    if (currentData.fill_level > 85)
      return { text: "Critical", color: "#f44336" };
    if (currentData.fill_level > 60)
      return { text: "Warning", color: "#ff9800" };
    return { text: "Normal", color: "#4caf50" };
  };

  const getEstimatedTime = () => {
    if (currentData.fill_level >= 100) return "Full - Empty Now!";
    if (currentData.fill_level >= 85) return "~2-4 hours";
    if (currentData.fill_level >= 60) return "~8-12 hours";
    if (currentData.fill_level >= 30) return "~1-2 days";
    return "~3+ days";
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (!selectedDevice) {
    return (
      <DeviceList onSelectDevice={handleSelectDevice} onLogout={handleLogout} />
    );
  }

  const statusBadge = getStatusBadge();

  return (
    <div className="App">
      {showSettings && (
        <SettingsModal
          device={deviceInfo}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveDeviceInfo} // This closes the modal
          onSettingUpdate={handleSettingUpdate} // This DOES NOT close the modal
        />
      )}

      <div className="container">
        <header className="dashboard-header">
          <div className="header-left">
            <button onClick={handleBackToDevices} className="btn-back">
              ← Back
            </button>
            <div className="header-title">
              <h1>🗑️ {deviceInfo.name}</h1>
              <div className="status-info">
                <span
                  className="status-badge"
                  style={{ background: statusBadge.color }}
                >
                  ● {statusBadge.text}
                </span>
                {deviceInfo.mapsLink ? (
                  <button
                    onClick={openLocation}
                    className="location-link"
                    title="Open in Google Maps"
                  >
                    📍 {deviceInfo.location}
                  </button>
                ) : (
                  <span className="last-updated">📍 {deviceInfo.location}</span>
                )}
                <span className="last-updated">
                  🕐 {lastUpdated || "Loading..."}
                </span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            {/* 🔄 Refresh Button */}
            <button
              onClick={handleManualRefresh}
              className={`btn-refresh ${isRefreshing ? "spinning" : ""}`}
              disabled={isRefreshing}
              title="Refresh Data"
            >
              🔄
            </button>
            {/* 🌙 Dark Mode Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className="dark-mode-toggle-btn"
              title={
                isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
              }
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="btn-settings"
            >
              ⚙️ Settings
            </button>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </header>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#e3f2fd" }}>
              📊
            </div>
            <div className="stat-content">
              <div className="stat-label">Fill Level</div>
              <div className="stat-value">{currentData.fill_level}%</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#fff3e0" }}>
              🔋
            </div>
            <div className="stat-content">
              <div className="stat-label">Battery</div>
              <div className="stat-value">{currentData.battery_percent}%</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#e8f5e9" }}>
              ⏱️
            </div>
            <div className="stat-content">
              <div className="stat-label">Est. Time to Full</div>
              <div className="stat-value-small">{getEstimatedTime()}</div>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{
                background: currentData.fire_status ? "#ffebee" : "#e8f5e9",
              }}
            >
              {currentData.fire_status ? "🔥" : "✅"}
            </div>
            <div className="stat-content">
              <div className="stat-label">Fire Status</div>
              <div className="stat-value-small">
                {currentData.fire_status ? "Detected" : "Safe"}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header">
              <h2>Fill Level Monitor</h2>
              <span className="card-badge">{currentData.fill_level}%</span>
            </div>
            <FillGauge
              fillLevel={currentData.fill_level}
              isDarkMode={isDarkMode}
            />
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Battery Status</h2>
              <span className="card-badge">{currentData.battery_percent}%</span>
            </div>
            <BatteryIndicator
              batteryPercent={currentData.battery_percent}
              isDarkMode={isDarkMode}
            />
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Fire Detection</h2>
              <span
                className={`card-badge ${
                  currentData.fire_status ? "danger" : "success"
                }`}
              >
                {currentData.fire_status ? "Alert" : "Safe"}
              </span>
            </div>
            <FireStatus
              fireStatus={currentData.fire_status}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* NEW CARD ADDED HERE */}
          <div className="card">
            <div className="card-header">
              <h2>Device Configuration</h2>
              <span className="card-icon">⚙️</span>
            </div>
            <CurrentStatus deviceInfo={deviceInfo} />
          </div>

          {/* ALERTS CARD MOVED AND MODIFIED HERE */}
          <div
            className="card alerts-card full-width"
            style={{ minHeight: "150px" }}
          >
            <div className="card-header">
              <h2>System Alerts</h2>
              <span className="card-icon">🔔</span>
            </div>
            <Alerts
              fillLevel={currentData.fill_level}
              batteryPercent={currentData.battery_percent}
              fireStatus={currentData.fire_status}
              isDarkMode={isDarkMode}
            />
          </div>

          <div className="card full-width chart-card">
            <div className="card-header">
              <h2>Fill Level History</h2>
              <div className="chart-controls">
                <span className="chart-period">Last Hour</span>
              </div>
            </div>
            <HistoryChart historyData={historyData} isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
