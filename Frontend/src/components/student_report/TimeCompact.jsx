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

          <div className="gauges-container">
            {timeMetrics.map((t, i) => {
              // Calculate percentage and angle for the needle
              const maxSeconds = 120; // Max time for gauge
              const percent = Math.min((t.avgSeconds / maxSeconds) * 100, 100);
              // Corrected Angle Logic: -90 deg = Left, +90 deg = Right
              const angle = -90 + (percent / 100) * 180; 

              return (
                <div key={i} className="single-gauge-wrapper">
                  {/* SVG GRADIENT SPEEDOMETER - RESPONSIVE CLASS */}
                  <svg className="gauge-svg" viewBox="0 0 150 100">
                    <defs>
                      <linearGradient id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: "#2ECC71", stopOpacity: 1 }} />
                        <stop offset="33%" style={{ stopColor: "#F1C40F", stopOpacity: 1 }} />
                        <stop offset="66%" style={{ stopColor: "#E67E22", stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: "#E74C3C", stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>

                    {/* Background arc */}
                    <path
                      d="M 15,85 A 60,60 0 0,1 135,85"
                      fill="none"
                      stroke="#f0f0f0"
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

                    {/* Needle */}
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
                    <circle cx="75" cy="85" r="4" fill="#333" />
                  </svg>

                  {/* VALUE BELOW */}
                  <div className="gauge-value">
                    {t.avgSeconds}s
                  </div>

                  {/* SUBJECT NAME */}
                  <div className="gauge-label">
                    {t.subject}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ⭐ TOTAL TIME - Horizontal Bars */}
        <div className="compact-block">
          <h4 className="compact-title total-title" style={{ textAlign: "center", marginBottom: "25px" }}>
            Total Time Spent
          </h4>

          {/* Wrapper for Bars to center them - Widened to 600px */}
          <div style={{ maxWidth: "600px", margin: "0 auto" }}> 
            {timeMetrics.map((t) => {
              const percent = Math.min((t.totalSeconds / 600) * 100, 100);
              const minutes = Math.round(t.totalSeconds / 60);

              return (
                <div
                  key={t.subject}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "20px",
                    gap: "20px",
                  }}
                >
                  {/* SUBJECT LABEL */}
                  <span style={{ width: "80px", fontSize: "16px", fontWeight: 700, color: "#444" }}>
                    {t.subject}
                  </span>

                  {/* BAR TRACK */}
                  <div
                    style={{
                      flex: 1,
                      height: "40px", // Taller bars
                      background: "#f8f9fa",
                      borderRadius: "20px",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)"
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
                        fontSize: "14px",
                        fontWeight: "700",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
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
                color: "#999",
                marginTop: "10px",
                paddingLeft: "100px", // Align with bar start
              }}
            >
              {Array.from({ length: 11 }).map((_, i) => (
                <span key={i}>{i * 10}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .time-compact-card {
          padding: 24px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .card-title {
           font-size: 18px; 
           font-weight: 700; 
           margin-bottom: 24px;
           color: #222;
        }

        .compact-title {
           font-size: 16px;
           font-weight: 700;
           color: #d946ef; /* Light purple title color from screenshot/theme */
           text-align: center;
           margin-bottom: 20px;
        }

        /* --- GAUGES CONTAINER --- */
        .gauges-container {
           display: flex;
           justify-content: center;
           margin-bottom: 30px;
           flex-wrap: wrap;
           gap: 80px;
           align-items: flex-end;
        }

        .single-gauge-wrapper {
           text-align: center;
           display: flex;
           flex-direction: column;
           align-items: center;
        }

        /* --- RESPONSIVE GAUGE SVG --- */
        .gauge-svg {
           width: 240px; 
           height: 160px;
           transition: all 0.3s ease;
        }
        .gauge-value {
           font-size: 36px;
           font-weight: 700;
           color: #333;
           margin-top: -20px;
           margin-bottom: 5px;
           transition: font-size 0.3s ease;
        }
        .gauge-label {
           font-size: 18px;
           color: #555;
           font-weight: 600;
           transition: font-size 0.3s ease;
        }

        /* --- MEDIA QUERY (Matching 1630px breakpoint) --- */
        @media (max-width: 1630px) {
           .gauges-container {
              gap: 40px;
           }
           .gauge-svg {
              width: 180px;
              height: 120px;
           }
           .gauge-value {
              font-size: 28px;
              margin-top: -15px;
           }
           .gauge-label {
              font-size: 16px;
           }
        }

        /* --- EXTRA SMALL SCREENS --- */
        @media (max-width: 480px) {
           .gauge-svg {
              width: 150px;
              height: 100px;
           }
           .gauge-value {
              font-size: 24px;
           }
        }
      `}</style>
    </div>
  );
}
