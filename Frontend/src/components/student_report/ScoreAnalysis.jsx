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
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(6);
  const [hideButtons, setHideButtons] = useState(false);

  /* ================= RESPONSIVE VISIBLE COUNT ================= */
  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      
      // Hide buttons below 500px
      setHideButtons(width < 500);
      
      if (width < 640) {
        setVisibleCount(2);
      } else if (width < 1024) {
        setVisibleCount(4);
      } else if (width < 1300) {
        setVisibleCount(6);
      } else if (width < 1400) {
        setVisibleCount(8); 
      } else {
        setVisibleCount(10); 
      }
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

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

    /* ================= BUILD CHART DATA DYNAMICALLY ================= */
    const chart = data.tests.map((test, index) => ({
      name: test.test_name || `Test ${index + 1}`,
      Overall: test.overall_score,
      Math: test.math_score,
      English: test.english_score,
      id: test.test_submission_id
    }));

    const maxScore = 1600; 

const avgScore =
  chart.length > 0
    ? chart.reduce((sum, test) => sum + test.Overall, 0) / chart.length
    : 0;

const percentage = Math.round((avgScore / maxScore) * 100);


    

    setChartData(chart);
    setSummary({
      overall_score: data.overall_score,
      math_score: data.math_score,
      english_score: data.english_score,
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

  /* ================= NAVIGATION ================= */
  const displayData = chartData.slice(startIndex, startIndex + visibleCount);
  const canGoLeft = startIndex > 0;
  const canGoRight = startIndex + visibleCount < chartData.length;
  const needsPagination = chartData.length > visibleCount;

  const handlePrev = () => {
    if (canGoLeft) {
      setStartIndex(prev => Math.max(0, prev - visibleCount));
    }
  };

  const handleNext = () => {
    if (canGoRight) {
      setStartIndex(prev => Math.min(chartData.length - visibleCount, prev + visibleCount));
    }
  };

  /* ================= EMPTY STATE ================= */
  if (!chartData || chartData.length === 0) {
    return (
      <div className="py-10">
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Test Data Available</h3>
          <p className="text-gray-500 max-w-md leading-relaxed">
            You haven't taken any tests for this course yet. Complete your first test to see your score analysis and track your performance over time!
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>Your score trends and analytics will appear here after completing tests</span>
          </div>
        </div>
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

        {/* Chart with Navigation Arrows */}
        <div className="relative flex items-center">
          {/* Left Arrow - Only show when pagination is needed AND can go left */}
          {!hideButtons && needsPagination && canGoLeft && (
            <button
              onClick={handlePrev}
              className="absolute left-0 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-cyan-500 text-white shadow-lg hover:bg-cyan-600 hover:scale-110 cursor-pointer"
              style={{ left: '-5px' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Chart */}
          <div className={`h-[350px] w-full flex justify-center ${hideButtons ? 'px-2' : 'px-12'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData} barGap={4} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  domain={[0, summary.max_score || 1600]}
                  fontSize={11}
                />
                <Tooltip />

                <Bar
                  dataKey="Overall"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                  label={{ position: "top", fill: "#3b82f6", fontWeight: "bold", fontSize: 10 }}
                />
                <Bar
                  dataKey="Math"
                  fill="#818cf8"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                  label={{ position: "top", fill: "#818cf8", fontWeight: "bold", fontSize: 10 }}
                />
                <Bar
                  dataKey="English"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                  label={{ position: "top", fill: "#10b981", fontWeight: "bold", fontSize: 10 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Right Arrow - Only show when pagination is needed AND can go right */}
          {!hideButtons && needsPagination && canGoRight && (
            <button
              onClick={handleNext}
              className="absolute right-0 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-cyan-500 text-white shadow-lg hover:bg-cyan-600 hover:scale-110 cursor-pointer"
              style={{ right: '-5px' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Page Indicator */}
        {chartData.length > visibleCount && (
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: Math.ceil(chartData.length / visibleCount) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStartIndex(idx * visibleCount)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  Math.floor(startIndex / visibleCount) === idx 
                    ? 'bg-cyan-500 w-6' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
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
