"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { BASE_URL } from "@/app/constants/apiConstants";
import SkeletonChart from "@/components/common/SkeletonChart";
import EmptyState from "@/components/common/EmptyState";


const EndLabel = (props) => {
  const { x, y, stroke, value, index, dataLength, name, offsetY = 0 } = props;
  if (index !== dataLength - 1) return null;

  return (
    <g>
      {/* Bullet point matching the line color */}
      <circle
        cx={x + 18}
        cy={y + offsetY}
        r={3}
        fill={stroke}
      />
      {/* Label Text */}
      <text
        x={x + 26}
        y={y + 4 + offsetY}
        fill={stroke}
        fontSize={10}
        fontWeight="bold"
        textAnchor="start"
      >
        {name}: {value}
      </text>
    </g>
  );
};



export default function ScoreAnalysis_FullLengthTest({
  student_id,
  course_id,
  courseName = "Course",
}) {
  const [chartData, setChartData] = useState([]);
  const [targetScore, setTargetScore] = useState(1400);
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
    if (!student_id || !course_id) return;
    fetchScoreAnalysis();
  }, [student_id, course_id]);

  const fetchScoreAnalysis = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/api/result/score-analysis/`,
        {
          params: {
            student_id,
            course_id,
            test_type: "FULL_LENGTH",
          },
          withCredentials: true,
        }
      );

      const data = res.data;

      let chart = [];

      /* ================= HANDLE FULL LENGTH TESTS ================= */
      if (Array.isArray(data.tests)) {
        chart = data.tests.map((test, index) => ({
          name: test.test_name || `Test ${index + 1}`,
          Overall: test.overall_score,
          Math: test.math_score,
          English: test.english_score,
          id: test.test_submission_id
        }));
      }

      const maxScore = 1600;

      const testScores = Array.isArray(data.tests)
        ? data.tests.map(t => Number(t.overall_score) || 0)
        : [];

      const totalScore = testScores.reduce((sum, s) => sum + s, 0);
      const avgScore = testScores.length > 0
        ? totalScore / testScores.length
        : 0;

      const percentage = maxScore > 0
        ? Math.round((avgScore / maxScore) * 100)
        : 0;

      setChartData(chart);
      setSummary({
        overall_score: data.overall_score ?? 0,
        math_score: data.math_score ?? 0,
        english_score: data.english_score ?? 0,
        highest_score: data.highest_score ?? 0,
        improvement: data.improvement ?? 0,
        percentage: percentage || 0,
        max_score: maxScore,
        total_full_length_tests: data.total_full_length_tests ?? 0,
        total_practice_tests: data.total_practice_tests ?? 0,      
      });


    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  /* ================= NAVIGATION ================= */
  const displayData = chartData.slice(startIndex, startIndex + visibleCount);
  const canGoLeft = startIndex > 0;
  const canGoRight = startIndex + visibleCount < chartData.length;
  const needsPagination = chartData.length > visibleCount;

  // Calculate offsets for end labels
  const lastPoint = displayData[displayData.length - 1];
  const lastMath = lastPoint?.Math;
  const lastEnglish = lastPoint?.English;

  let mathLabelOffset = 0;
  let englishLabelOffset = 0;
  if (typeof lastMath === "number" && typeof lastEnglish === "number") {
    const diff = lastMath - lastEnglish;
    if (Math.abs(diff) < 50) {
      if (diff >= 0) {
        mathLabelOffset = -12;
        englishLabelOffset = 12;
      } else {
        englishLabelOffset = -12;
        mathLabelOffset = 12;
      }
    }
  }

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


  /* ================= LOADING & EMPTY STATES ================= */
  if (loading) {
    return <SkeletonChart height="400px" className="my-6" />;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <EmptyState
        title="No Full-Length Test Data Available"
        description="You haven't taken any Full-Length tests for this course yet. Complete your first test to see your score analysis!"
        actionText="Take Practice Test"
        onAction={() => window.location.href = "#"}
        className="my-6"
      />
    );
  }

  if (!summary) return null;


  /* ================= RENDER ================= */
  return (
    <div className="space-y-4 animate-fadeIn">

      {/* ================= MIXED SCORE ANALYSIS CHART ================= */}
      <div className="card-layout overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h3 className="lg:text-xl text-base font-bold text-gray-800">
              Score Analysis & Progression - {courseName}
            </h3>
          </div>

          {/* Interactive Target Score Controller */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 px-3 py-1.5 rounded-xl shadow-sm">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Target Score:
            </span>
            <input
              type="number"
              min="400"
              max="1600"
              step="10"
              value={targetScore}
              onChange={(e) => {
                const val = Math.max(400, Math.min(1600, Number(e.target.value)));
                setTargetScore(val);
              }}
              className="w-16 px-2 py-0.5 text-sm font-black text-center text-blue-600 bg-white border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <input
              type="range"
              min="400"
              max="1600"
              step="20"
              value={targetScore}
              onChange={(e) => setTargetScore(Number(e.target.value))}
              className="w-24 md:w-32 h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Chart with Navigation Arrows */}
        <div className="relative flex items-center">
          {/* Left Arrow */}
          {!hideButtons && needsPagination && canGoLeft && (
            <button
              onClick={handlePrev}
              className="absolute left-0 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-blue-500 text-white shadow-lg hover:bg-blue-600 hover:scale-110 cursor-pointer"
              style={{ left: '-5px' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Combined Chart */}
          <div className={`h-[400px] w-full flex justify-center ${hideButtons ? 'px-2' : 'px-12'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData} margin={{ top: 30, right: 115, bottom: 20, left: 20 }}>
                <defs>
                  <linearGradient id="colorOverallMixed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 1600]}
                  ticks={[0, 400, 800, 1200, 1600]}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                />
                <Tooltip 
                   contentStyle={{ 
                     borderRadius: '12px', 
                     border: 'none', 
                     boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                   }}
                />
                
                {/* Horizontal reference line for Target Score */}
                <ReferenceLine
                  y={targetScore}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Target: ${targetScore}`,
                    position: "insideTopLeft",
                    fill: "#ef4444",
                    fontSize: 11,
                    fontWeight: "bold",
                    dy: 4
                  }}
                />

                {/* Math and English as Lines */}
                <Line
                  type="monotone"
                  dataKey="Math"
                  stroke="#818cf8"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#818cf8", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  name="Math Score"
                  label={
                    <EndLabel
                      dataLength={displayData.length}
                      name="Math"
                      stroke="#818cf8"
                      offsetY={mathLabelOffset}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="English"
                  stroke="#fbbf24"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#fbbf24", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  name="English Score"
                  label={
                    <EndLabel
                      dataLength={displayData.length}
                      name="English"
                      stroke="#fbbf24"
                      offsetY={englishLabelOffset}
                    />
                  }
                />

                {/* Overall Score as Area/Line (Combined) */}
                <Area 
                  type="monotone" 
                  dataKey="Overall" 
                  fill="url(#colorOverallMixed)" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  name="Overall Score"
                  label={
                    <EndLabel
                      dataLength={displayData.length}
                      name="Overall"
                      stroke="#10b981"
                      offsetY={0}
                    />
                  }
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Right Arrow */}
          {!hideButtons && needsPagination && canGoRight && (
            <button
              onClick={handleNext}
              className="absolute right-0 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-blue-500 text-white shadow-lg hover:bg-blue-600 hover:scale-110 cursor-pointer"
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
          <div className="flex justify-center mt-4 gap-2 pb-4">
            {Array.from({ length: Math.ceil(chartData.length / visibleCount) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStartIndex(idx * visibleCount)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${Math.floor(startIndex / visibleCount) === idx
                  ? 'bg-blue-500 w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Total Full-Length Tests */}
        <div className="p-6 rounded-lg lg:rounded-2xl shadow-lg bg-gradient-to-br from-[#FFF8EB] to-[#FFF0D4] flex flex-col justify-between">
          <h4 className="text-sm font-semibold uppercase text-[#805830]">
            Total Full-Length Tests
          </h4>
          <div className="text-5xl font-black text-[#F59403] mt-2">
            {summary.total_full_length_tests}
          </div>
          <p className="text-xs text-[#805830] mt-1">
            Tests completed
          </p>
        </div>

        {/* Percentage */}
        <div className="p-6 rounded-lg lg:rounded-2xl shadow-lg bg-gradient-to-br from-[#EBF4FF] to-[#D4E4FF] flex flex-col justify-between">
          <h4 className="text-sm font-semibold uppercase text-[#1e40af]">
            {courseName} Percentage
          </h4>
          <div className="text-5xl font-black text-[#3b82f6]">
            {summary.percentage}%
          </div>
          <div className="mt-3 w-full bg-blue-100 rounded-full h-2">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${summary.percentage}%`,
                background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
              }}
            />
          </div>
        </div>

        {/* Highest Score */}
        <div className="p-6 rounded-lg lg:rounded-2xl shadow-lg bg-gradient-to-br from-[#E8F4FC] to-[#D4F1F9] flex flex-col justify-between">
          <h4 className="text-sm font-semibold uppercase text-[#2E2725]">
            Highest Score in {courseName}
          </h4>
          <div className="text-5xl font-black text-[#0071BC]">
            {summary.highest_score}
          </div>
          <div className="text-sm text-[#70D9E4]">
            out of {summary.max_score}
          </div>
        </div>

        {/* Improvement */}
        <div className="p-6 rounded-lg lg:rounded-2xl shadow-lg bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] flex flex-col justify-between">
          <h4 className="text-sm font-semibold uppercase text-[#065f46]">
            Score Improvement
          </h4>
          <div className="text-5xl font-black text-[#10b981]">
            {summary.improvement > 0 ? `+${summary.improvement}` : summary.improvement}
          </div>
          <p className="text-xs text-[#047857]">
            Compared to last 2 tests
          </p>
        </div>

      </div>

    </div>
  );
}
