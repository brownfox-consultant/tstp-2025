"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from "recharts";

import {
  FaRegFileAlt, FaRegLightbulb, FaPencilAlt, FaBookReader,
  FaChevronDown, FaChevronUp, FaChartLine, FaMinus
} from "react-icons/fa";

import { BASE_URL } from "@/app/constants/apiConstants";

/* ================= ICON MAP ================= */
const ICON_MAP = {
  "Information and Ideas": FaRegFileAlt,
  "Craft and Structure": FaRegLightbulb,
  "Expression of Ideas": FaPencilAlt,
  "Standard English Conventions": FaBookReader,
};

/* ================= COLORS ================= */
const COLORS = {
  green: "#2ecc71",
  orange: "#f39c12",
  textDark: "#333",
  textLight: "#777",
};

/* ================= TOOLTIP ================= */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border text-sm">
        <p className="font-semibold">{d.fullName || d.name}</p>
        <p className="text-xl font-bold">{d.value}%</p>
        <p className="text-gray-500">
          {d.value >= 75 ? "Strong" : "On Track"}
        </p>
      </div>
    );
  }
  return null;
};

/* ================= CUSTOM TICK FOR MULTILINE LABELS ================= */
const CustomXAxisTick = ({ x, y, payload }) => {
  const maxWidth = 140;
  const words = payload.value ? payload.value.split(' ') : [];
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length * 6 > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) lines.push(currentLine);

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={5 + i * 13}
          textAnchor="middle"
          fill="#666"
          fontSize={10}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

/* ================= MAIN COMPONENT ================= */
export default function TopicWiseProgress({
  student_id,
  course_id,
  subject,
  test_type, // fullLength | practiceTest
}) {

  const [chartData, setChartData] = useState([]);
  const [accordionData, setAccordionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillsData, setSkillsData] = useState([]);

  /* ================= FETCH API ================= */
  useEffect(() => {
    if (!student_id || !course_id || !test_type) return;

    const apiTestType =
      test_type === "fullLength" ? "FULL_LENGTH" : "PRACTICE";

    setLoading(true);

    axios.get(
      `${BASE_URL}/api/result/topic-wise-progress/`,
      {
        params: {
          student_id,
          course_id,
          subject,
          test_type: apiTestType,
        },
        withCredentials: true,
      }
    )
      .then(res => {
        setChartData(res.data.chartData || []);
        setSkillsData(res.data.skillsData || []);
        setAccordionData(
          (res.data.accordionData || []).map(topic => ({
            ...topic,
            icon: ICON_MAP[topic.title] || FaRegFileAlt,
            iconBg: topic.score >= 75
              ? "bg-emerald-50 text-emerald-600"
              : "bg-orange-50 text-orange-600"
          }))
        );
      })
      .catch(err => {
        console.error("Topic-wise progress API error:", err);
      })
      .finally(() => setLoading(false));

  }, [student_id, course_id, subject, test_type]);

  /* ================= EMPTY STATE ================= */
  if ((!chartData || chartData.length === 0) && (!accordionData || accordionData.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl border border-emerald-200 p-12 text-center shadow-sm">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <FaChartLine className="text-4xl text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">No Topic Progress Data</h3>
        <p className="text-gray-500 max-w-md leading-relaxed">
          Topic-wise progress data is not available yet. Complete tests to see your performance breakdown by topics and subtopics!
        </p>
        <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
          <FaBookReader className="text-gray-400" />
          <span>Your topic accuracy and skills overview will appear here after taking tests</span>
        </div>
      </div>
    );
  }

  /* ================= RENDER ================= */
  return (
    <div className="space-y-5">

      {/* ================= TOP CHARTS ================= */}
      <ChartsSection chartData={chartData} skillsData={skillsData} />

      {/* ================= ACCORDION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {accordionData.map((topic, idx) => (
          <TopicCard key={idx} topic={topic} />
        ))}
      </div>

      {/* ================= LEADERBOARD ================= */}
      <TopicLeaderboard allData={accordionData} />

    </div>
  );
}

/* ================= CHARTS SECTION ================= */
const ChartsSection = ({ chartData, skillsData }) => (
  <div className="flex flex-wrap gap-6">

    {/* LEFT - Topic Progress */}
    <div className="bg-white rounded-2xl p-6 shadow-sm border flex-1 min-w-[350px]">
      <h3 className="font-bold mb-4">Topic Progress Comparison</h3>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={chartData}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <YAxis dataKey="fullName" type="category" width={150} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <RechartsTooltip />
            <Bar dataKey="value">
              {chartData.map((e, i) => (
                <Cell key={i} fill={e.value >= 75 ? "#2ecc71" : "#f39c12"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* RIGHT - Skills Overview */}
    <div className="bg-white rounded-2xl p-16 shadow-sm border flex-1 min-w-[350px]">
      <h3 className="font-bold mb-4">Skills Overview</h3>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={skillsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <RechartsTooltip />
            <Bar dataKey="value">
              {skillsData.map((e, i) => (
                <Cell key={i} fill={e.value >= 75 ? "#2ecc71" : "#f39c12"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

  </div>
);

/* ================= ACCORDION CARD ================= */
const TopicCard = ({ topic }) => {
  const [open, setOpen] = useState(false);
  const Icon = topic.icon;

  const isStrong = topic.score >= 75;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border">
      <div
        className="flex gap-4 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${topic.iconBg}`}>
          <Icon className="text-xl" />
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">{topic.title}</h3>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold ${isStrong ? "text-emerald-500" : "text-orange-500"}`}>
                {topic.score}%
              </span>
              {open ? <FaChevronUp /> : <FaChevronDown />}
            </div>
          </div>

          <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
            <div
              className={`h-2 rounded-full ${isStrong ? "bg-emerald-500" : "bg-orange-400"}`}
              style={{ width: `${topic.score}%` }}
            />
          </div>
        </div>
      </div>

      {open && (
        <div className="mt-5 space-y-3">
          {topic.subTopics.map((s, i) => {
            const strong = s.score >= 75;
            return (
              <div key={i} className="bg-gray-50 p-4 rounded-xl border">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{s.name}</span>
                  <span className={`font-bold ${strong ? "text-emerald-600" : "text-orange-500"}`}>
                    {s.score}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full">
                  <div
                    className={`h-1.5 rounded-full ${strong ? "bg-emerald-500" : "bg-orange-400"}`}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ================= LEADERBOARD ================= */
const TopicLeaderboard = ({ allData }) => {

  const flat = allData.flatMap(t =>
    t.subTopics.map(s => ({
      name: s.name,
      score: s.score,
      parent: t.title
    }))
  ).sort((a, b) => b.score - a.score);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-3">Overall Topic Leaderboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {flat.map((i, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-gray-400">{i.parent}</span>
              <span className={`text-xl font-bold ${i.score >= 75 ? "text-emerald-500" : "text-orange-500"}`}>
                {i.score}%
              </span>
            </div>
            <h4 className="font-bold mb-3">{i.name}</h4>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className={`h-2 rounded-full ${i.score >= 75 ? "bg-emerald-500" : "bg-orange-400"}`}
                style={{ width: `${i.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
