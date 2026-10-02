"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import {
  FaClock,
  FaQuestionCircle,
  FaInfoCircle,
} from "react-icons/fa";
import { BASE_URL } from "@/app/constants/apiConstants";

export default function PatternOfUsage({
  student_id,
  course_id,
  test_type, // fullLength | practiceTest | overall
}) {
  const [usageData, setUsageData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [chartView, setChartView] = useState("bar");
  const [loading, setLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);

  const ITEMS_PER_PAGE = 7;

  /* ================= FETCH API ================= */

  useEffect(() => {
    if (!student_id || !course_id || !test_type) return;

    // Overall is not supported
    if (test_type === "overall") {
      setUsageData([]);
      setSelectedDate(null);
      setLoading(false);
      return;
    }

    fetchPatternOfUsage();
  }, [student_id, course_id, test_type]);

  const fetchPatternOfUsage = async () => {
    try {
      setLoading(true);

      let apiTestType;

      if (test_type === "fullLength") {
        apiTestType = "FULL_LENGTH";
      } else if (test_type === "practiceTest") {
        apiTestType = "PRACTICE";
      } else {
        return;
      }

      const res = await axios.get(
        `${BASE_URL}/api/result/pattern-of-usage/?student_id=${student_id}&course_id=${course_id}&test_type=${apiTestType}`,
        {
          withCredentials: true,
        }
      );

      const formatted = (res.data.results || []).map(
        (row, index) => ({
          date: row.date,
          time: row.time || 0,
          questions: row.questions || 0,
          details:
            row.details || "No details available",
          index,
        })
      );

      setUsageData(formatted);
      setStartIndex(0);
    } catch (error) {
      console.error(
        "Pattern of Usage API error:",
        error
      );
      setUsageData([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= OVERALL NOT SUPPORTED ================= */

  if (test_type === "overall") {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl border border-orange-200 p-12 text-center shadow-sm">
          
          <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <FaInfoCircle className="text-4xl text-orange-400" />
          </div>

          <h3 className="text-xl font-bold text-gray-700 mb-2">
            Overall Performance Not Supported
          </h3>

          <p className="text-gray-500 max-w-md leading-relaxed">
            Overall Performance is not supported for Pattern of Usage.
            Please select Full Length Test or Practice Test to view
            pattern of usage.
          </p>
        </div>
      </div>
    );
  }

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center p-12">
          <FaClock className="text-4xl text-orange-400 animate-pulse mb-4" />

          <p className="text-gray-500">
            Loading pattern of usage...
          </p>
        </div>
      </div>
    );
  }

  /* ================= PAGINATION ================= */

  const endIndex = Math.min(
    startIndex + ITEMS_PER_PAGE,
    usageData.length
  );

  const displayData = usageData.slice(
    startIndex,
    endIndex
  );

  const canGoLeft = startIndex > 0;
  const canGoRight =
    endIndex < usageData.length;

  const handlePrev = () => {
    setStartIndex(
      Math.max(
        0,
        startIndex - ITEMS_PER_PAGE
      )
    );
  };

  const handleNext = () => {
    setStartIndex(
      Math.min(
        usageData.length - ITEMS_PER_PAGE,
        startIndex + ITEMS_PER_PAGE
      )
    );
  };

  /* ================= UI HELPERS ================= */

  const CustomTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (
      active &&
      payload &&
      payload.length
    ) {
      const data = payload[0]?.payload;
      const dateLabel = label || data?.date || "Details";
      const timeVal =
        data?.time ??
        payload.find((p) => p.dataKey === "time")?.value ??
        payload[0]?.value ??
        0;
      const questionsVal =
        data?.questions ??
        payload.find((p) => p.dataKey === "questions")?.value ??
        payload[1]?.value ??
        0;

      return (
        <div className="bg-white p-4 shadow-xl rounded-xl border border-gray-100 min-w-[190px]">
          <div className="border-b pb-2 mb-2.5">
            <p className="font-bold text-gray-800 text-sm">
              {dateLabel}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/80 border border-emerald-100">
              <div className="flex items-center gap-2">
                <FaQuestionCircle
                  className="text-[#2ca58d]"
                  size={14}
                />
                <span className="text-xs font-semibold text-gray-700">
                  Questions:
                </span>
              </div>
              <span className="text-sm font-bold text-[#2ca58d]">
                {questionsVal}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/80 border border-blue-100">
              <div className="flex items-center gap-2">
                <FaClock
                  className="text-blue-500"
                  size={14}
                />
                <span className="text-xs font-semibold text-gray-700">
                  Time:
                </span>
              </div>
              <span className="text-sm font-bold text-blue-600">
                {timeVal} mins
              </span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderLabel = ({
    x,
    y,
    width,
    value,
  }) => {
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

  const getDynamicLabelY = ({
    currentKey,
    currentVal,
    item,
    y,
  }) => {
    const timeVal = Number(item?.time) || 0;
    const questionsVal = Number(item?.questions) || 0;

    if (timeVal <= 0 && questionsVal <= 0) {
      return currentKey === "time" ? y - 12 : y - 28;
    }

    if (currentVal <= 0) {
      return y - 12;
    }
    const otherVal = currentKey === "questions" ? timeVal : questionsVal;
    if (otherVal <= 0 && currentVal > 0) {
      return y - 12;
    }

    let placeAbove = true;

    if (currentKey === "questions") {
      if (questionsVal > timeVal) {
        placeAbove = true; 
      } else if (questionsVal < timeVal) {
        placeAbove = false; 
      } else {
        placeAbove = false; 
      }
    } else if (currentKey === "time") {
      if (timeVal > questionsVal) {
        placeAbove = true; 
      } else if (timeVal < questionsVal) {
        placeAbove = false; 
      } else {
        placeAbove = true; 
      }
    } else {
      placeAbove = currentVal >= timeVal;
    }

    if (placeAbove && y < 22) {
      placeAbove = false;
    }
    
    else if (!placeAbove && (currentVal <= 2 || y > 290)) {
      placeAbove = true;
    }

    return placeAbove ? y - 12 : y + 18;
  };

  const renderDynamicTimeLabel = (props) => {
    const { x, y, value, index } = props;
    if (value === undefined || value === null) return null;
    const item = displayData[index];
    const labelY = getDynamicLabelY({
      currentKey: "time",
      currentVal: Number(value) || 0,
      item,
      y,
    });

    return (
      <text
        x={x}
        y={labelY}
        fill="#1d4ed8"
        textAnchor="middle"
        fontSize={11.5}
        fontWeight={700}
      >
        {value}
      </text>
    );
  };

  const renderDynamicQuestionsLabel = (props) => {
    const { x, y, value, index } = props;
    if (value === undefined || value === null) return null;
    const item = displayData[index];
    const labelY = getDynamicLabelY({
      currentKey: "questions",
      currentVal: Number(value) || 0,
      item,
      y,
    });

    return (
      <text
        x={x}
        y={labelY}
        fill="#047857"
        textAnchor="middle"
        fontSize={11.5}
        fontWeight={700}
      >
        {value}
      </text>
    );
  };

  const renderCandlestickItem = (props) => {
    const { x, y, width, height, index } = props;
    const item = displayData[index];
    if (!item) return null;

    const time = Number(item.time) || 0;
    const questions = Number(item.questions) || 0;

    const prevQuestions =
      index > 0
        ? Number(displayData[index - 1].questions) || questions
        : questions;
    const color = "#2ca58d";

    const baselineY = y + height;
    const scale = time > 0 ? height / time : 1;

    const highY = y;

    const closeY = baselineY - (questions * scale);

    let openVal = prevQuestions;
    if (Math.abs(questions - openVal) * scale < 10) {
      openVal = questions >= openVal ? questions - (10 / (scale || 1)) : questions + (10 / (scale || 1));
    }
    const openY = baselineY - (openVal * scale);

    const bodyTop = Math.min(openY, closeY);
    const bodyBottom = Math.max(openY, closeY);
    const bodyHeight = Math.max(12, bodyBottom - bodyTop);

    const lowVal = Math.max(10, Math.min(questions, openVal) - 16);
    const lowY = Math.min(baselineY - 32, baselineY - (lowVal * scale));

    const candleWidth = Math.min(24, Math.max(16, width * 0.42));
    const centerX = x + width / 2;
    const candleX = centerX - candleWidth / 2;

    return (
      <g
        className="cursor-pointer group"
        onClick={() => handleBarClick(item)}
      >
        <line
          x1={centerX}
          y1={highY}
          x2={centerX}
          y2={bodyTop}
          stroke={color}
          strokeWidth={1.8}
        />

        <line
          x1={centerX}
          y1={bodyBottom}
          x2={centerX}
          y2={lowY}
          stroke={color}
          strokeWidth={1.8}
        />

        <rect
          x={candleX}
          y={bodyTop}
          width={candleWidth}
          height={bodyHeight}
          fill={color}
          stroke={color}
          strokeWidth={1}
          rx={0}
          className="transition-opacity group-hover:opacity-85"
        />

        <g>
          <rect
            x={centerX - 24}
            y={highY - 24}
            width={48}
            height={20}
            rx={5}
            fill="#ffffff"
            stroke="#3b82f6"
            strokeWidth={1.2}
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))" }}
          />
          <text
            x={centerX}
            y={highY - 10}
            fill="#1d4ed8"
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
          >
            {`${time}m`}
          </text>
        </g>

        <g>
          <rect
            x={centerX - 27}
            y={lowY + 6}
            width={54}
            height={22}
            rx={5}
            fill="#ffffff"
            stroke={color}
            strokeWidth={1.5}
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.08))" }}
          />
          <text
            x={centerX}
            y={lowY + 21}
            fill={color}
            textAnchor="middle"
            fontSize={11}
            fontWeight={800}
          >
            {`${questions} Qs`}
          </text>
        </g>
      </g>
    );
  };

  const handleBarClick = (data) => {
    setSelectedDate(data);
  };

  /* ================= EMPTY STATE ================= */

  if (
    !usageData ||
    usageData.length === 0
  ) {
    return (
      <div className="w-full">
        <div className="mx-auto">
          <div className="flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl border border-orange-200 p-12 text-center shadow-sm">

            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <FaClock className="text-4xl text-orange-400" />
            </div>

            <h3 className="text-xl font-bold text-gray-700 mb-2">
              No Usage Data Available
            </h3>

            <p className="text-gray-500 max-w-md leading-relaxed">
              Your pattern of usage data is not
              available yet. Start practicing to see
              your daily activity, time spent, and
              questions solved!
            </p>

            <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
              <FaQuestionCircle className="text-gray-400" />

              <span>
                Your daily practice patterns will
                appear here once you start studying
              </span>
            </div>

          </div>
        </div>
      </div>
    );
  }

  /* ================= RENDER ================= */

  return (
    <div className="w-full">

      {/* CHART CONTAINER */}

      <div>
        <div className="bg-white rounded-lg shadow p-8 border relative">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <FaClock className="w-5 h-5 text-gray-600" />
              <h3 className="lg:text-xl text-base font-bold text-gray-800">
                Pattern of Usage
              </h3>
            </div>

            <div className="inline-flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartView("bar")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  chartView === "bar"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Bar
              </button>
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
                onClick={() => setChartView("candlestick")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  chartView === "candlestick"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Candlestick
              </button>
            </div>
          </div>

          {/* Left Arrow */}

          {canGoLeft && (
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
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
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8.59 16.59L10 18l-6-6 6-6-1.41 1.41L13.17 12z" />
              </svg>
            </button>
          )}

          {/* LEGEND */}

          <div className="flex justify-center gap-8 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-sm font-medium text-gray-700">
                Time (Minutes)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm font-medium text-gray-700">
                Questions
              </span>
            </div>
          </div>

          {/* CHARTS CONTAINER */}

          {chartView === "bar" ? (
            <div className="h-[420px] bg-gray-50 rounded-xl p-6 mx-2 sm:mx-10">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={displayData}
                  margin={{
                    top: 30,
                    right: 30,
                    left: 10,
                    bottom: 20,
                  }}
                  barCategoryGap="20%"
                  barGap={2}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />

                  <XAxis
                    dataKey="date"
                    tick={{
                      fill: "#374151",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fill: "#6b7280",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      fill: "transparent",
                    }}
                  />

                  <Bar
                    dataKey="time"
                    name="Time (Minutes)"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                    onClick={handleBarClick}
                  >
                    <LabelList
                      dataKey="time"
                      content={renderLabel}
                    />

                    {displayData.map(
                      (_, index) => (
                        <Cell
                          key={`time-${index}`}
                          className="cursor-pointer hover:opacity-85 transition-opacity"
                        />
                      )
                    )}
                  </Bar>

                  <Bar
                    dataKey="questions"
                    name="Questions"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                    onClick={handleBarClick}
                  >
                    <LabelList
                      dataKey="questions"
                      content={renderLabel}
                    />

                    {displayData.map(
                      (_, index) => (
                        <Cell
                          key={`q-${index}`}
                          className="cursor-pointer hover:opacity-85 transition-opacity"
                        />
                      )
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : chartView === "candlestick" ? (
            <div className="h-[420px] bg-gray-50 rounded-xl p-6 mx-2 sm:mx-10">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={displayData}
                  margin={{
                    top: 35,
                    right: 30,
                    left: 10,
                    bottom: 25,
                  }}
                  barCategoryGap="25%"
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      handleBarClick(e.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="0"
                    vertical={false}
                    stroke="#e5e7eb"
                  />

                  <XAxis
                    dataKey="date"
                    tick={{
                      fill: "#374151",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fill: "#6b7280",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, (dataMax) => Math.ceil(dataMax * 1.18)]}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      fill: "rgba(0,0,0,0.03)",
                    }}
                  />

                  <Bar
                    dataKey="time"
                    name="Study Session Candle"
                    shape={renderCandlestickItem}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[420px] bg-gray-50 rounded-xl p-6 mx-2 sm:mx-10">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={displayData}
                  margin={{
                    top: 35,
                    right: 30,
                    left: 15,
                    bottom: 35,
                  }}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      handleBarClick(e.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />

                  <XAxis
                    dataKey="date"
                    padding={{ left: 45, right: 30 }}
                    tickMargin={12}
                    tick={{
                      fill: "#374151",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fill: "#6b7280",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      stroke: "#9ca3af",
                      strokeDasharray: "3 3",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="time"
                    name="Time (Minutes)"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                      fill: "#3b82f6",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 7,
                      fill: "#3b82f6",
                      stroke: "#ffffff",
                      strokeWidth: 3,
                    }}
                  >
                    <LabelList
                      dataKey="time"
                      content={renderDynamicTimeLabel}
                    />
                  </Line>

                  <Line
                    type="monotone"
                    dataKey="questions"
                    name="Questions"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                      fill: "#10b981",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 7,
                      fill: "#10b981",
                      stroke: "#ffffff",
                      strokeWidth: 3,
                    }}
                  >
                    <LabelList
                      dataKey="questions"
                      content={renderDynamicQuestionsLabel}
                    />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Page Indicator */}

          {usageData.length >
            ITEMS_PER_PAGE && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <span className="text-sm text-gray-500">
                Showing{" "}
                {startIndex + 1}-
                {endIndex} of{" "}
                {usageData.length} dates
              </span>
            </div>
          )}

          {/* SELECTED DATE DETAILS */}

          {selectedDate && (
            <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border">

              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaInfoCircle className="text-purple-600" />
                Details for{" "}
                {selectedDate.date}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="bg-white p-4 rounded shadow">
                  <p className="text-xs uppercase text-gray-500">
                    Time Spent
                  </p>

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
                  <p className="text-xs uppercase text-gray-500">
                    Session Info
                  </p>

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