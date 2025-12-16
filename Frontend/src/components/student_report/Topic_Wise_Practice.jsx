"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { BASE_URL } from "@/app/constants/apiConstants";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Topic_Wise_Practice({
  student_id,
  course_id,
  test_type,
  subject, // "English" | "Math"
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
      const res = await axios.get(
        `${BASE_URL}/api/result/Topic_Wise_Practice/?student_id=${student_id}&course_id=${course_id}&test_type=${test_type}`,
        { withCredentials: true }
      );

      // ✅ FILTER ONLY REQUIRED SUBJECT
      const subjectData = res.data.find(
        (item) => item.subject === subject
      );

      setTopics(subjectData?.topics || []);
    } catch (err) {
      console.error("Topic Wise Practice API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!topics.length) return <div>No data available</div>;

  /* ❌ COLORS MUST NOT CHANGE */
  const backgroundColors = [
    "#F59403",
    "#FFD36A",
    "#2E2725",
    "#805B30",
    "#0071BC",
    "#70D9E4",
  ];

  const data = {
    labels: topics.map(
      (t) => `${t.topic} ${Math.round(t.practice_percent)}%`
    ),
    datasets: [
      {
        data: topics.map((t) => Math.round(t.practice_percent)),
        backgroundColor: backgroundColors,
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="data-card hover-card">
      <h3 className="card-title">
        Topic Wise Practice — {subject}
      </h3>

      {/* PIE */}
      <div style={{ width: "300px", margin: "0 auto", paddingBottom: "10px" }}>
        <Pie
          data={data}
          options={{
            plugins: { legend: { display: false } },
            cutout: "60%",
          }}
        />
      </div>

      {/* ✅ IMAGE-STYLE TEXT STRUCTURE */}
      <div className="text-legend-grid">
        {topics.map((t, i) => (
          <div key={i} className="text-legend-item">
            {t.topic} {Math.round(t.practice_percent)}%
          </div>
        ))}
      </div>

      <style jsx>{`
        .text-legend-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px 20px;
          margin-top: 10px;
          text-align: center;
        }

        .text-legend-item {
          font-size: 13px;
          font-weight: 600;
          color: #111;
          white-space: nowrap;
        }

        @media (max-width: 480px) {
          .text-legend-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
