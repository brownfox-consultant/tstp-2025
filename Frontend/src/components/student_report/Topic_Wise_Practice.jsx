"use client";

import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Topic_Wise_Practice() {
  const data = {
    labels: [
      "Information and Ideas 33%",
      "Craft and Structure 28%",
      "Expression of Ideas 22%",
      "Standard English Conventions 17%",
    ],
    datasets: [
      {
        data: [33, 28, 22, 17],
       backgroundColor: ["#F59403", "#FFD36A", "#2E2725", "#805B30"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="data-card hover-card">
      {/* TITLE */}
      <h3 className="card-title">Topic Wise Practice</h3>

      {/* CHART */}
      <div style={{ width: "300px", margin: "0 auto" }}>
        <Pie
          data={data}
          options={{
            plugins: { legend: { display: false } },
            cutout: "60%",
          }}
        />
      </div>

      {/* LABELS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginTop: "10px",
          fontSize: "13px",
          fontWeight: "600",
        }}
      >
        <div>Info & Ideas 33%</div>
        <div>Craft & Structure 28%</div>
        <div>Expression 22%</div>
        <div>Conventions 17%</div>
      </div>
    </div>
  );
}
