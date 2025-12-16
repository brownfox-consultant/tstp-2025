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

export default function Math_TopicAccuracy({
  student_id,
  course_id,
  test_type,
}) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student_id && course_id && test_type) {
      loadAccuracy();
    }
  }, [student_id, course_id, test_type]);

  const loadAccuracy = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/api/result/Topic_Wise_Accuracy/?student_id=${student_id}&course_id=${course_id}&test_type=${test_type}`,
        { withCredentials: true }
      );

      // ✅ FILTER MATH SUBJECT
      const mathBlock = res.data.find(
        (s) => s.subject.toLowerCase() === "math"
      );

      setTopics(mathBlock?.topics || []);
    } catch (err) {
      console.error("Math Topic Accuracy API Error:", err);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!topics.length) {
    return (
      <div className="data-card hover-card">
        <h3 className="card-title">Topic Wise Accuracy — Math</h3>
        <div style={{ textAlign: "center", color: "#777", marginTop: "20px" }}>
          No accuracy data available
        </div>
      </div>
    );
  }

  const labels = topics.map((t) => t.topic);
  const values = topics.map((t) => t.accuracy_percent || 0);

  // ❌ DO NOT CHANGE COLORS (same as your design)
  const COLORS = ["#F59403", "#FFD36A", "#2E2725", "#805B30"];

  const data = {
    labels,
    datasets: [
      {
        label: "Accuracy %",
        data: values,
        backgroundColor: values.map(
          (_, i) => COLORS[i % COLORS.length]
        ),
        borderRadius: 10,
      },
    ],
  };

  const options = {
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: {
          color: "#444",
          font: { size: 12 },
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 10,
          color: "#444",
        },
        grid: { color: "#ddd" },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="data-card hover-card">
      <h3 className="card-title">Topic Wise Accuracy — Math</h3>

      <div style={{ width: "420px", height: "320px", margin: "0 auto" }}>
        <Bar
          key="math-accuracy"
          data={data}
          options={options}
        />
      </div>
    </div>
  );
}
