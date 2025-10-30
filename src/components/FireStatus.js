import React from "react";
import "./Fire.css";

function FireStatus({ fireStatus }) {
  return (
    <div
      className={`fire-status-container ${
        fireStatus ? "fire-detected" : "no-fire"
      }`}
    >
      {fireStatus ? (
        // Fire Detected State
        <div className="fire-alert">
          <div className="fire-icon-wrapper">
            <div className="fire-icon fire-animate">
              <div className="flame flame-main"></div>
              <div className="flame flame-left"></div>
              <div className="flame flame-right"></div>
            </div>
          </div>

          <div className="fire-text">
            <div className="fire-title">🔥 FIRE DETECTED!</div>
            <div className="fire-subtitle">IMMEDIATE ACTION REQUIRED</div>
          </div>

          {/* Pulsing danger circles */}
          <div className="danger-pulse pulse-1"></div>
          <div className="danger-pulse pulse-2"></div>
          <div className="danger-pulse pulse-3"></div>
        </div>
      ) : (
        // Safe State
        <div className="safe-status">
          {/* Moved illustration and message above and centered */}
          <div className="safe-bg-illustration safe-bg-illustration-top">
            <svg width="120" height="60" viewBox="0 0 120 60" fill="none">
              <ellipse cx="60" cy="50" rx="40" ry="8" fill="#e3fcec" />
              <ellipse cx="40" cy="40" rx="10" ry="4" fill="#e3fcec" />
              <ellipse cx="80" cy="42" rx="12" ry="5" fill="#e3fcec" />
            </svg>
            <div className="safe-message">
              Everything is safe and monitored. 👍
            </div>
          </div>
          <div className="safe-text">
            <div className="safe-title">✅ All Clear</div>
            <div className="safe-subtitle">No Fire Detected</div>
          </div>
          <div className="checkmark-wrapper">
            <div className="checkmark-circle">
              <svg className="checkmark" viewBox="0 0 52 52">
                <circle
                  className="checkmark-circle-icon"
                  cx="26"
                  cy="26"
                  r="25"
                  fill="none"
                />
                <path
                  className="checkmark-check"
                  fill="none"
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FireStatus;
