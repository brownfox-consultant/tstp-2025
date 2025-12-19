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
} from "recharts";
import { BASE_URL } from "@/app/constants/apiConstants";

export default function ScoreAnalysis({
  student_id,
  course_id,
  test_type,   // fullLength | practiceTest
  courseName = "Course",
}) {
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH API ================= */
  useEffect(() => {
    if (!student_id || !course_id || !test_type) return;
    fetchScoreAnalysis();
  }, [student_id, course_id, test_type]);

 const fetchScoreAnalysis = async () => {
  try {
    setLoading(true);

    const apiTestType =
      test_type === "fullLength" ? "FULL_LENGTH" : "PRACTICE";

    const res = await axios.get(
      `${BASE_URL}/api/result/score-analysis/`,
      {
        params: {
          student_id,
          course_id,
          test_type: apiTestType,
        },
        withCredentials: true,
      }
    );

    const data = res.data;

    /* ================= BUILD CHART DATA ================= */
    const chart = [
      {
        name: "Recent",
        Overall: data.overall_score,
        Math: data.math_score,
        English: data.english_score, // ✅ FIX
      },
    ];

    /* ================= BUILD SUMMARY ================= */
    const maxScore = 1600;
    const percentage = Math.round(
      (data.overall_score / maxScore) * 100
    );

    setChartData(chart);
    setSummary({
      overall_score: data.overall_score,
      math_score: data.math_score,
      english_score: data.english_score, // ✅ FIX
      highest_score: data.highest_score,
      improvement: data.improvement,
      percentage,
      max_score: maxScore,
    });

  } catch (err) {
    console.error("Score analysis API error:", err);
  } finally {
    setLoading(false);
  }
};



  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        Loading score analysis...
      </div>
    );
  }

  if (!summary) return null;

  /* ================= RENDER ================= */
  return (
    <div className="space-y-8 animate-fadeIn mb-10">

      {/* ================= SCORE CHART ================= */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
          {courseName} Analysis
        </h3>

        <div className="h-[400px] w-full flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={10}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                domain={[0, summary.max_score || 1600]}
              />
              <Tooltip />

              <Bar
                dataKey="Overall"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={60}
                label={{ position: "top", fill: "#3b82f6", fontWeight: "bold" }}
              />
              <Bar
                dataKey="Math"
                fill="#818cf8"
                radius={[4, 4, 0, 0]}
                barSize={60}
                label={{ position: "top", fill: "#818cf8", fontWeight: "bold" }}
              />
             <Bar
  dataKey="English"
  fill="#10b981"
  radius={[4, 4, 0, 0]}
  barSize={60}
  label={{ position: "top", fill: "#10b981", fontWeight: "bold" }}
/>

            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Percentage */}
        <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-[#FFF8EB] to-[#FFF0D4]">
          <h4 className="text-sm font-semibold uppercase mb-2 text-[#805830]">
            {courseName} Percentage
          </h4>
          <div className="text-5xl font-black text-[#F59403]">
            {summary.percentage}%
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${summary.percentage}%`,
                background: "linear-gradient(90deg, #F59403, #FFD36A)",
              }}
            />
          </div>
        </div>

        {/* Highest Score */}
        <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-[#E8F4FC] to-[#D4F1F9]">
          <h4 className="text-sm font-semibold uppercase mb-2 text-[#2E2725]">
            Highest Score in {courseName}
          </h4>
          <div className="text-5xl font-black text-[#0071BC]">
            {summary.highest_score}
          </div>
          <div className="text-lg text-[#70D9E4]">
            out of {summary.max_score}
          </div>
        </div>

        {/* Improvement */}
        <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-[#FAF5F0] to-[#F5EBE0]">
          <h4 className="text-sm font-semibold uppercase mb-2 text-[#805830]">
            Score Improvement
          </h4>
          <div className="text-5xl font-black text-[#805830]">
            {summary.improvement}
          </div>
          <p className="mt-2 text-xs text-[#2E2725]">
            Compared to last 2 tests
          </p>
        </div>

      </div>
    </div>
  );
}
