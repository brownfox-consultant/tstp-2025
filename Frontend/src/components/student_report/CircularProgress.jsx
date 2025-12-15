import React from "react";

const CircularProgress = ({ value, max, color, label, size = 60, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Cap value at max for visual correctness
  const normalizedValue = Math.min(value, max);
  const strokeDashoffset = circumference - (normalizedValue / max) * circumference;

  return (
    <div className="circular-item">
      <div className="circle-wrapper" style={{ width: size, height: size }}>
        <svg
          height={size}
          width={size}
          style={{ transform: "rotate(-90deg)", overflow: "visible" }}
        >
          {/* Track Circle */}
          <circle
            stroke="#e6e6e6"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress Circle */}
          <circle
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s ease" }}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="circle-inner-text">
          {Math.round(value)}{label === "Accuracy" ? "%" : ""}
        </div>
      </div>
      <div className="circle-label" style={{ color: color }}>
        {label === "Questions" ? "Q" : label === "Time" ? "T" : "Acc"}
      </div>
      <style jsx>{`
        .circular-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }
        .circle-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .circle-inner-text {
          position: absolute;
          font-size: 11px;
          font-weight: 700;
          color: #333;
        }
        .circle-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
};

export default CircularProgress;
