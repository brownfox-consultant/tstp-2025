"use client";

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

export default function TimeCompact({ timeMetrics }) {
  return (
    <div className="data-card time-compact-card">
      <h3 className="card-title">
        
        Avg. Time & Total Time
      </h3>

      <div className="compact-time-section">

        {/* ⭐ SPEEDOMETER (Avg Time / Question) */}
        <div className="compact-block">
          <h4 className="compact-title avg-title">Average Time per Question</h4>

          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            {timeMetrics.map((t, i) => {
              // Calculate percentage and angle for the needle
              const maxSeconds = 120; // Max time for gauge
              const percent = Math.min((t.avgSeconds / maxSeconds) * 100, 100);
              const angle = 180 - (percent / 100) * 180; // 180° to 0° (left to right)

              return (
                <div key={i} style={{ textAlign: "center" }}>
                  {/* SVG GRADIENT SPEEDOMETER */}
                  <svg width="150" height="100" viewBox="0 0 150 100">
                    {/* Define gradient */}
                    <defs>
                      <linearGradient id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: "#E74C3C", stopOpacity: 1 }} />
                        <stop offset="33%" style={{ stopColor: "#E67E22", stopOpacity: 1 }} />
                        <stop offset="66%" style={{ stopColor: "#F1C40F", stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: "#2ECC71", stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>

                    {/* Background arc (light gray) */}
                    <path
                      d="M 15,85 A 60,60 0 0,1 135,85"
                      fill="none"
                      stroke="#E0E0E0"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />

                    {/* Colored gradient arc */}
                    <path
                      d="M 15,85 A 60,60 0 0,1 135,85"
                      fill="none"
                      stroke={`url(#gradient-${i})`}
                      strokeWidth="12"
                      strokeLinecap="round"
                    />

                    {/* Needle/Pointer */}
                    <line
                      x1="75"
                      y1="85"
                      x2="75"
                      y2="30"
                      stroke="#333"
                      strokeWidth="2"
                      strokeLinecap="round"
                      transform={`rotate(${angle} 75 85)`}
                      style={{ transition: "transform 0.5s ease" }}
                    />

                    {/* Center dot */}
                    <circle cx="75" cy="85" r="4" fill="#333" />
                  </svg>

                  {/* VALUE BELOW */}
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#333",
                      marginTop: "5px",
                    }}
                  >
                    {t.avgSeconds}s
                  </div>

                  {/* SUBJECT NAME */}
                  <div
                    style={{
                      fontSize: "15px",
                      marginTop: "5px",
                      color: "#555",
                      fontWeight: "600",
                    }}
                  >
                    {t.subject}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ⭐ TOTAL TIME - Horizontal Bars */}
        <div className="compact-block">
          <h4 className="compact-title total-title" style={{ textAlign: "center" }}>
            Total Time Spent
          </h4>

          {timeMetrics.map((t) => {
            const percent = Math.min((t.totalSeconds / 600) * 100, 100);
            const minutes = Math.round(t.totalSeconds / 60);

            return (
              <div
                key={t.subject}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "15px",
                  gap: "15px",
                }}
              >
                {/* SUBJECT LABEL */}
                <span style={{ width: "80px", fontSize: "14px", fontWeight: 600 }}>
                  {t.subject}
                </span>

                {/* BAR TRACK */}
                <div
                  style={{
                    flex: 1,
                    height: "32px",
                    background: "#f4f4f4",
                    borderRadius: "20px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* FILLED BAR */}
                  <div
                    style={{
                      width: `${percent}%`,
                      height: "100%",
                      background: t.borderColor,
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: "700",
                    }}
                  >
                    {t.totalSeconds}s / {minutes}min
                  </div>
                </div>
              </div>
            );
          })}

          {/* NUMBER SCALE */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "#777",
              marginTop: "10px",
              paddingLeft: "95px",
            }}
          >
            {Array.from({ length: 11 }).map((_, i) => (
              <span key={i}>{i * 10}</span>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}
