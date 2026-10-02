"use client";

import React, { useState, useEffect } from "react";
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
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { BASE_URL } from "@/app/constants/apiConstants";

export default function Math_SubTopicPracticeStyled({
  student_id,
  course_id,
  test_type,
  graphPattern = "bar",
}) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(0);

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

  if (!topics.length) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
        <div className="text-gray-400 text-lg">No math sub-topic data available</div>
      </div>
    );
  }

  const activePattern =
    graphPattern === "stepLine"
      ? "stepLine"
      : graphPattern === "area"
      ? "area"
      : "bar";

  /* ---------------- 1. HORIZONTAL BAR CHART ---------------- */
  const renderBarChart = (section, index) => {
    const chartData = section.subtopics.map((sub) => ({
      name: sub.subtopic,
      accuracy: sub.accuracy_percent || 0,
      questions: sub.practiced_questions || 0,
      avgTime: sub.avg_time_seconds || 0,
    }));

    // Calculate dynamic height based on number of subtopics
    const chartHeight = Math.max(300, chartData.length * 70);

    return (
      <div key={index} className="card-layout">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h3 className="text-xl font-bold text-gray-800">{section.topic}</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
            Bar Graph
          </span>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 md:gap-6 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-xs md:text-sm font-medium text-gray-600">Accuracy %</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            <span className="text-xs md:text-sm font-medium text-gray-600">Questions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            <span className="text-xs md:text-sm font-medium text-gray-600">Avg Time (sec)</span>
          </div>
        </div>

        {/* Desktop: Horizontal Bar Chart */}
        <div className="hidden md:block" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 50, left: 20, bottom: 10 }}
              barGap={2}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#666', fontSize: 14 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#374151', fontSize: 13, fontWeight: 500 }}
                width={180}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
                  if (name === 'questions') return [value, 'Questions'];
                  if (name === 'avgTime') return [`${value}s`, 'Avg Time'];
                  return [value, name];
                }}
                cursor={{ fill: 'transparent' }} 
              />

              <Bar
                dataKey="accuracy"
                fill="#10b981"
                radius={[0, 4, 4, 0]}
                barSize={14}
              >
                <LabelList
                  dataKey="accuracy"
                  position="right"
                  formatter={(val) => `${val}%`}
                  style={{ fill: '#10b981', fontSize: 13, fontWeight: 600 }}
                />
              </Bar>

              <Bar
                dataKey="questions"
                fill="#f97316"
                radius={[0, 4, 4, 0]}
                barSize={14}
              >
                <LabelList
                  dataKey="questions"
                  position="right"
                  style={{ fill: '#f97316', fontSize: 13, fontWeight: 600 }}
                />
              </Bar>

              <Bar
                dataKey="avgTime"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
                barSize={14}
              >
                <LabelList
                  dataKey="avgTime"
                  position="right"
                  formatter={(val) => `${val}s`}
                  style={{ fill: '#3b82f6', fontSize: 13, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mobile: Stacked Layout (Name above, bar chart below) */}
        <div className="md:hidden space-y-6">
          {chartData.map((item, idx) => {
            const mobileData = [
              { name: 'Accuracy', value: item.accuracy, fill: '#10b981' },
              { name: 'Questions', value: item.questions, fill: '#f97316' },
              { name: 'Avg Time', value: item.avgTime, fill: '#3b82f6' },
            ];

            return (
              <div key={idx} className="border-b border-gray-100 pb-4 last:border-0">
                {/* Subtopic Name */}
                <p className="text-sm font-bold text-gray-800 mb-2 bg-gray-50 p-2 rounded-lg">{item.name}</p>

                {/* Bar Chart */}
                <div style={{ height: 120 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mobileData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 0, bottom: 20 }}
                      barCategoryGap="20%"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        ticks={[0, 20, 40, 60, 80, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fill: '#666', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#666', fontSize: 10, fontWeight: 500 }}
                        width={70}
                      />
                      <Bar
                        dataKey="value"
                        radius={[0, 4, 4, 0]}
                        barSize={14}
                      >
                        {mobileData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="right"
                          formatter={(val, name, entry) => {
                            if (entry && entry.name === 'Accuracy') return `${val}%`;
                            if (entry && entry.name === 'Avg Time') return `${val}s`;
                            return val;
                          }}
                          style={{ fill: '#374151', fontSize: 10, fontWeight: 600 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ---------------- 2. STEP LINE CHART PATTERN ---------------- */
  const renderStepLineChart = (section, index) => {
    const chartData = (section.subtopics || []).map((sub) => ({
      name: sub.subtopic,
      shortName: sub.subtopic.length > 15 ? sub.subtopic.slice(0, 13) + "…" : sub.subtopic,
      accuracy: sub.accuracy_percent || 0,
      questions: sub.practiced_questions || 0,
      avgTime: sub.avg_time_seconds || 0,
    }));

    return (
      <div key={index} className="card-layout">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h3 className="text-xl font-bold text-gray-800">{section.topic}</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
            Step Line
          </span>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 md:gap-6 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-xs md:text-sm font-medium text-gray-600">Accuracy %</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            <span className="text-xs md:text-sm font-medium text-gray-600">Questions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            <span className="text-xs md:text-sm font-medium text-gray-600">Avg Time (sec)</span>
          </div>
        </div>

        <div className="w-full h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 25, right: 25, left: 10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fill: "#4b5563" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
                interval={0}
                padding={{ left: 15, right: 15 }}
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
              <Tooltip
                formatter={(value, name) => {
                  if (name === "Accuracy %") return [`${value}%`, name];
                  if (name === "Questions") return [value, name];
                  if (name === "Avg Time (sec)") return [`${value}s`, name];
                  return [value, name];
                }}
                labelFormatter={(label, payload) => {
                  const item = payload && payload[0]?.payload;
                  return item ? item.name : label;
                }}
              />
              <Line
                type="stepAfter"
                name="Accuracy %"
                dataKey="accuracy"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4.5, stroke: "#10b981", strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 6.5 }}
              />
              <Line
                type="stepAfter"
                name="Questions"
                dataKey="questions"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ r: 4, stroke: "#f97316", strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="stepAfter"
                name="Avg Time (sec)"
                dataKey="avgTime"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, stroke: "#3b82f6", strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /* ---------------- 3. AREA CHART PATTERN ---------------- */
  const renderAreaChart = (section, index) => {
    const chartData = (section.subtopics || []).map((sub) => ({
      name: sub.subtopic,
      shortName: sub.subtopic.length > 15 ? sub.subtopic.slice(0, 13) + "…" : sub.subtopic,
      accuracy: sub.accuracy_percent || 0,
      questions: sub.practiced_questions || 0,
      avgTime: sub.avg_time_seconds || 0,
    }));

    return (
      <div key={index} className="card-layout">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h3 className="text-xl font-bold text-gray-800">{section.topic}</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
            Area Chart
          </span>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 md:gap-6 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-xs md:text-sm font-medium text-gray-600">Accuracy %</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            <span className="text-xs md:text-sm font-medium text-gray-600">Questions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            <span className="text-xs md:text-sm font-medium text-gray-600">Avg Time (sec)</span>
          </div>
        </div>

        <div className="w-full h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 25, right: 25, left: 10, bottom: 25 }}
            >
              <defs>
                <linearGradient id={`mathAreaAccGrad_${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id={`mathAreaQGrad_${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id={`mathAreaTGrad_${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fill: "#4b5563" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
                interval={0}
                padding={{ left: 15, right: 15 }}
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
              <Tooltip
                formatter={(value, name) => {
                  if (name === "Accuracy %") return [`${value}%`, name];
                  if (name === "Questions") return [value, name];
                  if (name === "Avg Time (sec)") return [`${value}s`, name];
                  return [value, name];
                }}
                labelFormatter={(label, payload) => {
                  const item = payload && payload[0]?.payload;
                  return item ? item.name : label;
                }}
              />
              <Area
                type="linear"
                name="Accuracy %"
                dataKey="accuracy"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#mathAreaAccGrad_${index})`}
                dot={{ r: 4, stroke: "#10b981", strokeWidth: 2, fill: "#fff" }}
              />
              <Area
                type="linear"
                name="Questions"
                dataKey="questions"
                stroke="#f97316"
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#mathAreaQGrad_${index})`}
                dot={{ r: 3.5, stroke: "#f97316", strokeWidth: 1.5, fill: "#fff" }}
              />
              <Area
                type="linear"
                name="Avg Time (sec)"
                dataKey="avgTime"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#mathAreaTGrad_${index})`}
                dot={{ r: 3.5, stroke: "#3b82f6", strokeWidth: 1.5, fill: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800">Sub–Topic Wise Practice</h2>
        </div>

        {/* Topic Navigation Pills */}
        {topics.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {topics.map((t, i) => (
              <button
                key={i}
                onClick={() => setActiveSection(i)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer ${
                  activeSection === i
                    ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {t.topic}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Render Active Section according to pattern */}
      {activePattern === "bar" ? (
        topics.length > 1 ? (
          renderBarChart(topics[activeSection], activeSection)
        ) : (
          topics.map((section, index) => renderBarChart(section, index))
        )
      ) : activePattern === "stepLine" ? (
        topics.length > 1 ? (
          renderStepLineChart(topics[activeSection], activeSection)
        ) : (
          topics.map((section, index) => renderStepLineChart(section, index))
        )
      ) : (
        topics.length > 1 ? (
          renderAreaChart(topics[activeSection], activeSection)
        ) : (
          topics.map((section, index) => renderAreaChart(section, index))
        )
      )}
    </div>
  );
}
