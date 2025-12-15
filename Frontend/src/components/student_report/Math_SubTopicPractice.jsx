"use client";

import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

export default function Math_SubTopicPractice() {
  // State to track window width for dynamic chart resizing
  const [windowWidth, setWindowWidth] = useState(1024); // Default to desktop

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    
    // Add event listener (check for window existence for SSR safety)
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  // Helpers to determine screen size categories
  const isMobile = windowWidth < 768;
  const isSmallMobile = windowWidth < 480;

  // 🔥 MATH TOPIC DUMMY DATA
  const topics = [
    {
      title: "Algebra",
      rows: [
        { label: "Linear equations", q: 15, t: 38, a: 76 },
        { label: "Linear functions", q: 18, t: 42, a: 58 },
        { label: "Systems of two linear equations in two variables", q: 22, t: 28, a: 92 },
        { label: "Linear inequalities in one or two variables", q: 18, t: 35, a: 75 },
        { label: "Word-Based Problems", q: 22, t: 48, a: 56 },
        { label: "Coordinate Geometry", q: 15, t: 32, a: 85 },
        { label: "Exponents and Radicals", q: 18, t: 45, a: 98 },
        { label: "Absolute Value Function / Modulus Functions", q: 15, t: 32, a: 85 },
      ],
    },
    {
      title: "Advanced Math",
      rows: [
        { label: "Quadratic and Nonlinear functions", q: 15, t: 12, a: 76 },
        { label: "Nonlinear equations in one variable", q: 18, t: 15, a: 58 },
        { label: "Systems of equations in two variables", q: 22, t: 20, a: 92 },
        { label: "Equivalent expressions", q: 22, t: 32, a: 68 },
        { label: "Advance Questions of Function and Graph", q: 12, t: 63, a: 95 },
      ],
    },
    {
      title: "Problem-Solving & Data Analysis",
      rows: [
        { label: "Ratios & Proportions", q: 26, t: 28, a: 88 },
        { label: "Percentages", q: 23, t: 25, a: 90 },
        { label: "Data Interpretation", q: 20, t: 32, a: 75 },
      ],
    },
    {
      title: "Geometry & Trigonometry",
      rows: [
        { label: "Area & Volume", q: 18, t: 36, a: 70 },
        { label: "Right Triangles", q: 21, t: 33, a: 82 },
        { label: "Circles", q: 17, t: 38, a: 66 },
      ],
    },
  ];

  return (
    <div className="data-card hover-card">
      {/* TITLE */}
      <div className="big-title">Sub – Topic Wise Practice</div>

      {topics.map((sec, i) => (
        <div key={i} className="section-wrapper">
          {/* RESPONSIVE LAYOUT */}
          <div className="topic-container">
            <div className="topic-left-text">{sec.title}</div>

            {/* COMBO CHART FOR ALL SUB-TOPICS */}
            <div className="chart-wrapper">
              {(() => {
                const labels = sec.rows.map((row) => row.label);
                const questionsData = sec.rows.map((row) => row.q);
                const timeData = sec.rows.map((row) => row.t);
                const accuracyData = sec.rows.map((row) => row.a);

                const comboData = {
                  labels: labels,
                  datasets: [
                    {
                      type: "bar",
                      label: "Questions",
                      data: questionsData,
                      backgroundColor: "#F59403",
                      borderColor: "#F59403",
                      borderWidth: 1,
                      barPercentage: isMobile ? 0.6 : 0.7,
                    },
                    {
                      type: "bar",
                      label: "Time",
                      data: timeData,
                      backgroundColor: "#FFD36A",
                      borderColor: "#FFD36A",
                      borderWidth: 1,
                      barPercentage: isMobile ? 0.6 : 0.7,
                    },
                    {
                      type: "bar",
                      label: "Accuracy",
                      data: accuracyData,
                      backgroundColor: "#0071BC",
                      borderColor: "#0071BC",
                      borderWidth: 1,
                      barPercentage: isMobile ? 0.6 : 0.7,
                    },
                  ],
                };

                const comboOptions = {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: "top",
                      align: isMobile ? "start" : "center",
                      labels: {
                        usePointStyle: true,
                        boxWidth: isSmallMobile ? 8 : 10,
                        padding: isSmallMobile ? 10 : 20,
                        font: {
                          size: isSmallMobile ? 10 : 12,
                          weight: "600",
                        },
                      },
                    },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                      bodyFont: { size: isSmallMobile ? 10 : 12 },
                      titleFont: { size: isSmallMobile ? 11 : 13 },
                    },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: {
                        autoSkip: false,
                        font: {
                          size: isSmallMobile ? 9 : 11,
                        },
                        // Rotate labels on mobile so they don't overlap
                        maxRotation: isMobile ? 45 : 0,
                        minRotation: isMobile ? 45 : 0,
                      },
                    },
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        stepSize: 20,
                        font: {
                          size: isSmallMobile ? 9 : 10,
                        },
                        callback: function (value) {
                          return value + "%";
                        },
                      },
                      grid: {
                        color: "#e0e0e0",
                        drawBorder: false,
                      },
                    },
                  },
                };

                return (
                  <div className="chart-canvas-container">
                    <Bar data={comboData} options={comboOptions} />
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        /* --- Base Layout --- */
        .data-card {
          width: 100%;
          background: #fff; /* Ensure bg is white */
          padding: 25px;
          border-radius: 8px; /* Optional rounded corners */
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
        }

        .big-title {
          background: white;
          padding: 8px 22px;
          font-weight: 800;
          border-radius: 12px;
          display: inline-block;
          font-size: 18px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .section-wrapper {
          margin-top: 50px;
        }

        .topic-container {
          display: flex;
          gap: 40px;
          align-items: flex-start;
          width: 100%;
        }

        .topic-left-text {
          font-size: 30px;
          font-weight: 800;
          width: 260px;
          min-width: 260px; /* Prevent shrinking */
          text-align: center;
          color: #000;
          line-height: 1.2;
          padding-top: 20px; /* Visual alignment with chart top */
        }

        .chart-wrapper {
          flex: 1;
          width: 100%; /* Ensure it fills remaining space */
          min-width: 0; /* Flexbox trick to allow chart to shrink */
        }

        .chart-canvas-container {
          height: 300px;
          width: 100%;
          position: relative;
        }

        /* --- Tablet Responsive (max-width: 1024px) --- */
        @media (max-width: 1024px) {
          .topic-container {
            gap: 20px;
          }
          
          .topic-left-text {
            font-size: 22px;
            width: 180px;
            min-width: 180px;
            padding-top: 10px;
          }

          .chart-canvas-container {
            height: 280px;
          }
        }

        /* --- Mobile Responsive (max-width: 768px) --- */
        @media (max-width: 768px) {
          .data-card {
            padding: 15px;
          }

          .section-wrapper {
            margin-top: 35px;
            padding-top: 15px;
            border-top: 1px solid #f0f0f0;
          }

          .topic-container {
            flex-direction: column; /* Stack vertically */
            gap: 15px;
            align-items: center;
          }

          .topic-left-text {
            width: 100%;
            min-width: auto;
            text-align: left; /* Align text left on mobile */
            font-size: 20px;
            padding-top: 0;
            padding-bottom: 5px;
          }

          .chart-canvas-container {
            height: 250px;
          }
          
          .big-title {
            font-size: 16px;
            padding: 6px 15px;
          }
        }

        /* --- Small Mobile Responsive (max-width: 480px) --- */
        @media (max-width: 480px) {
          .data-card {
            padding: 10px;
          }

          .section-wrapper {
            margin-top: 25px;
          }

          .topic-left-text {
            font-size: 18px;
          }

          .chart-canvas-container {
            height: 220px; /* Shorter chart for small screens */
          }
        }
      `}</style>
    </div>
  );
}
