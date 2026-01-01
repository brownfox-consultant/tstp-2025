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
    <div className="card-layout">
      <h3 className="text-[18px] font-bold text-[#333] mb-5">
        Topic Wise Accuracy — {subject}
      </h3>

      {topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl border border-gray-200 p-8 text-center mt-4">
          <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-slate-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-base font-bold text-gray-700 mb-1">No Data Available</h4>
          <p className="text-gray-500 text-sm max-w-xs">
            Practice topics to see your topic-wise accuracy here!
          </p>
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
