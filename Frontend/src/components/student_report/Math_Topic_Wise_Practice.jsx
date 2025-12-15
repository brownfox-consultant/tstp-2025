"use client";

import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Math_Topic_Wise_Practice() {
  const data = {
    labels: [
      "Algebra 28%",
      "Advanced Math 25%",
      "Problem-Solving & Data Analysis 30%",
      "Geometry & Trigonometry 17%",
    ],
    datasets: [
      {
        data: [28, 25, 30, 17],
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
        <div>Algebra 28%</div>
        <div>Advanced Math 25%</div>
        <div>Problem-Solving 30%</div>
        <div>Geometry 17%</div>
      </div>
    </div>
  );
}
