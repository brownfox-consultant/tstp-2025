"use client";

import React, { useState, useEffect } from "react";
import { Chart } from "react-chartjs-2";
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

    // Cleanup
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  // Breakpoints for rendering logic
  const isMobile = windowWidth <= 768;
  const isSmallMobile = windowWidth <= 480;

  // DATA
  const topics = [
    {
      title: "Algebra",
      rows: [
        { label: "Linear equations in one variable", q: 45, t: 90, a: 80 },
        { label: "Linear functions", q: 35, t: 70, a: 85 },
        { label: "Linear equations in two variables", q: 20, t: 30, a: 50 },
        { label: "Systems of two linear equations", q: 10, t: 40, a: 70 },
        { label: "Linear inequalities in one or two variables", q: 5, t: 10, a: 90 },
        { label: "Word-Based Problems", q: 30, t: 60, a: 65 },
        { label: "Coordinate Geometry (Lines)", q: 25, t: 50, a: 75 },
        { label: "Exponents and Radicals", q: 40, t: 80, a: 60 },
        { label: "Absolute Value Function / Modulus Functions", q: 15, t: 20, a: 95 },
      ],
    },
    {
      title: "Advanced Math",
      rows: [
        { label: "Quadratic and Nonlinear functions", q: 30, t: 60, a: 70 },
        { label: "Nonlinear equations in one variable", q: 25, t: 45, a: 80 },
        { label: "Systems of equations", q: 20, t: 40, a: 60 },
        { label: "Equivalent expressions", q: 35, t: 75, a: 90 },
        { label: "Advance Questions of Function and Graph", q: 15, t: 30, a: 55 },
      ],
    },
    {
      title: "Problem-Solving & Data Analysis",
      rows: [
        { label: "Rates and Proportional relationships", q: 25, t: 50, a: 75 },
        { label: "Ratio and Percentages", q: 35, t: 60, a: 80 },
        { label: "One-variable data distributions", q: 15, t: 30, a: 70 },
        { label: "Two-variable data models", q: 20, t: 45, a: 65 },
        { label: "Probability", q: 10, t: 25, a: 85 },
        { label: "Statistical claims evaluation", q: 30, t: 55, a: 60 },
        { label: "Trade and Exchange questions", q: 15, t: 35, a: 90 },
        { label: "Real Life Calculations", q: 20, t: 40, a: 75 },
      ],
    },
    {
      title: "Geometry & Trigonometry",
      rows: [
        { label: "Area and volume", q: 30, t: 60, a: 80 },
        { label: "Lines angles and triangles", q: 25, t: 45, a: 75 },
        { label: "Quadrilaterals and Polygons", q: 20, t: 35, a: 70 },
        { label: "Right triangles and Trigonometry", q: 35, t: 70, a: 85 },
        { label: "Circles", q: 15, t: 30, a: 60 },
        { label: "Overlapping Figures", q: 10, t: 20, a: 90 },
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

            {/* LOLLIPOP (MIXED BAR + LINE) CHART */}
            <div className="chart-wrapper">
              {(() => {
                const labels = sec.rows.map((row) => row.label);
                const questionsData = sec.rows.map((row) => row.q);
                const timeData = sec.rows.map((row) => row.t);
                const accuracyData = sec.rows.map((row) => row.a);

                const data = {
                  labels: labels,
                  datasets: [
                    // --- Sticks (Bars) ---
                    {
                      type: 'bar',
                      label: "Questions Stick",
                      data: questionsData,
                      backgroundColor: "#F59403",
                      borderColor: "#F59403",
                      barThickness: 2, // THIN STICK
                      order: 2,
                    },
                    {
                      type: 'bar',
                      label: "Time Stick",
                      data: timeData,
                      backgroundColor: "#FFD36A",
                      borderColor: "#FFD36A",
                      barThickness: 2,
                      order: 2,
                    },
                    {
                      type: 'bar',
                      label: "Accuracy Stick",
                      data: accuracyData,
                      backgroundColor: "#0071BC",
                      borderColor: "#0071BC",
                      barThickness: 2,
                      order: 2, // Render behind points
                    },
                    
                    // --- Heads (Points) ---
                    {
                      type: 'line',
                      label: "Questions",
                      data: questionsData,
                      backgroundColor: "#F59403",
                      borderColor: "#fff", // White border around dot
                      borderWidth: 2,
                      pointRadius: 6,
                      pointHoverRadius: 8,
                      showLine: false, // No connecting lines
                      order: 1, // Render on top
                    },
                    {
                      type: 'line',
                      label: "Time",
                      data: timeData,
                      backgroundColor: "#FFD36A",
                      borderColor: "#fff",
                      borderWidth: 2,
                      pointRadius: 6,
                      pointHoverRadius: 8,
                      showLine: false,
                      order: 1,
                    },
                    {
                      type: 'line',
                      label: "Accuracy",
                      data: accuracyData,
                      backgroundColor: "#0071BC",
                      borderColor: "#fff",
                      borderWidth: 2,
                      pointRadius: 6,
                      pointHoverRadius: 8,
                      showLine: false,
                      order: 1,
                    },
                  ],
                };

                const options = {
                  indexAxis: 'y', // HORIZONTAL
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      // HIDE STICK LEGENDS
                      labels: {
                        filter: function(item, chart) {
                          return !item.text.includes('Stick');
                        },
                        font: { size: 12, weight: '600' },
                        usePointStyle: true,
                         boxWidth: 8,
                      }
                    },
                    tooltip: {
                      callbacks: {
                         // Only show tooltips for the Head datasets
                         label: function(context) {
                            if (context.dataset.label && context.dataset.label.includes('Stick')) {
                                return null;
                            }
                            return context.dataset.label + ': ' + context.formattedValue + '%';
                         }
                      },
                      filter: function(tooltipItem) {
                         // Filter out stick tooltips
                         return !tooltipItem.dataset.label.includes('Stick');
                      }
                    }
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      max: 100,
                      grid: { 
                         color: '#f0f0f0',
                         borderDash: [5, 5]
                      },
                      ticks: {
                        stepSize: 20,
                        callback: (v) => v + '%'
                      }
                    },
                    y: {
                      grid: { display: false },
                      ticks: {
                        autoSkip: false,
                        font: { size: isSmallMobile ? 9 : 11, weight: '500' }
                      }
                    }
                  },
                };

                return (
                  <div className="chart-scroll-container">
                    <div className="chart-canvas-container">
                      {/* Use generic Chart component for mixed types */}
                      <Chart type='bar' data={data} options={options} />
                    </div>
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
          background: #fff;
          padding: 25px;
          border-radius: 8px;
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
          flex-direction: column; /* VERTICAL STACK */
          gap: 20px;
          align-items: flex-start;
          width: 100%;
        }

        .topic-left-text {
          font-size: 30px; 
          font-weight: 800;
          width: 100%; /* Full width */
          text-align: left; /* Alignment left */
          color: #000;
          line-height: 1.2;
          padding-bottom: 10px; /* Space between title and chart */
        }

        .chart-wrapper {
          flex: 1;
          width: 100%; 
          min-width: 0; 
        }

        /* --- Chart Container --- */
        .chart-scroll-container {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 15px; 
          display: block; 
        }

        .chart-canvas-container {
          height: 350px; /* Good height for horizontal list */
          width: 100%;
          min-width: 700px; /* Force scroll */
          position: relative;
        }

        /* --- Tablet Responsive (max-width: 1024px) --- */
        @media (max-width: 1024px) {
          .topic-left-text {
            font-size: 26px;
          }

          .chart-canvas-container {
            height: 320px;
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

          .topic-left-text {
            font-size: 22px;
          }

          .chart-canvas-container {
            height: 350px; 
             min-width: 600px; 
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
            font-size: 20px;
          }

          .chart-canvas-container {
            height: 300px; 
          }
        }
      `}</style>
    </div>
  );
}
