"use client";

import { useState } from "react";

export default function PracticeDonut({ practice }) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Default data when no practice data available
  const defaultPractice = [
    { subject: "English", percent: 0, color: "#FFD36A" },
    { subject: "Math", percent: 0, color: "#F7931E" },
  ];

  // Use practice data if available, otherwise use default
  const displayData = practice && practice.length > 0 ? practice : defaultPractice;

  const activeSubject = displayData[activeIndex] || displayData[0];
  const percent = activeSubject.percent;

  // Wave path calculation based on percentage
  const waveHeight = 180 - (percent / 100) * 160; // 180 is bottom, higher percent = lower waveHeight
  
  return (
    <div className="data-card practice-card" style={{ padding: "24px" }}>
      {/* TITLE */}
      <h3
        style={{
          fontSize: "18px",
          fontWeight: "700",
          color: "#333",
          marginBottom: "20px",
        }}
      >
        Subject Practice Progress
      </h3>

      {/* SUBJECT TABS */}
      <div
        style={{
          display: "flex",
          backgroundColor: "#f0f0f0",
          borderRadius: "30px",
          padding: "4px",
          marginBottom: "30px",
        }}
      >
        {displayData.map((p, index) => (
          <button
            key={p.subject}
            onClick={() => setActiveIndex(index)}
            style={{
              flex: 1,
              padding: "10px 20px",
              borderRadius: "25px",
              border: "none",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              background:
                activeIndex === index
                  ? "linear-gradient(90deg, #F7931E, #F15A24)"
                  : "transparent",
              color: activeIndex === index ? "#fff" : "#666",
            }}
          >
            {p.subject}
          </button>
        ))}
      </div>

      {/* WATERFALL CIRCLE */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <svg width="200" height="200" viewBox="0 0 200 200">
          <defs>
            {/* Clip path for circle */}
            <clipPath id="circleClip">
              <circle cx="100" cy="100" r="85" />
            </clipPath>

            {/* Gradient for wave */}
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFE5B4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FFD36A" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Outer circle border */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#FFD36A"
            strokeWidth="3"
          />

          {/* Inner white background */}
          <circle cx="100" cy="100" r="85" fill="#fff" />

          {/* Wave fill */}
          <g clipPath="url(#circleClip)">
            <path
              d={`
                M 0 ${waveHeight}
                Q 25 ${waveHeight - 15} 50 ${waveHeight}
                T 100 ${waveHeight}
                T 150 ${waveHeight}
                T 200 ${waveHeight}
                L 200 200
                L 0 200
                Z
              `}
              fill="url(#waveGradient)"
            >
              {/* Wave animation */}
              <animate
                attributeName="d"
                dur="3s"
                repeatCount="indefinite"
                values={`
                  M 0 ${waveHeight} Q 25 ${waveHeight - 12} 50 ${waveHeight} T 100 ${waveHeight} T 150 ${waveHeight} T 200 ${waveHeight} L 200 200 L 0 200 Z;
                  M 0 ${waveHeight} Q 25 ${waveHeight + 12} 50 ${waveHeight} T 100 ${waveHeight} T 150 ${waveHeight} T 200 ${waveHeight} L 200 200 L 0 200 Z;
                  M 0 ${waveHeight} Q 25 ${waveHeight - 12} 50 ${waveHeight} T 100 ${waveHeight} T 150 ${waveHeight} T 200 ${waveHeight} L 200 200 L 0 200 Z
                `}
              />
            </path>
          </g>

          {/* Percentage text */}
          <text
            x="100"
            y="110"
            textAnchor="middle"
            fontSize="42"
            fontWeight="700"
            fill="#333"
          >
            {percent}%
          </text>
        </svg>

        {/* Subject label below circle */}
        <div
          style={{
            marginTop: "15px",
            fontSize: "16px",
            fontWeight: "700",
            color: "#F7931E",
          }}
        >
          {activeSubject.subject}
        </div>
      </div>
    </div>
  );
}
