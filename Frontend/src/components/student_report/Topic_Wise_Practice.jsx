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

export default function Topic_Wise_Practice({
  student_id,
  course_id,
  test_type,
  subject, // "English" | "Math"
  graphPattern = "bar",
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
        `${BASE_URL}/api/result/Topic_Wise_Practice/?student_id=${student_id}&course_id=${course_id}&test_type=${test_type}`,
        { withCredentials: true }
      );

      const subjectData = res.data.find(
        (item) => item.subject?.toLowerCase() === subject?.toLowerCase()
      );

      setTopics(subjectData?.topics || []);
    } catch (err) {
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if no topics OR all topics have 0% practice
  const hasNoData = !topics.length || topics.every((t) => (t.practice_percent || 0) === 0);

  if (hasNoData) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-extrabold text-gray-800 mb-6">
          Topic Wise Practice — {subject}
        </h3>
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl border border-gray-200 p-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-slate-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-gray-700 mb-2">No Data Available</h4>
          <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
            Start practicing to see your topic-wise practice distribution here!
          </p>
        </div>
      </div>
    );
  }

  const backgroundColors = [
    "#F59403",
    "#FFD36A",
    "#2E2725",
    "#805B30",
    "#0071BC",
    "#70D9E4",
  ];

  const chartData = topics.map((t, i) => {
    const val = Math.round(t.practice_percent || 0);
    return {
      topic: t.topic,
      shortTopic: t.topic.length > 16 ? t.topic.slice(0, 14) + "…" : t.topic,
      value: val,
      color: backgroundColors[i % backgroundColors.length],
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
            <span className="text-gray-600">Practice Share:</span>
            <span className="font-extrabold text-orange-600">{data.value}%</span>
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
        <h3 className="text-lg font-extrabold text-gray-800">
          Topic Wise Practice — {subject}
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100 self-start sm:self-auto capitalize">
          {activePattern === "stepLine" ? "Step Line" : activePattern === "area" ? "Area Chart" : "Bar Graph"}
        </span>
      </div>

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
                stroke="#F59403"
                strokeWidth={2.5}
                dot={{ r: 4.5, stroke: "#F59403", strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 6.5, fill: "#F59403" }}
              />
            </LineChart>
          ) : (
            <AreaChart
              data={chartData}
              margin={{ top: 25, right: 25, left: 10, bottom: 15 }}
            >
              <defs>
                <linearGradient id="areaPracticeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59403" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F59403" stopOpacity={0.02} />
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
                stroke="#F59403"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#areaPracticeGrad)"
                dot={{ r: 4, stroke: "#F59403", strokeWidth: 2, fill: "#fff" }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-2.5 mt-3 justify-center">
        {chartData.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
            <span
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-700">
              {item.topic} <strong className="text-gray-900 font-extrabold">{item.value}%</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
