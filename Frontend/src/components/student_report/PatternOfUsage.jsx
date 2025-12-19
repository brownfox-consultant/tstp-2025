"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { FaClock, FaQuestionCircle, FaInfoCircle } from "react-icons/fa";
import { BASE_URL } from "@/app/constants/apiConstants";

export default function PatternOfUsage({
  student_id,
  course_id,
  test_type, // fullLength | practiceTest
}) {
  const [usageData, setUsageData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  
  const ITEMS_PER_PAGE = 7;

  /* ================= FETCH API ================= */
  useEffect(() => {
    if (!student_id || !course_id || !test_type) return;
    fetchPatternOfUsage();
  }, [student_id, course_id, test_type]);

  const fetchPatternOfUsage = async () => {
    try {
      setLoading(true);

      const apiTestType =
        test_type === "fullLength" ? "FULL_LENGTH" : "PRACTICE";

      const res = await axios.get(
        `${BASE_URL}/api/result/pattern-of-usage/?student_id=${student_id}&course_id=${course_id}&test_type=${apiTestType}`,
        { withCredentials: true }
      );

      const formatted = res.data.results.map((row, index) => ({
        date: row.date,
        time: row.time || 0,
        questions: row.questions || 0,
        details: row.details || "No details available",
        index,
      }));

      setUsageData(formatted);
    } catch (error) {
      console.error("Pattern of Usage API error:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= PAGINATION ================= */
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, usageData.length);
  const displayData = usageData.slice(startIndex, endIndex);
  
  const canGoLeft = startIndex > 0;
  const canGoRight = endIndex < usageData.length;

  const handlePrev = () => {
    setStartIndex(Math.max(0, startIndex - ITEMS_PER_PAGE));
  };

  const handleNext = () => {
    setStartIndex(Math.min(usageData.length - ITEMS_PER_PAGE, startIndex + ITEMS_PER_PAGE));
  };

  /* ================= UI HELPERS ================= */

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-xl rounded-xl border border-gray-200">
          <p className="font-bold text-gray-800 mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FaClock className="text-blue-500" size={14} />
              <span className="text-sm">
                Time: <strong>{payload[0]?.value} mins</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaQuestionCircle className="text-green-500" size={14} />
              <span className="text-sm">
                Questions: <strong>{payload[1]?.value}</strong>
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderLabel = ({ x, y, width, value }) => {
    if (!value) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 6}
        fill="#374151"
        textAnchor="middle"
        fontSize={12}
        fontWeight={600}
      >
        {value}
      </text>
    );
  };

  const handleBarClick = (data) => {
    setSelectedDate(data);
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500 text-lg">
        Loading pattern of usage...
      </div>
    );
  }

  /* ================= RENDER ================= */

  return (
    <div className="w-full py-8">

      {/* CHART CONTAINER */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow p-8 border relative">

          {/* Left Arrow */}
          {canGoLeft && (
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
          )}

          {/* Right Arrow */}
          {canGoRight && (
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
              </svg>
            </button>
          )}

          {/* LEGEND */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-sm font-medium">Time (Minutes)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm font-medium">Questions</span>
            </div>
          </div>

          {/* BAR CHART */}
          <div className="h-[420px] bg-gray-50 rounded-xl p-6 mx-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayData}
                margin={{ top: 30, right: 30, left: 10, bottom: 20 }}
                barCategoryGap="20%"
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#374151", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />

                <Bar
                  dataKey="time"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                  onClick={handleBarClick}
                >
                  <LabelList dataKey="time" content={renderLabel} />
                  {displayData.map((_, index) => (
                    <Cell key={`time-${index}`} className="cursor-pointer" />
                  ))}
                </Bar>

                <Bar
                  dataKey="questions"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                  onClick={handleBarClick}
                >
                  <LabelList dataKey="questions" content={renderLabel} />
                  {displayData.map((_, index) => (
                    <Cell key={`q-${index}`} className="cursor-pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Page Indicator */}
          {usageData.length > ITEMS_PER_PAGE && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <span className="text-sm text-gray-500">
                Showing {startIndex + 1}-{endIndex} of {usageData.length} dates
              </span>
            </div>
          )}

          {/* SELECTED DATE DETAILS */}
          {selectedDate && (
            <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaInfoCircle className="text-purple-600" />
                Details for {selectedDate.date}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded shadow">
                  <p className="text-xs uppercase text-gray-500">Time Spent</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedDate.time} min
                  </p>
                </div>

                <div className="bg-white p-4 rounded shadow">
                  <p className="text-xs uppercase text-gray-500">
                    Questions Solved
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedDate.questions}
                  </p>
                </div>

                <div className="bg-white p-4 rounded shadow">
                  <p className="text-xs uppercase text-gray-500">Session Info</p>
                  <p className="text-sm font-semibold">
                    {selectedDate.details}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
