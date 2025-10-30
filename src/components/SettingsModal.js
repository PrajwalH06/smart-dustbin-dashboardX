import React, { useState } from "react";
import { database } from "../firebase";
import { ref, set } from "firebase/database";
import "./SettingsModal.css";

function SettingsModal({ device, onClose, onSave, onSettingUpdate }) {
  // Device Info States
  const [deviceName, setDeviceName] = useState(device.name || "Device 1");
  const [location, setLocation] = useState(device.location || "Main Building");
  const [mapsLink, setMapsLink] = useState(device.mapsLink || "");

  // Tab State
  const [activeTab, setActiveTab] = useState("device"); // "device" or "remote"

  // Remote Control States
  const [updateFrequency, setUpdateFrequency] = useState(device.updateFrequency || 60);
  const [powerMode, setPowerMode] = useState(device.powerMode || "normal");
  const [sleepDuration, setSleepDuration] = useState(device.sleepDuration || 300);
  const [autoSleepEnabled, setAutoSleepEnabled] = useState(device.autoSleepEnabled || false);
  const [autoSleepThreshold, setAutoSleepThreshold] = useState(device.autoSleepThreshold || 20);
  const [autoSleepDuration, setAutoSleepDuration] = useState(device.autoSleepDuration || 600);
  const [binDepth, setBinDepth] = useState(device.binDepth || 50);
  const [ultrasonicMin, setUltrasonicMin] = useState(device.ultrasonicMin || 2);
  const [ultrasonicMax, setUltrasonicMax] = useState(device.ultrasonicMax || 400);
  const [bootSmsEnabled, setBootSmsEnabled] = useState(device.bootSmsEnabled !== undefined ? device.bootSmsEnabled : true);
  const [flameEnabled, setFlameEnabled] = useState(device.flameEnabled !== undefined ? device.flameEnabled : true);
  const [ultrasonicEnabled, setUltrasonicEnabled] = useState(device.ultrasonicEnabled !== undefined ? device.ultrasonicEnabled : true);
  const [commandStatus, setCommandStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Add state for disabling all Apply buttons and per-button countdown
  const [activeCooldown, setActiveCooldown] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const startCooldown = (key) => {
    setActiveCooldown(key);
    setCountdown(30);
    let interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setActiveCooldown(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleApplyWithCooldown = async (handler, key) => {
    if (activeCooldown) return;
    await handler();
    startCooldown(key);
  };

  // Device Info Handlers
  const handleSave = () => {
    const updatedDevice = {
      name: deviceName,
      location: location,
      mapsLink: mapsLink,
      flameEnabled: flameEnabled,
      ultrasonicEnabled: ultrasonicEnabled,
      bootSmsEnabled: bootSmsEnabled,
      powerMode: powerMode,
      autoSleepEnabled: autoSleepEnabled,
      // add other settings if needed
    };
    onSave(updatedDevice);
  };

  const openInMaps = () => {
    if (mapsLink) {
      window.open(mapsLink, "_blank");
    }
  };

  // Helper to update App.js state *after* a command is sent
  const updateSettingInApp = (setting) => {
    // We call onSettingUpdate, which is handleSettingUpdate in App.js
    // This will merge the new setting into the main deviceInfo state
    onSettingUpdate(setting);
  };

  // Send command to Firebase
  const sendCommand = async (commandData, settingToUpdate) => {
    setIsSending(true);
    setCommandStatus("Sending command...");

    try {
      const commandRef = ref(database, "/bins/BIN_001/command");
      await set(commandRef, commandData);

      // If command is successful, update the state in App.js
      if (settingToUpdate) {
        updateSettingInApp(settingToUpdate);
      }

      setCommandStatus(
        "✅ Command sent successfully! ESP32 will process it within 30 seconds."
      );

      setTimeout(() => {
        setCommandStatus("");
      }, 15000);
    } catch (error) {
      console.error("Error sending command:", error);
      setCommandStatus("❌ Error sending command. Check console.");
    } finally {
      setIsSending(false);
    }
  };

  // Command Handlers
  const handleReboot = () => {
    if (window.confirm("Are you sure you want to reboot the device?")) {
      sendCommand({ action: "reboot" }, null); // No state to save
    }
  };

  const handleForceUpdate = () => {
    sendCommand({ action: "force_update" }, null); // No state to save
  };

  const handleSetInterval = () => {
    if (updateFrequency < 10 || updateFrequency > 21600) {
      alert(
        "Update frequency must be between 10 seconds and 6 hours (21600 seconds)"
      );
      return;
    }
    sendCommand({
      action: "set_interval",
      value: updateFrequency,
    },
    { updateFrequency: updateFrequency });
  };

  const handleSetPowerMode = () => {
    if (powerMode === "low_power") {
      if (sleepDuration < 60 || sleepDuration > 43200) {
        alert(
          "Sleep duration must be between 60 seconds and 12 hours (43200 seconds)"
        );
        return;
      }
      sendCommand({
        action: "set_power_mode",
        mode: "low_power",
        sleep_duration_sec: sleepDuration,
      },
      { powerMode: "low_power", sleepDuration: sleepDuration });
    } else {
      sendCommand({
        action: "set_power_mode",
        mode: "normal",
      },
      { powerMode: "normal" });
    }
  };

  const handleSetBinDepth = () => {
    if (binDepth < 5 || binDepth > 500) {
      alert("Bin depth must be between 5 and 500 cm");
      return;
    }
    sendCommand({
      action: "set_bin_depth",
      value_cm: binDepth,
    },
    { binDepth: binDepth });
  };

  const handleSetUltrasonicParams = () => {
    if (
      ultrasonicMin < 0 ||
      ultrasonicMax > 500 ||
      ultrasonicMin >= ultrasonicMax
    ) {
      alert(
        "Invalid ultrasonic range. Min must be >= 0, Max <= 500, and Min < Max"
      );
      return;
    }
    sendCommand({
      action: "set_ultrasonic_params",
      min_reading_cm: ultrasonicMin,
      max_range_cm: ultrasonicMax,
    },
    { ultrasonicMin: ultrasonicMin, ultrasonicMax: ultrasonicMax });
  };

  const handleSetBootSms = () => {
    sendCommand({
      action: "set_boot_sms",
      enabled: bootSmsEnabled,
    },
    { bootSmsEnabled: bootSmsEnabled });
  };

  const handleSetSensorState = (sensor) => {
    const enabled = sensor === "flame" ? flameEnabled : ultrasonicEnabled;
    const key = sensor === "flame" ? "flameEnabled" : "ultrasonicEnabled";
    sendCommand({
      action: "set_sensor_state",
      sensor: sensor,
      enabled: enabled,
    },
    { [key]: enabled });
  };

  const handleSetAutoSleep = () => {
    if (autoSleepThreshold < 0 || autoSleepThreshold > 100) {
      alert("Battery threshold must be between 0 and 100%");
      return;
    }
    if (autoSleepDuration < 60 || autoSleepDuration > 43200) {
      alert(
        "Sleep duration must be between 60 seconds and 12 hours (43200 seconds)"
      );
      return;
    }
    sendCommand({
      action: "set_auto_sleep",
      enabled: autoSleepEnabled,
      threshold_percent: autoSleepThreshold,
      sleep_duration_sec: autoSleepDuration,
    },
    { 
      autoSleepEnabled: autoSleepEnabled,
      autoSleepThreshold: autoSleepThreshold,
      autoSleepDuration: autoSleepDuration,
    });
  };

  const handleResetCallFlag = () => {
    if (
      window.confirm(
        "Reset fire call flag? This will allow the system to make another emergency call if fire is detected."
      )
    ) {
      sendCommand({ action: "reset_call_flag" }, null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Settings</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === "device" ? "active" : ""}`}
            onClick={() => setActiveTab("device")}
          >
            📱 Device Info
          </button>
          <button
            className={`tab-btn ${activeTab === "remote" ? "active" : ""}`}
            onClick={() => setActiveTab("remote")}
          >
            🎮 Remote Control
          </button>
        </div>

        {/* Device Info Tab */}
        {activeTab === "device" && (
          <div className="modal-body">
            <div className="form-section">
              <label>Device Name</label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Enter device name"
              />
            </div>

            <div className="form-section">
              <label>Location Name</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location name (e.g., Main Building)"
              />
            </div>

            <div className="form-section">
              <label>Google Maps Link</label>
              <div className="input-with-button">
                <input
                  type="url"
                  value={mapsLink}
                  onChange={(e) => setMapsLink(e.target.value)}
                  placeholder="Paste Google Maps link here"
                />
                {mapsLink && (
                  <button
                    type="button"
                    className="btn-open-maps"
                    onClick={openInMaps}
                    title="Open in Google Maps"
                  >
                    🗺️
                  </button>
                )}
              </div>
              <p className="help-text">
                💡 Open Google Maps, right-click on location, and select "Share"
                to copy the link
              </p>
            </div>

            {mapsLink && (
              <div className="preview-box">
                <div className="preview-header">📍 Location Preview</div>
                <div className="preview-content">
                  <p>
                    <strong>{deviceName}</strong>
                  </p>
                  <p className="preview-location">{location}</p>
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="preview-link"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Remote Control Tab */}
        {activeTab === "remote" && (
          <div className="modal-body remote-control-panel">
            {commandStatus && (
              <div
                className={`command-status ${
                  commandStatus.includes("✅") ? "success" : "error"
                }`}
              >
                {commandStatus}
              </div>
            )}

            {/* Quick Actions */}
            <div className="control-section">
              <h3>🚀 Quick Actions</h3>
              <div className="button-group">
                <button
                  onClick={() =>
                    handleApplyWithCooldown(handleForceUpdate, "forceUpdate")
                  }
                  className="control-btn primary"
                  disabled={isSending || !!activeCooldown}
                >
                  🔄 Force Update Now
                </button>
                <button
                  onClick={() =>
                    handleApplyWithCooldown(handleReboot, "reboot")
                  }
                  className="control-btn danger"
                  disabled={isSending || !!activeCooldown}
                >
                  🔌 Reboot Device
                </button>
                <button
                  onClick={() =>
                    handleApplyWithCooldown(handleResetCallFlag, "resetCall")
                  }
                  className="control-btn warning"
                  disabled={isSending || !!activeCooldown}
                >
                  🔥 Reset Fire Alert
                </button>
              </div>
              {activeCooldown === "forceUpdate" && (
                <div className="command-status warning">
                  Please wait {countdown} seconds before sending another
                  command.
                </div>
              )}
              {activeCooldown === "reboot" && (
                <div className="command-status warning">
                  Please wait {countdown} seconds before sending another
                  command.
                </div>
              )}
              {activeCooldown === "resetCall" && (
                <div className="command-status warning">
                  Please wait {countdown} seconds before sending another
                  command.
                </div>
              )}
            </div>

            {/* Update Frequency */}
            <div className="control-section">
              <h3>⏱️ Update Frequency</h3>
              <div className="form-group-inline">
                <label>Send data every</label>
                <input
                  type="number"
                  value={updateFrequency}
                  onChange={(e) => setUpdateFrequency(parseInt(e.target.value))}
                  min="10"
                  max="21600"
                  className="input-number"
                />
                <span>seconds</span>
                <button
                  onClick={() =>
                    handleApplyWithCooldown(handleSetInterval, "interval")
                  }
                  className="control-btn-small"
                  disabled={isSending || !!activeCooldown}
                >
                  Apply
                </button>
              </div>
              {activeCooldown === "interval" && (
                <div className="command-status warning">
                  Please wait {countdown} seconds before sending another
                  command.
                </div>
              )}
              <small className="hint">Range: 10s - 6 hours (21600s)</small>
            </div>

            {/* Power Mode */}
            <div className="control-section">
              <h3>⚡ Power Mode</h3>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    value="normal"
                    checked={powerMode === "normal"}
                    onChange={(e) => setPowerMode(e.target.value)}
                  />
                  <span>Normal Mode (Always On)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="low_power"
                    checked={powerMode === "low_power"}
                    onChange={(e) => setPowerMode(e.target.value)}
                  />
                  <span>Low Power Mode (Deep Sleep)</span>
                </label>
              </div>

              {powerMode === "low_power" && (
                <div className="form-group-inline">
                  <label>Sleep Duration</label>
                  <input
                    type="number"
                    value={sleepDuration}
                    onChange={(e) => setSleepDuration(parseInt(e.target.value))}
                    min="60"
                    max="43200"
                    className="input-number"
                  />
                  <span>seconds</span>
                </div>
              )}

              <button
                onClick={() =>
                  handleApplyWithCooldown(handleSetPowerMode, "power")
                }
                className="control-btn primary"
                disabled={isSending || !!activeCooldown}
              >
                Set Power Mode
              </button>
              {activeCooldown === "power" && (
                <div className="command-status warning">
                  Please wait {countdown} seconds before sending another
                  command.
                </div>
              )}
            </div>

            {/* Auto Sleep */}
            <div className="control-section">
              <h3>🔋 Auto Sleep (Battery Saver)</h3>
              <label className="switch-label">
                <span>Enable Auto Sleep when battery is low</span>
                <span className="switch">
                  <input
                    className="switch-input"
                    type="checkbox"
                    checked={autoSleepEnabled}
                    onChange={(e) => setAutoSleepEnabled(e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </span>
              </label>

              {autoSleepEnabled && (
                <>
                  <div className="form-group-inline">
                    <label>Sleep when battery below</label>
                    <input
                      type="number"
                      value={autoSleepThreshold}
                      onChange={(e) =>
                        setAutoSleepThreshold(parseInt(e.target.value))
                      }
                      min="0"
                      max="100"
                      className="input-number"
                    />
                    <span>%</span>
                  </div>
                  <div className="form-group-inline">
                    <label>Sleep Duration</label>
                    <input
                      type="number"
                      value={autoSleepDuration}
                      onChange={(e) =>
                        setAutoSleepDuration(parseInt(e.target.value))
                      }
                      min="60"
                      max="43200"
                      className="input-number"
                    />
                    <span>seconds</span>
                  </div>
                </>
              )}

              <button
                onClick={() =>
                  handleApplyWithCooldown(handleSetAutoSleep, "autoSleep")
                }
                className="control-btn primary"
                disabled={isSending || !!activeCooldown}
              >
                Apply Auto Sleep Settings
              </button>
              {activeCooldown === "autoSleep" && (
                <div className="command-status warning">
                  Please wait {countdown} seconds before sending another
                  command.
                </div>
              )}
            </div>

            {/* Sensor Calibration */}
            <div className="control-section">
              <h3>📏 Sensor Calibration</h3>

              <div className="subsection">
                <h4>Bin Depth</h4>
                <div className="form-group-inline">
                  <label>Actual bin depth</label>
                  <input
                    type="number"
                    value={binDepth}
                    onChange={(e) => setBinDepth(parseInt(e.target.value))}
                    min="5"
                    max="500"
                    className="input-number"
                  />
                  <span>cm</span>
                  <button
                    onClick={() =>
                      handleApplyWithCooldown(handleSetBinDepth, "binDepth")
                    }
                    className="control-btn-small"
                    disabled={isSending || !!activeCooldown}
                  >
                    Apply
                  </button>
                  {activeCooldown === "binDepth" && (
                    <div className="command-status warning">
                      Please wait {countdown} seconds before sending another
                      command.
                    </div>
                  )}
                </div>
              </div>

              <div className="subsection">
                <h4>Ultrasonic Sensor Range</h4>
                <div className="form-group-inline">
                  <label>Min</label>
                  <input
                    type="number"
                    value={ultrasonicMin}
                    onChange={(e) => setUltrasonicMin(parseInt(e.target.value))}
                    min="0"
                    max="500"
                    className="input-number-small"
                  />
                  <span>cm</span>
                  <label>Max</label>
                  <input
                    type="number"
                    value={ultrasonicMax}
                    onChange={(e) => setUltrasonicMax(parseInt(e.target.value))}
                    min="0"
                    max="500"
                    className="input-number-small"
                  />
                  <span>cm</span>
                  <button
                    onClick={() =>
                      handleApplyWithCooldown(
                        handleSetUltrasonicParams,
                        "ultrasonicParams"
                      )
                    }
                    className="control-btn-small"
                    disabled={isSending || !!activeCooldown}
                  >
                    Apply
                  </button>
                  {activeCooldown === "ultrasonicParams" && (
                    <div className="command-status warning">
                      Please wait {countdown} seconds before sending another
                      command.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sensor Enable/Disable */}
            <div className="control-section">
              <h3>🎛️ Sensor Control</h3>

              <div className="sensor-control-item">
                <label className="switch-label">
                  <span>Flame Sensor Enabled</span>
                  <span className="switch">
                    <input
                      className="switch-input"
                      type="checkbox"
                      checked={flameEnabled}
                      onChange={(e) => setFlameEnabled(e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </span>
                </label>
                <button
                  onClick={() =>
                    handleApplyWithCooldown(
                      () => handleSetSensorState("flame"),
                      "flame"
                    )
                  }
                  className="control-btn-small"
                  disabled={isSending || !!activeCooldown}
                >
                  Apply
                </button>
                {activeCooldown === "flame" && (
                  <div className="command-status warning">
                    Please wait {countdown} seconds before sending another
                    command.
                  </div>
                )}
              </div>

              <div className="sensor-control-item">
                <label className="switch-label">
                  <span>Ultrasonic Sensor Enabled</span>
                  <span className="switch">
                    <input
                      className="switch-input"
                      type="checkbox"
                      checked={ultrasonicEnabled}
                      onChange={(e) => setUltrasonicEnabled(e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </span>
                </label>
                <button
                  onClick={() =>
                    handleApplyWithCooldown(
                      () => handleSetSensorState("ultrasonic"),
                      "ultrasonic"
                    )
                  }
                  className="control-btn-small"
                  disabled={isSending || !!activeCooldown}
                >
                  Apply
                </button>
                {activeCooldown === "ultrasonic" && (
                  <div className="command-status warning">
                    Please wait {countdown} seconds before sending another
                    command.
                  </div>
                )}
              </div>

              <div className="sensor-control-item">
                <label className="switch-label">
                  <span>Boot SMS Notification</span>
                  <span className="switch">
                    <input
                      className="switch-input"
                      type="checkbox"
                      checked={bootSmsEnabled}
                      onChange={(e) => setBootSmsEnabled(e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </span>
                </label>
                <button
                  onClick={() =>
                    handleApplyWithCooldown(handleSetBootSms, "bootSms")
                  }
                  className="control-btn-small"
                  disabled={isSending || !!activeCooldown}
                >
                  Apply
                </button>
                {activeCooldown === "bootSms" && (
                  <div className="command-status warning">
                    Please wait {countdown} seconds before sending another
                    command.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsModal;
