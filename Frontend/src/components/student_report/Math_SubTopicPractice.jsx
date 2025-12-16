"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
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
import { BASE_URL } from "@/app/constants/apiConstants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

export default function Math_SubTopicPractice({
  student_id,
  course_id,
  test_type,
}) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH API ---------------- */
  useEffect(() => {
    if (!student_id || !course_id || !test_type) return;
    fetchData();
  }, [student_id, course_id, test_type]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/api/result/SubTopic_Wise_Practice/?student_id=${student_id}&course_id=${course_id}&test_type=${test_type}`,
        { withCredentials: true }
      );

      // ✅ FILTER MATH
      const mathBlock = res.data.find(
        (s) => s.subject?.toLowerCase() === "math"
      );

      setTopics(mathBlock?.topics || []);
    } catch (err) {
      console.error("Math SubTopic API Error:", err);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!topics.length)
    return <div style={{ color: "#777" }}>No math sub-topic data</div>;

  /* ---------------- UI ---------------- */
  return (
    <div className="data-card hover-card">
      <div className="big-title">Sub – Topic Wise Practice</div>

      {topics.map((sec, i) => {
        const labels = sec.subtopics.map((r) => r.subtopic);
        const q = sec.subtopics.map((r) => r.practiced_questions || 0);
        const t = sec.subtopics.map((r) => r.avg_time_seconds || 0);
        const a = sec.subtopics.map((r) => r.accuracy_percent || 0);

        const data = {
          labels,
          datasets: [
            // ---- STICKS ----
            {
              type: "bar",
              label: "Questions Stick",
              data: q,
              backgroundColor: "#F59403",
              barThickness: 2,
              order: 2,
            },
            {
              type: "bar",
              label: "Time Stick",
              data: t,
              backgroundColor: "#FFD36A",
              barThickness: 2,
              order: 2,
            },
            {
              type: "bar",
              label: "Accuracy Stick",
              data: a,
              backgroundColor: "#0071BC",
              barThickness: 2,
              order: 2,
            },

            // ---- DOTS ----
            {
              type: "line",
              label: "Questions",
              data: q,
              backgroundColor: "#F59403",
              borderColor: "#fff",
              pointRadius: 6,
              showLine: false,
              order: 1,
            },
            {
              type: "line",
              label: "Time",
              data: t,
              backgroundColor: "#FFD36A",
              borderColor: "#fff",
              pointRadius: 6,
              showLine: false,
              order: 1,
            },
            {
              type: "line",
              label: "Accuracy",
              data: a,
              backgroundColor: "#0071BC",
              borderColor: "#fff",
              pointRadius: 6,
              showLine: false,
              order: 1,
            },
          ],
        };

        const options = {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: {
                filter: (item) => !item.text.includes("Stick"),
                usePointStyle: true,
                font: { size: 12, weight: "600" },
              },
            },
            tooltip: {
              filter: (item) => !item.dataset.label.includes("Stick"),
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              ticks: { callback: (v) => v + "%" },
            },
            y: {
              ticks: { autoSkip: false, font: { size: 11 } },
              grid: { display: false },
            },
          },
        };

        return (
          <div key={i} className="section-wrapper">
            <div className="topic-left-text">{sec.topic}</div>

            <div className="chart-scroll-container">
              <div className="chart-canvas-container">
                <Chart type="bar" data={data} options={options} />
              </div>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .big-title {
          background: white;
          padding: 8px 22px;
          font-weight: 800;
          border-radius: 12px;
          display: inline-block;
          margin-bottom: 30px;
        }

        .section-wrapper {
          margin-top: 40px;
        }

        .topic-left-text {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 15px;
        }

        .chart-scroll-container {
          overflow-x: auto;
        }

        .chart-canvas-container {
          height: 350px;
          min-width: 700px;
        }
      `}</style>
    </div>
  );
}
