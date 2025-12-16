"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { BASE_URL } from "@/app/constants/apiConstants";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Wrap long labels
const formatLabel = (str, maxLen = 14) => {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  const words = str.split(" ");
  const lines = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    if ((current + " " + words[i]).length <= maxLen) {
      current += " " + words[i];
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
};

export default function SubTopicPracticeStyled({
  student_id,
  course_id,
  test_type,
  subject, // 🔑 "English" | "Math"
}) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student_id && course_id && test_type && subject) {
      fetchData();
    }
  }, [student_id, course_id, test_type, subject]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/api/result/SubTopic_Wise_Practice/?student_id=${student_id}&course_id=${course_id}&test_type=${test_type}`,
        { withCredentials: true }
      );

      // ✅ FILTER SUBJECT (English / Math)
      const subjectBlock = res.data.find(
        (s) => s.subject.toLowerCase() === subject.toLowerCase()
      );

      setTopics(subjectBlock?.topics || []);
    } catch (err) {
      console.error("SubTopic API Error:", err);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!topics.length) {
    return (
      <div className="data-card hover-card">
        <div className="big-title">Sub – Topic Wise Practice</div>
        <div style={{ marginTop: "20px", color: "#777" }}>
          No sub-topic data available
        </div>
      </div>
    );
  }

  return (
    <div className="data-card hover-card">
      <div className="big-title">
        Sub – Topic Wise Practice — {subject}
      </div>

      <div className="subtopics-grid">
        {topics.map((topicBlock, i) => {
          const labels = topicBlock.subtopics.map((s) =>
            formatLabel(s.subtopic)
          );

          const questionData = topicBlock.subtopics.map(
            (s) => s.practiced_questions || 0
          );

          const timeData = topicBlock.subtopics.map(
            (s) => s.avg_time_seconds || 0
          );

          const accuracyData = topicBlock.subtopics.map(
            (s) => s.accuracy_percent || 0
          );

          const data = {
            labels,
            datasets: [
              {
                label: "Questions",
                data: questionData,
                backgroundColor: "#F59403",
                borderColor: "#F59403",
                barThickness: 30,
              },
              {
                label: "Time",
                data: timeData,
                backgroundColor: "#FFD36A",
                borderColor: "#FFD36A",
                barThickness: 30,
              },
              {
                label: "Accuracy",
                data: accuracyData,
                backgroundColor: "#0071BC",
                borderColor: "#0071BC",
                barThickness: 30,
              },
            ],
          };

          const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
                align: "start",
                labels: {
                  usePointStyle: true,
                  boxWidth: 8,
                  font: { size: 14, weight: "600" },
                },
              },
              tooltip: { mode: "index", intersect: false },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  autoSkip: false,
                  font: { size: 16 },
                },
              },
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 20,
                  callback: (v) => v + "%",
                  font: { size: 14 },
                },
                grid: { color: "#f0f0f0", drawBorder: false },
              },
            },
          };

          return (
            <div key={i} className="section-wrapper">
              <div className="topic-left-text">{topicBlock.topic}</div>

              <div className="chart-scroll-container">
                <div className="chart-canvas-container">
                  <Bar data={data} options={options} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .big-title {
          background: white;
          padding: 8px 22px;
          font-weight: 800;
          border-radius: 12px;
          display: inline-block;
          margin-bottom: 25px;
        }

        .subtopics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 35px;
        }

        @media (min-width: 1350px) {
          .subtopics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .topic-left-text {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .chart-scroll-container {
          overflow-x: auto;
          padding-bottom: 10px;
        }

        .chart-canvas-container {
          height: 340px;
          min-width: 520px;
        }
      `}</style>
    </div>
  );
}
