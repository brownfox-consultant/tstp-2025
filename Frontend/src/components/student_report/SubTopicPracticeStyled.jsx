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
} from "recharts";
import { BASE_URL } from "@/app/constants/apiConstants";

const COLOR_QUESTIONS = "#10B981";
const COLOR_TIME = "#F59403";
const COLOR_ACCURACY = "#0071BC";

export default function SubTopicPracticeStyled({
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
        `${BASE_URL}/api/result/SubTopic_Wise_Practice/?student_id=${student_id}&course_id=${course_id}&test_type=${test_type}`,
        { withCredentials: true }
      );

      const subjectBlock = res.data.find(
        (s) => s.subject.toLowerCase() === subject.toLowerCase()
      );

      setTopics(subjectBlock?.topics || []);
    } catch (err) {
      console.error("SubTopic API Error:", err);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-gray-500 font-medium">Loading sub-topic data...</div>;

  // Check if no topics OR all subtopics have 0 values
  const hasNoData =
    !topics.length ||
    topics.every(
      (t) =>
        !t.subtopics?.length ||
        t.subtopics.every(
          (s) =>
            (s.practiced_questions || 0) === 0 &&
            (s.accuracy_percent || 0) === 0
        )
    );

  if (hasNoData) {
    return (
      <div className="w-full py-6 px-4">
        <div className="bg-white rounded-xl px-4 py-2 inline-block mb-6 shadow-sm">
          <h2 className="text-lg md:text-xl font-extrabold text-gray-800">
            Sub – Topic Wise Practice
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl border border-gray-200 p-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-slate-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-gray-700 mb-2">
            No Data Available
          </h4>
          <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
            Start practicing to see your sub-topic wise practice distribution here!
          </p>
        </div>
      </div>
    );
  }

  const SubtopicTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3.5 rounded-xl shadow-xl border border-gray-100 text-xs z-50 min-w-[170px]">
          <p className="font-extrabold text-gray-900 mb-2 border-b border-gray-100 pb-1">
            {data.subtopic}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLOR_QUESTIONS }}></span>
                <span className="text-gray-600 font-medium">Questions:</span>
              </div>
              <span className="font-extrabold text-gray-900">{data.questions}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLOR_TIME }}></span>
                <span className="text-gray-600 font-medium">Time:</span>
              </div>
              <span className="font-extrabold text-gray-900">{data.time}s</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLOR_ACCURACY }}></span>
                <span className="text-gray-600 font-medium">Accuracy:</span>
              </div>
              <span className="font-extrabold" style={{ color: COLOR_ACCURACY }}>{data.accuracy}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const activePattern =
    graphPattern === "stepLine"
      ? "stepLine"
      : graphPattern === "area"
      ? "area"
      : "bar";

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row flex-wrap sm:items-center justify-between mb-6 gap-4">
        <div className="bg-white px-4 py-2 inline-block rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg md:text-xl font-extrabold text-gray-800">
            Sub – Topic Wise Practice — {subject}
          </h2>
        </div>

        <div className="flex flex-wrap gap-4 bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-md shadow-sm"
              style={{ backgroundColor: COLOR_QUESTIONS }}
            ></span>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Questions
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-md shadow-sm"
              style={{ backgroundColor: COLOR_TIME }}
            ></span>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Time (Sec)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-md shadow-sm"
              style={{ backgroundColor: COLOR_ACCURACY }}
            ></span>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Accuracy %
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[25px] max-[1300px]:grid-cols-1">
        {topics.map((topicBlock, i) => {
          const chartData = (topicBlock.subtopics || []).map((s) => ({
            subtopic: s.subtopic || "",
            shortName:
              (s.subtopic || "").length > 15
                ? (s.subtopic || "").slice(0, 13) + "…"
                : s.subtopic || "",
            questions: Number(s.practiced_questions) || 0,
            time: Number(s.avg_time_seconds) || 0,
            accuracy: Number(s.accuracy_percent) || 0,
          }));

          const gradIdQ = `subGradQ_${i}`;
          const gradIdT = `subGradT_${i}`;
          const gradIdA = `subGradA_${i}`;

          return (
            <div key={i} className="card-layout">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-2">
                <h3 className="text-lg md:text-xl font-extrabold text-gray-800">
                  {topicBlock.topic}
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100 self-start sm:self-auto capitalize">
                  {activePattern === "stepLine" ? "Step Line" : activePattern === "area" ? "Area Chart" : "Bar Graph"}
                </span>
              </div>

              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  {activePattern === "bar" ? (
                    <BarChart
                      data={chartData}
                      margin={{ top: 25, right: 25, left: 10, bottom: 20 }}
                      barCategoryGap="22%"
                      barGap={4}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis
                        dataKey="shortName"
                        tick={{ fontSize: 11, fill: "#4b5563" }}
                        axisLine={{ stroke: "#e5e7eb" }}
                        tickLine={false}
                        interval={0}
                        padding={{ left: 12, right: 12 }}
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
                      <Tooltip content={<SubtopicTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                      <Bar
                        dataKey="questions"
                        name="Questions"
                        fill={COLOR_QUESTIONS}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={22}
                      />
                      <Bar
                        dataKey="time"
                        name="Time"
                        fill={COLOR_TIME}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={22}
                      />
                      <Bar
                        dataKey="accuracy"
                        name="Accuracy"
                        fill={COLOR_ACCURACY}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={22}
                      />
                    </BarChart>
                  ) : activePattern === "stepLine" ? (
                    <LineChart
                      data={chartData}
                      margin={{ top: 32, right: 25, left: 10, bottom: 20 }}
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
                      <Tooltip content={<SubtopicTooltip />} />
                      <Line
                        type="stepAfter"
                        dataKey="questions"
                        stroke={COLOR_QUESTIONS}
                        strokeWidth={2.5}
                        dot={{ r: 4, stroke: COLOR_QUESTIONS, strokeWidth: 2, fill: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="stepAfter"
                        dataKey="time"
                        stroke={COLOR_TIME}
                        strokeWidth={2.5}
                        dot={{ r: 4, stroke: COLOR_TIME, strokeWidth: 2, fill: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="stepAfter"
                        dataKey="accuracy"
                        stroke={COLOR_ACCURACY}
                        strokeWidth={2.5}
                        dot={{ r: 4.5, stroke: COLOR_ACCURACY, strokeWidth: 2, fill: "#fff" }}
                        activeDot={{ r: 6.5 }}
                      />
                    </LineChart>
                  ) : (
                    <AreaChart
                      data={chartData}
                      margin={{ top: 25, right: 25, left: 10, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id={gradIdQ} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLOR_QUESTIONS} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={COLOR_QUESTIONS} stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id={gradIdT} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLOR_TIME} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={COLOR_TIME} stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id={gradIdA} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLOR_ACCURACY} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={COLOR_ACCURACY} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis
                        dataKey="shortName"
                        tick={{ fontSize: 11, fill: "#4b5563" }}
                        axisLine={{ stroke: "#e5e7eb" }}
                        tickLine={false}
                        interval={0}
                        padding={{ left: 12, right: 12 }}
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
                      <Tooltip content={<SubtopicTooltip />} />
                      <Area
                        type="linear"
                        dataKey="questions"
                        stroke={COLOR_QUESTIONS}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#${gradIdQ})`}
                        dot={{ r: 3.5, stroke: COLOR_QUESTIONS, strokeWidth: 1.5, fill: "#fff" }}
                      />
                      <Area
                        type="linear"
                        dataKey="time"
                        stroke={COLOR_TIME}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#${gradIdT})`}
                        dot={{ r: 3.5, stroke: COLOR_TIME, strokeWidth: 1.5, fill: "#fff" }}
                      />
                      <Area
                        type="linear"
                        dataKey="accuracy"
                        stroke={COLOR_ACCURACY}
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill={`url(#${gradIdA})`}
                        dot={{ r: 4, stroke: COLOR_ACCURACY, strokeWidth: 2, fill: "#fff" }}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
