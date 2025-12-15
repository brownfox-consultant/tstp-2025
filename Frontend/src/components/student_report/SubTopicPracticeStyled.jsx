"use client";

import React, { useState, useEffect } from "react";
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

// Helper to wrap long labels
const formatLabel = (str, maxLen = 12) => {
  if (str.length <= maxLen) return str;
  const words = str.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    if ((currentLine + " " + words[i]).length <= maxLen) {
      currentLine += " " + words[i];
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);
  return lines;
};

export default function SubTopicPracticeStyled() {
  // State to track window width for dynamic chart resizing
  const [windowWidth, setWindowWidth] = useState(1024); // Default to desktop

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    
    // Add event listener
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

  // Helpers to determine screen size categories
  const isMobile = windowWidth < 768;
  const isSmallMobile = windowWidth < 480;

  // 🔥 EXTENDED DUMMY DATA
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
    <div className="data-card hover-card">
      {/* TITLE */}
      <div className="big-title">Sub – Topic Wise Practice</div>

      {/* GRID CONTAINER FOR SUB-TOPICS */}
      <div className="subtopics-grid">
        {topics.map((sec, i) => (
          <div key={i} className="section-wrapper">
            {/* RESPONSIVE LAYOUT */}
            <div className="topic-container">
              <div className="topic-left-text">{sec.title}</div>

              {/* BAR CHART FOR EACH SUB-TOPIC SECTION */}
              <div className="chart-wrapper">
                {(() => {
                  // FORMAT LABELS FOR WRAPPING
                  const labels = sec.rows.map((row) => formatLabel(row.label, 15));
                  const questionsData = sec.rows.map((row) => row.q);
                  const timeData = sec.rows.map((row) => row.t);
                  const accuracyData = sec.rows.map((row) => row.a);

                  const comboData = {
                    labels: labels,
                    datasets: [
                      {
                        label: "Questions",
                        data: questionsData,
                        backgroundColor: "#F59403",
                        borderColor: "#F59403",
                        borderWidth: 1,
                        barThickness: 30,    // FIXED THICKNESS
                        maxBarThickness: 40,
                      },
                      {
                        label: "Time",
                        data: timeData,
                        backgroundColor: "#FFD36A",
                        borderColor: "#FFD36A",
                        borderWidth: 1,
                        barThickness: 30,
                        maxBarThickness: 40,
                      },
                      {
                        label: "Accuracy",
                        data: accuracyData,
                        backgroundColor: "#0071BC",
                        borderColor: "#0071BC",
                        borderWidth: 1,
                        barThickness: 30,
                        maxBarThickness: 40,
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
                        align: "start", // Align legend left
                        labels: {
                          usePointStyle: true,
                          boxWidth: 8,
                          padding: 15,
                          font: {
                            size: 11,
                            weight: "600",
                          },
                        },
                      },
                      tooltip: {
                        mode: "index",
                        intersect: false,
                      },
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: {
                          autoSkip: false,
                          font: {
                            size: 11, // Fixed size for readability
                            weight: '500'
                          },
                          maxRotation: 0, // NO ROTATION
                          minRotation: 0,
                          align: 'center',
                        },
                      },
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          stepSize: 20,
                          font: {
                             size: 10,
                          },
                          callback: function (value) {
                            return value + "%";
                          },
                        },
                        grid: {
                          color: "#f0f0f0",
                          drawBorder: false,
                        },
                      },
                    },
                  };

                  return (
                    <div className="chart-scroll-container">
                      <div className="chart-canvas-container">
                        <Bar data={comboData} options={comboOptions} />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>

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
          margin-bottom: 30px;
        }
        
        /* --- Grid Layout for Sub-Topics --- */
        .subtopics-grid {
          display: grid;
          grid-template-columns: 1fr; /* Default to single column */
          gap: 30px;
        }

        /* Large screens: Side-by-side */
        @media (min-width: 1350px) {
          .subtopics-grid {
            grid-template-columns: repeat(2, 1fr); /* Two columns */
            align-items: start;
          }
        }

        .section-wrapper {
          width: 100%;
          /* margin-top removed, handled by grid gap */
        }

        .topic-container {
          display: flex;
          flex-direction: column; /* VERTICAL STACK */
          gap: 20px;
          align-items: flex-start;
          width: 100%;
        }

        .topic-left-text {
          font-size: 24px; /* Slightly smaller for grid fit */
          font-weight: 800;
          width: 100%; 
          text-align: left; 
          color: #000;
          line-height: 1.2;
          padding-bottom: 15px; 
        }

        .chart-wrapper {
          width: 100%; 
        }

        /* --- Chart Container --- */
        .chart-scroll-container {
          width: 100%;
          overflow-x: auto; /* ENABLE HORIZONTAL SCROLL */
          -webkit-overflow-scrolling: touch;
          padding-bottom: 10px;
        }

        .chart-canvas-container {
          height: 350px;
          /* Fixed width strategy adjusted for grid */
          width: 100%;
          min-width: 500px; /* Ensure it doesn't get squashed too small */
          position: relative;
        }
        
        /* On large screens, we might want to enforce a min-width to prevent squashing 
           if the screen is just barely wide enough for 2 columns */
        @media (min-width: 1350px) {
           .chart-canvas-container {
              min-width: 550px; 
           }
        }

        /* --- Global Responsive --- */
        @media (max-width: 768px) {
          .data-card { padding: 15px; }
          .big-title { font-size: 16px; padding: 6px 15px; margin-bottom: 20px; }
          .topic-left-text { font-size: 20px; }
          .chart-canvas-container { height: 300px; min-width: 500px; }
        }
        
        @media (max-width: 480px) {
           .chart-canvas-container { height: 280px; min-width: 450px; }
        }
      `}</style>
    </div>
  );
}