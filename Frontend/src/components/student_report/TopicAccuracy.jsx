"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { BASE_URL } from "@/app/constants/apiConstants";

export default function TopicAccuracy({
  student_id,
  course_id,
  test_type,
  subject,
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

      // Filter by subject
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

  // Prepare chart data
  const colors = [
    "#F59403",
    "#FFD36A",
    "#2E2725",
    "#805B30",
    "#0071BC",
    "#70D9E4",
  ];

  const chartData = topics.map((t, i) => ({
    topic: t.topic,
    value: t.accuracy_percent || 0,
    color: (t.accuracy_percent || 0) > 0 ? colors[i % colors.length] : "#E0E0E0",
  }));

  return (
    <div className="data-card accuracy-card">
      <h3 className="card-title">
        Topic Wise Accuracy — {subject}
      </h3>

      {topics.length === 0 ? (
        <div style={{ textAlign: "center", color: "#777", marginTop: "20px" }}>
          No accuracy data available
        </div>
      ) : (
        <>
          <div style={{ width: "100%", height: 315 }}>
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />

                <XAxis
                  dataKey="topic"
                  tick={false}
                  axisLine={{ stroke: "#333" }}
                  tickLine={false}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: "#333" }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  ticks={[0, 20, 40, 60, 80, 100]}
                />

                <Tooltip
                  formatter={(value) => `${value}%`}
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                />

                <Bar
                  dataKey="value"
                  isAnimationActive={true}
                  barSize={40}
                >
                  {chartData.map((item, i) => (
                    <Cell key={i} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend at bottom */}
          <div className="topic-accuracy-legend" style={{ marginTop: '8px' }}>
            {chartData.map((item, i) => (
              <div key={i} className="topic-legend-item">
                <span 
                  className="topic-legend-dot" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="topic-legend-text">
                  {item.topic} <strong>{item.value.toFixed(0)}%</strong>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
