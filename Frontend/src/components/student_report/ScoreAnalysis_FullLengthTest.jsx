"use client";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  ComposedChart,
  BarChart,
  LineChart,
  Area,
  Line,
  Bar,
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
import { Modal } from "antd";
import ReportNew from "@/components/report-module/Report_New";




const CustomStackedTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const mathScore = data.Math;
  const englishScore = data.English;
  const overallScore = data.Overall || (Number(mathScore || 0) + Number(englishScore || 0));
  const testTitle = label || data.name || "Test Details";

  return (
    <div
      className="recharts-default-tooltip"
      style={{
        margin: 0,
        padding: "10px",
        backgroundColor: "#ffffff",
        border: "none",
        whiteSpace: "nowrap",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <p className="recharts-tooltip-label" style={{ margin: 0, color: "#374151" }}>
        {testTitle}
      </p>
      <ul className="recharts-tooltip-item-list" style={{ padding: 0, margin: 0, listStyle: "none" }}>
        <li
          className="recharts-tooltip-item"
          style={{ display: "block", paddingTop: 4, paddingBottom: 4, color: "#818cf8" }}
        >
          <span className="recharts-tooltip-item-name">Math Score</span>
          <span className="recharts-tooltip-item-separator"> : </span>
          <span className="recharts-tooltip-item-value">{mathScore}</span>
        </li>
        <li
          className="recharts-tooltip-item"
          style={{ display: "block", paddingTop: 4, paddingBottom: 4, color: "#fbbf24" }}
        >
          <span className="recharts-tooltip-item-name">English Score</span>
          <span className="recharts-tooltip-item-separator"> : </span>
          <span className="recharts-tooltip-item-value">{englishScore}</span>
        </li>
        <li
          className="recharts-tooltip-item"
          style={{ display: "block", paddingTop: 4, paddingBottom: 4, color: "#10b981" }}
        >
          <span className="recharts-tooltip-item-name">Total Score</span>
          <span className="recharts-tooltip-item-separator"> : </span>
          <span className="recharts-tooltip-item-value">{overallScore}</span>
        </li>
      </ul>
    </div>
  );
};

export default function ScoreAnalysis_FullLengthTest({
  student_id,
  course_id,
  courseName = "Course",
}) {
  const [chartData, setChartData] = useState([]);
  const [targetScore, setTargetScore] = useState(1400);
  const [chartView, setChartView] = useState("line");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(6);
  const [hideButtons, setHideButtons] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

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
          id: test.test_submission_id,
          test_submission_id: test.test_submission_id,
          full_length_test_id: test.full_length_test_id,
          student_id: student_id,
          ...test,
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

  /* ================= SLICED DISPLAY DATA ================= */
  const displayData = chartData.slice(startIndex, startIndex + visibleCount);

  const handleTestClick = (item) => {
    const submissionId = item?.test_submission_id || item?.id;
    if (!submissionId) return;
    setSelectedSubmissionId(submissionId);
    setIsResultModalOpen(true);
  };

  const renderCustomAxisTick = ({ x, y, payload, index }) => {
    const item =
      displayData[payload?.index ?? index] ||
      displayData.find((d) => d.name === payload?.value);

    return (
      <g
        transform={`translate(${x},${y})`}
        style={{ cursor: "pointer", pointerEvents: "all" }}
        onClick={(e) => {
          e.stopPropagation();
          if (item) {
            handleTestClick(item);
          }
        }}
      >
        <text
          x={0}
          y={0}
          dy={14}
          textAnchor="middle"
          fill="#2563eb"
          fontSize={hideButtons ? 10 : 11}
          fontWeight="600"
          className="clickable-test-name"
          style={{ cursor: "pointer", pointerEvents: "all" }}
        >
          <title>{`Click to view result for ${payload?.value}`}</title>
          {payload?.value}
        </text>
      </g>
    );
  };

  const renderMathBarLabel = (props) => {
    const { x, y, width, height, index } = props;
    const item = displayData[index];
    const score = item?.Math;
    if (score == null || height < 18) return null;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    if (height < 36) {
      return (
        <text
          x={centerX}
          y={centerY + 4}
          fill="#ffffff"
          textAnchor="middle"
          fontSize={hideButtons ? 9 : 10}
          fontWeight="700"
        >
          {`Math: ${score}`}
        </text>
      );
    }

    return (
      <g>
        <text
          x={centerX}
          y={centerY - 6}
          fill="#ffffff"
          textAnchor="middle"
          fontSize={hideButtons ? 9 : 10}
          fontWeight="600"
          letterSpacing="0.02em"
        >
          Math
        </text>
        <text
          x={centerX}
          y={centerY + 9}
          fill="#ffffff"
          textAnchor="middle"
          fontSize={hideButtons ? 11 : 12}
          fontWeight="800"
        >
          {score}
        </text>
      </g>
    );
  };

  const renderEnglishAndTotalLabel = (props) => {
    const { x, y, width, height, index } = props;
    const item = displayData[index];
    const englishScore = item?.English;
    const overall = item?.Overall || (Number(item?.Math || 0) + Number(englishScore || 0));
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    const scoreDiff = targetScore - overall;
    const pixelsPerPoint = englishScore > 0 ? height / englishScore : 0.215;
    const targetY = y - scoreDiff * pixelsPerPoint;

    let labelY = y - 10;
    if (overall >= targetScore) {
      labelY = Math.min(y - 12, targetY - 16);
    } else if (scoreDiff < 85) {
      labelY = targetY - 14;
    } else {
      labelY = y - 10;
    }

    const isCompact = hideButtons || displayData.length > 6;
    const fontSize = isCompact ? 9.5 : 11;

    return (
      <g>
        {englishScore != null && height >= 18 && (
          height < 36 ? (
            <text
              x={centerX}
              y={centerY + 4}
              fill="#78350f"
              textAnchor="middle"
              fontSize={hideButtons ? 9 : 10}
              fontWeight="700"
            >
              {`English: ${englishScore}`}
            </text>
          ) : (
            <g>
              <text
                x={centerX}
                y={centerY - 6}
                fill="#78350f"
                textAnchor="middle"
                fontSize={hideButtons ? 9 : 10}
                fontWeight="700"
                letterSpacing="0.02em"
              >
                English
              </text>
              <text
                x={centerX}
                y={centerY + 9}
                fill="#78350f"
                textAnchor="middle"
                fontSize={hideButtons ? 11 : 12}
                fontWeight="800"
              >
                {englishScore}
              </text>
            </g>
          )
        )}

        {overall != null && (
          <text
            x={centerX}
            y={labelY}
            fill="#10b981"
            textAnchor="middle"
            fontSize={fontSize}
            fontWeight="800"
            className="select-none"
            style={{
              letterSpacing: "-0.01em",
            }}
          >
            {`Total Score: ${overall}`}
          </text>
        )}
      </g>
    );
  };

  /* ================= NAVIGATION ================= */
  const canGoLeft = startIndex > 0;
  const canGoRight = startIndex + visibleCount < chartData.length;
  const needsPagination = chartData.length > visibleCount;

  const handlePrev = () => {
    if (canGoLeft) {
      setStartIndex((prev) => Math.max(0, prev - visibleCount));
    }
  };

  const handleNext = () => {
    if (canGoRight) {
      setStartIndex((prev) => Math.min(chartData.length - visibleCount, prev + visibleCount));
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

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setChartView("line")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  chartView === "line"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Line
              </button>
              <button
                type="button"
                onClick={() => setChartView("stacked")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  chartView === "stacked"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Stacked
              </button>
              <button
                type="button"
                onClick={() => setChartView("stepLine")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  chartView === "stepLine"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Step Line
              </button>
            </div>

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
            {chartView === "line" ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={displayData}
                  margin={{ top: 30, right: 30, bottom: 10, left: 20 }}
                >
                  <defs>
                    <linearGradient id="colorOverallCombo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                    tick={renderCustomAxisTick}
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
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={9}
                    wrapperStyle={{
                      paddingTop: '10px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#4b5563',
                    }}
                  />

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

                  <Bar
                    dataKey="Math"
                    name="Math Score"
                    fill="#818cf8"
                    fillOpacity={0.85}
                    radius={[4, 4, 0, 0]}
                    barSize={hideButtons ? 24 : 36}
                  />

                  <Line
                    type="monotone"
                    dataKey="English"
                    name="English Score"
                    stroke="#fbbf24"
                    strokeWidth={4.5}
                    dot={{ r: 3, fill: '#fbbf24', strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                  />

                  <Area
                    type="monotone"
                    dataKey="Overall"
                    name="Total Score"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#colorOverallCombo)"
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : chartView === "stacked" ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayData}
                  margin={{ top: 45, right: 30, bottom: 20, left: 20 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                    tick={renderCustomAxisTick}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 1600]}
                    ticks={[0, 400, 800, 1200, 1600]}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={false}
                    content={<CustomStackedTooltip />}
                  />

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

                  <Bar
                    dataKey="Math"
                    name="Math Score"
                    stackId="score"
                    fill="#818cf8"
                    barSize={hideButtons ? 36 : 56}
                    label={renderMathBarLabel}
                  />

                  <Bar
                    dataKey="English"
                    name="English Score"
                    stackId="score"
                    fill="#fbbf24"
                    radius={[6, 6, 0, 0]}
                    barSize={hideButtons ? 36 : 56}
                    label={renderEnglishAndTotalLabel}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={displayData}
                  margin={{ top: 30, right: 30, bottom: 10, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                    tick={renderCustomAxisTick}
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
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={9}
                    wrapperStyle={{
                      paddingTop: '10px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#4b5563',
                    }}
                  />

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

                  <Line
                    type="stepAfter"
                    dataKey="Math"
                    name="Math Score"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#818cf8", strokeWidth: 0 }}
                    activeDot={{ r: 6.5, fill: "#818cf8", stroke: "#ffffff", strokeWidth: 2 }}
                    isAnimationActive={true}
                  />

                  <Line
                    type="stepAfter"
                    dataKey="English"
                    name="English Score"
                    stroke="#fbbf24"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#fbbf24", strokeWidth: 0 }}
                    activeDot={{ r: 6.5, fill: "#fbbf24", stroke: "#ffffff", strokeWidth: 2 }}
                    isAnimationActive={true}
                  />

                  <Line
                    type="stepAfter"
                    dataKey="Overall"
                    name="Total Score"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4.5, fill: "#10b981", strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
                    isAnimationActive={true}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
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

      <Modal
        width={1300}
        open={isResultModalOpen}
        footer={null}
        onCancel={() => {
          setIsResultModalOpen(false);
          setSelectedSubmissionId(null);
        }}
        style={{ top: "20px" }}
        bodyStyle={{
          padding: "1rem",
          overflowY: "auto",
          maxHeight: "700px",
        }}
        destroyOnClose
      >
        {selectedSubmissionId && (
          <ReportNew
            testSubmissionId={selectedSubmissionId}
            isAdmin={true}
            onClose={() => {
              setIsResultModalOpen(false);
              setSelectedSubmissionId(null);
            }}
          />
        )}
      </Modal>

      <style>{`
        .clickable-test-name {
          transition: fill 0.2s ease, text-decoration 0.2s ease;
        }
        .clickable-test-name:hover {
          fill: #1d4ed8 !important;
          text-decoration: underline !important;
        }
      `}</style>

    </div>
  );
}
