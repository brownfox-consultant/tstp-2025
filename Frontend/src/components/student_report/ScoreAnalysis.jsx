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
        setVisibleCount(2); // Small screen (mobile)
      } else if (width < 1024) {
        setVisibleCount(4); // Medium screen (tablet)
      } else if (width < 1300) {
        setVisibleCount(6); // Large screen
      } else if (width < 1400) {
        setVisibleCount(8); // XL screen (1300px+)
      } else {
        setVisibleCount(10); // XXL screen (1400px+)
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

    /* ================= BUILD CHART DATA ================= */
    const chart = [
      {
        name: "Test 1",
        Overall: data.overall_score,
        Math: data.math_score,
        English: data.english_score,
      },
      {
        name: "Test 2",
        Overall: data.overall_score,
        Math: data.math_score,
        English: data.english_score,
      },
      {
        name: "Test 3",
        Overall: data.overall_score,
        Math: data.math_score,
        English: data.english_score,
      },
      {
        name: "Test 4",
        Overall: data.overall_score,
        Math: data.math_score,
        English: data.english_score,
      },
      {
        name: "Test 5",
        Overall: data.overall_score,
        Math: data.math_score,
        English: data.english_score,
      },
      {
        name: "Test 6",
        Overall: data.overall_score,
        Math: data.math_score,
        English: data.english_score,
      },
      {
        name: "Test 7",
        Overall: data.overall_score,
        Math: data.math_score,
        English: data.english_score,
      },
      {
        name: "Test 8",
        Overall: data.overall_score,
        Math: data.math_score,
        English: data.english_score,
      },
      {
        name: "Test 9",
        Overall: data.overall_score,
        Math: data.math_score,
        English: data.english_score,
      },
      {
        name: "Test 10",
        Overall: data.overall_score,
        Math: data.math_score,
        English: data.english_score,
      },
      {
        name: "Test 11",
        Overall: data.overall_score,
        Math: data.math_score,
        English: data.english_score,
      },
      {
        name: "Test 12",
        Overall: data.overall_score,
        Math: data.math_score,
        English: data.english_score,
      },
      {
        name: "Recent",
        Overall: data.overall_score,
        Math: data.math_score,
        English: data.english_score,
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

        {/* Chart with Navigation Arrows */}
        <div className="relative flex items-center">
          {/* Left Arrow */}
          {!hideButtons && (
            <button
              onClick={handlePrev}
              disabled={!canGoLeft}
              className={`absolute left-0 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                canGoLeft 
                  ? 'bg-cyan-500 text-white shadow-lg hover:bg-cyan-600 hover:scale-110 cursor-pointer' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
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

          {/* Right Arrow */}
          {!hideButtons && (
            <button
              onClick={handleNext}
              disabled={!canGoRight}
              className={`absolute right-0 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                canGoRight 
                  ? 'bg-cyan-500 text-white shadow-lg hover:bg-cyan-600 hover:scale-110 cursor-pointer' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
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
