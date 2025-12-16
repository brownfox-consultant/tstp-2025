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
} from "chart.js";
import { BASE_URL } from "@/app/constants/apiConstants";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function TopicAccuracy({
  student_id,
  course_id,
  test_type,
  subject, // 🔑 NEW
}) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student_id && course_id && test_type && subject) {
      loadAccuracy();
    }
  }, [student_id, course_id, test_type, subject]);

  const loadAccuracy = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/api/result/Topic_Wise_Accuracy/?student_id=${student_id}&course_id=${course_id}&test_type=${test_type}`,
        { withCredentials: true }
      );

      // ✅ FILTER BY SUBJECT
      const subjectBlock = res.data.find(
        (s) => s.subject.toLowerCase() === subject.toLowerCase()
      );

      setTopics(subjectBlock?.topics || []);
    } catch (err) {
      console.error("Topic Accuracy API Error:", err);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  const labels = topics.map((t) => t.topic);
  const values = topics.map((t) => t.accuracy_percent || 0);

  const colors = [
    "#F59403",
    "#FFD36A",
    "#2E2725",
    "#805B30",
    "#0071BC",
    "#70D9E4",
  ];
  const backgroundColors = values.map((v, i) =>
    v > 0 ? colors[i % colors.length] : "#E0E0E0"
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Accuracy %",
        data: values.length ? values : [100], // 👈 keeps chart visible
        backgroundColor: backgroundColors.length
          ? backgroundColors
          : ["#E0E0E0"],
        borderRadius: 10,
      },
    ],
  };

  const options = {
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: "#444", font: { size: 12 } },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 10, color: "#444" },
        grid: { color: "#ddd" },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="data-card hover-card">
      <h3 className="card-title">
        Topic Wise Accuracy — {subject}
      </h3>

      {topics.length === 0 ? (
        <div style={{ textAlign: "center", color: "#777", marginTop: "20px" }}>
          No accuracy data available
        </div>
      ) : (
        <div style={{ width: "420px", height: "320px", margin: "0 auto" }}>
          <Bar
            key={subject} // 🔥 force redraw on subject switch
            data={data}
            options={options}
          />
        </div>
      )}
    </div>
  );
}
