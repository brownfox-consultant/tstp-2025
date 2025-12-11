"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function SubTopicPracticeStyled() {
  // 🔥 EXTENDED DUMMY LIKE SAT SCREENSHOT
  const topics = [
    {
      title: "Information and Ideas",
      rows: [
        { label: "Central Ideas and Details", q: 18, t: 38, a: 76 },
        { label: "Inferences", q: 22, t: 42, a: 58 },
        { label: "Command of Evidence", q: 28, t: 28, a: 92 },
      ],
    },
    {
      title: "Craft & Structure",
      rows: [
        { label: "Words in Context", q: 15, t: 12, a: 76 },
        { label: "Text Structure & Purpose", q: 18, t: 15, a: 58 },
        { label: "Cross-Text Connections", q: 22, t: 20, a: 92 },
      ],
    },
    {
      title: "Expression of Ideas",
      rows: [
        { label: "Organization", q: 14, t: 18, a: 65 },
        { label: "Effective Language Use", q: 20, t: 22, a: 56 },
        { label: "Logical Sequence", q: 26, t: 25, a: 88 },
      ],
    },
  ];

  return (
    <div className="data-card hover-card" style={{ padding: "25px", width: "100%" }}>
      {/* TITLE */}
      <div className="big-title">Sub – Topic Wise Practice</div>

      {topics.map((sec, i) => (
        <div key={i} style={{ marginTop: "50px" }}>

          {/* LEFT SIDE BIG TEXT */}
          <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
            <div className="topic-left-text">{sec.title}</div>

            {/* RIGHT SIDE FULL WIDTH */}
            <div style={{ flex: 1 }}>
              {sec.rows.map((row, index) => {
                const barData = {
                  labels: [""],
                 datasets: [
  {
    label: "Questions",
    data: [row.q],
    backgroundColor: "#F59403",
    barThickness: 20,
  },
  {
    label: "Time",
    data: [row.t],
    backgroundColor: "#FFD36A",
    barThickness: 20,
  },
  {
    label: "Accuracy",
    data: [row.a],
    backgroundColor: "#0071BC",
    barThickness: 20,
  },
],

                };

                return (
                  <div key={index} style={{ marginBottom: "25px" }}>
                    {/* LABEL */}
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        marginBottom: "6px",
                        color: "#333",
                      }}
                    >
                      {row.label}
                    </div>

                    {/* FULL WIDTH BAR */}
                    <Bar
                      data={barData}
                      height={65}
                      options={{
                        responsive: true,
                        indexAxis: "y",
                        plugins: { legend: { display: false } },
                        scales: {
                          x: {
                            min: 0,
                            max: 100,
                            ticks: { stepSize: 20, color: "#777" },
                            grid: { color: "#ddd" },
                          },
                          y: {
                            ticks: { display: false },
                            grid: { display: false },
                          },
                        },
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .big-title {
          background: white;
          padding: 8px 22px;
          font-weight: 800;
          border-radius: 12px;
          display: inline-block;
        }

        .topic-left-text {
          font-size: 30px;
          font-weight: 800;
          width: 260px;
          text-align: center;
          color: #000;
          line-height: 32px;
        }

        .hover-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}
