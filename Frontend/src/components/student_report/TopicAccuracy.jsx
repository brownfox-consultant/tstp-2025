"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
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
  graphPattern = "bar",
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

  const chartData = topics.map((t, i) => {
    const val = Number(t.accuracy_percent) || 0;
    return {
      topic: t.topic,
      shortTopic: t.topic.length > 16 ? t.topic.slice(0, 14) + "…" : t.topic,
      value: val,
      color: val > 0 ? colors[i % colors.length] : "#E0E0E0",
      rawTopic: t.topic,
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-xl border border-gray-100 text-xs z-50">
          <p className="font-bold text-gray-800 mb-1">{data.topic}</p>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-gray-600">Accuracy:</span>
            <span className="font-extrabold text-blue-600">{data.value.toFixed(0)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderBarLabel = (props) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null) return null;
    const isZero = Number(value) === 0;
    const labelY = isZero ? y - 6 : y < 20 ? y + 16 : y - 8;
    const fill = !isZero && y < 20 ? "#ffffff" : "#4b5563";

    return (
      <text
        x={x + width / 2}
        y={labelY}
        fill={fill}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
      >
        {`${Math.round(value)}%`}
      </text>
    );
  };

  const activePattern =
    graphPattern === "stepLine"
      ? "stepLine"
      : graphPattern === "area"
      ? "area"
      : "bar";

  return (
    <div className="card-layout">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <h3 className="text-[18px] font-bold text-[#333]">
          Topic Wise Accuracy — {subject}
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100 self-start sm:self-auto capitalize">
          {activePattern === "stepLine" ? "Step Line" : activePattern === "area" ? "Area Chart" : "Bar Graph"}
        </span>
      </div>

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
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              {activePattern === "bar" ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 25, right: 25, left: 10, bottom: 15 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="shortTopic"
                    tick={{ fontSize: 11, fill: "#4b5563" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    width={38}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                    ticks={[0, 20, 40, 60, 80, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                  <Bar
                    dataKey="value"
                    isAnimationActive={true}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                    label={renderBarLabel}
                  >
                    {chartData.map((item, i) => (
                      <Cell key={i} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : activePattern === "stepLine" ? (
                <LineChart
                  data={chartData}
                  margin={{ top: 30, right: 25, left: 10, bottom: 15 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="shortTopic"
                    tick={{ fontSize: 11, fill: "#4b5563" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    width={38}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                    ticks={[0, 20, 40, 60, 80, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="stepAfter"
                    dataKey="value"
                    stroke="#0071BC"
                    strokeWidth={2.5}
                    dot={{ r: 4.5, stroke: "#0071BC", strokeWidth: 2, fill: "#fff" }}
                    activeDot={{ r: 6.5, fill: "#0071BC" }}
                  />
                </LineChart>
              ) : (
                <AreaChart
                  data={chartData}
                  margin={{ top: 25, right: 25, left: 10, bottom: 15 }}
                >
                  <defs>
                    <linearGradient id="areaAccGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0071BC" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0071BC" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="shortTopic"
                    tick={{ fontSize: 11, fill: "#4b5563" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    width={38}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                    ticks={[0, 20, 40, 60, 80, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="linear"
                    dataKey="value"
                    stroke="#0071BC"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#areaAccGrad)"
                    dot={{ r: 4, stroke: "#0071BC", strokeWidth: 2, fill: "#fff" }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Legend at bottom */}
          <div className="topic-accuracy-legend flex flex-wrap gap-2.5 mt-3 justify-center">
            {chartData.map((item, i) => (
              <div key={i} className="topic-legend-item flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-700">
                  {item.topic} <strong className="text-gray-900 font-extrabold">{item.value.toFixed(0)}%</strong>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
