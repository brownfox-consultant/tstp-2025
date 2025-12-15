"use client";

import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Math_Topic_Wise_Practice() {
  const legendItems = [
    { label: "Algebra", value: 28, color: "#F59403" },
    { label: "Advanced Math", value: 25, color: "#FFD36A" },
    { label: "Problem-Solving", value: 30, color: "#2E2725" },
    { label: "Geometry", value: 17, color: "#805B30" },
  ];

  const data = {
    labels: legendItems.map((item) => `${item.label} ${item.value}%`),
    datasets: [
      {
        data: legendItems.map((item) => item.value),
        backgroundColor: legendItems.map((item) => item.color),
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="data-card hover-card">
      {/* TITLE */}
      <h3 className="card-title">Topic Wise Practice</h3>

      {/* CHART */}
      <div style={{ width: "300px", margin: "0 auto", paddingBottom: "20px" }}>
        <Pie
          data={data}
          options={{
            plugins: { legend: { display: false } },
            cutout: "60%",
            maintainAspectRatio: true,
          }}
        />
      </div>

      {/* CUSTOM LEGEND WITH COLORS */}
      <div className="custom-legend">
        {legendItems.map((item, index) => (
          <div key={index} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="legend-text">
              {item.label} {item.value}%
            </span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .data-card {
            background: #fff;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            text-align: center;
        }
        .card-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 20px;
            text-align: left;
        }
        .custom-legend {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px;
            margin-top: 10px;
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 600;
            color: #333;
        }
        .legend-color {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
        }
      `}</style>
    </div>
  );
}
