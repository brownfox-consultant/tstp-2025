"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function TopicAccuracyDummy() {
  const data = {
    labels: [
      "Information and Ideas",
      "Craft and Structure",
      "Expression of Ideas",
      "Standard English Conventions",
    ],
    datasets: [
      {
        label: "Accuracy %",
        data: [33, 28, 22, 17],
       backgroundColor: ["#F59403", "#FFD36A", "#2E2725", "#805B30"],
        borderRadius: 10,
      },
    ],
  };

  const options = {
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#444", font: { size: 12 } } },
      y: {
        beginAtZero: true,
        max: 35,
        ticks: { stepSize: 5, color: "#444" },
        grid: { color: "#ddd" },
      },
    },
  };

  return (
    <div className="data-card hover-card">
      {/* TITLE */}
      <h3 className="card-title">Topic Wise Accuracy</h3>

      {/* BAR CHART */}
      <div style={{ width: "420px", height: "320px", margin: "0 auto" }}>
  <Bar data={data} options={{ ...options, maintainAspectRatio: false }} />
</div>

    </div>
  );
}
