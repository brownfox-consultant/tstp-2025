"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,Tooltip,
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

  const [needsImprovementTopics, setNeedsImprovementTopics] = useState([]);  
  const [chartData, setChartData] = useState([]);
  const [accordionData, setAccordionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillsData, setSkillsData] = useState([]);
  const [strongTopics, setStrongTopics] = useState([]);


  /* ================= FETCH API ================= */
 useEffect(() => {
  if (!student_id || !course_id || !test_type || !subject) return;

  let apiTestType;

  if (test_type === "fullLength") {
    apiTestType = "fullLength";
  } else if (test_type === "practiceTest") {
    apiTestType = "practiceTest";
  } else if (test_type === "overall") {
    apiTestType = "overall";
  } else {
    return;
  }

  setLoading(true);

  Promise.all([
    // Existing Topic Wise Progress API
    axios.get(`${BASE_URL}/api/result/topic-wise-progress/`, {
      params: {
        student_id,
        course_id,
        subject,
        test_type:
          apiTestType === "fullLength"
            ? "FULL_LENGTH"
            : apiTestType === "practiceTest"
            ? "PRACTICE"
            : "OVERALL",
      },
      withCredentials: true,
    }),

    // Student Improvement API
    axios.get(`${BASE_URL}/api/result/student-improvement/`, {
      params: {
        student_id,
        course_id,
        test_type: apiTestType,
      },
      withCredentials: true,
    }),
  ])
    .then(([topicProgressResponse, improvementResponse]) => {
      const topicProgressData = topicProgressResponse.data;

      setChartData(topicProgressData.chartData || []);
      setSkillsData(topicProgressData.skillsData || []);

      setAccordionData(
        (topicProgressData.accordionData || []).map((topic) => ({
          ...topic,
          icon: ICON_MAP[topic.title] || FaRegFileAlt,
          iconBg:
            topic.score >= 75
              ? "bg-emerald-50 text-emerald-600"
              : "bg-orange-50 text-orange-600",
        }))
      );

      // Find selected subject from student-improvement API
      const subjects = improvementResponse.data.subjects || [];

      const selectedSubject = subjects.find(
        (item) =>
          item.subject?.toUpperCase() === subject.toUpperCase() ||
          item.name?.toUpperCase() === subject.toUpperCase()
      );

      // Get topics below 70%
      const improvementTopics =
  selectedSubject?.needs_improvement || [];

const goodTopics =
  selectedSubject?.good_at || [];

setNeedsImprovementTopics(
  [...improvementTopics].sort((a, b) => a.score - b.score)
);

setStrongTopics(
  [...goodTopics].sort((a, b) => b.score - a.score)
);
    })
    .catch((error) => {
      console.error("Topic-wise progress API error:", error);
      setNeedsImprovementTopics([]);
    })
    .finally(() => {
      setLoading(false);
    });
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

      {/* ================= NEEDS IMPROVEMENT ================= */}
      <NeedsImprovementTopics
  strongTopics={strongTopics}
  weakTopics={needsImprovementTopics}
/>

      {/* ================= TOP CHARTS ================= */}
      <ChartsSection chartData={chartData} skillsData={skillsData} />

      {/* ================= ACCORDION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
const ChartsSection = ({ chartData, skillsData }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [activeSkillIndex, setActiveSkillIndex] = useState(null);

  return (
    <div className="flex flex-wrap gap-4">

      {/* ================= LEFT CHART ================= */}
      <div className="bg-white rounded-lg p-6 shadow-sm border flex-1 min-w-[350px]">
        <h3 className="font-bold mb-4">Topic Progress Comparison</h3>

        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              barCategoryGap="30%"
              onMouseLeave={() => setActiveIndex(null)}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />

              <YAxis
                dataKey="fullName"
                type="category"
                width={120}
                tick={{ fontSize: 12 }}
              />

              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
               <Tooltip
                                //formatter={(value) => `${value}%`}
                                cursor={{ fill: 'transparent' }}
                              />

              <RechartsTooltip content={<CustomTooltip />} />

              <Bar
                dataKey="value"
                barSize={18}
                radius={[0, 6, 6, 0]}
                onMouseEnter={(_, index) => setActiveIndex(index)}
              >
                {chartData.map((entry, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.value >= 75 ? "#2ecc71" : "#f39c12"}
                      opacity={
                        activeIndex === null
                          ? 1
                          : isActive
                          ? 1
                          : 0.3
                      }
                      style={{
                        transition: "all 0.3s ease",
                        filter: isActive
                          ? "brightness(1.1)"
                          : "none",
                      }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= RIGHT CHART ================= */}
      <div className="bg-white rounded-lg p-6 shadow-sm border flex-1 min-w-[350px]">
        <h3 className="font-bold mb-4">Skills Overview</h3>

        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={skillsData}
              barCategoryGap="25%"
              onMouseLeave={() => setActiveSkillIndex(null)}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis domain={[0, 100]} />
              <Tooltip
                                //formatter={(value) => `${value}%`}
                                cursor={{ fill: 'transparent' }}
                              />

              <RechartsTooltip />

              <Bar
                dataKey="value"
                barSize={30}
                radius={[6, 6, 0, 0]}
                onMouseEnter={(_, index) =>
                  setActiveSkillIndex(index)
                }
              >
                {skillsData.map((entry, index) => {
                  const isActive = index === activeSkillIndex;

                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.value >= 75 ? "#2ecc71" : "#f39c12"}
                      opacity={
                        activeSkillIndex === null
                          ? 1
                          : isActive
                          ? 1
                          : 0.3
                      }
                      style={{
                        transition: "all 0.3s ease",
                        transform: isActive
                          ? "scale(1.05)"
                          : "scale(1)",
                      }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

/* ================= ACCORDION CARD ================= */
const TopicCard = ({ topic }) => {
  const [open, setOpen] = useState(false);
  const Icon = topic.icon;

  const isStrong = topic.score >= 75;

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border">
      <div
        className="flex gap-4 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${topic.iconBg}`}>
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
        <div className="mt-3 space-y-3">
          {topic.subTopics.map((s, i) => {
            const strong = s.score >= 75;
            return (
              <div key={i} className="bg-gray-50 p-4 rounded-lg border">
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


const NeedsImprovementTopics = ({
  strongTopics,
  weakTopics,
}) => {
  const formatScore = (score) =>
    Math.round(Number(score) || 0);

  const TopicCard = ({ topic, strong }) => {
    const score = formatScore(topic.score);

    return (
      <div
        className={`rounded-xl p-4 border ${
          strong
            ? "bg-emerald-50 border-emerald-200"
            : "bg-orange-50 border-orange-200"
        }`}
      >
        <div className="flex justify-between items-start gap-3">
          <div>
            <h3 className="font-bold text-gray-800">
              {topic.name}
            </h3>

            <p className="text-xs text-gray-500 mt-1">
              {strong
                ? "Excellent performance"
                : "Practice recommended"}
            </p>
          </div>

          <span
            className={`text-lg font-bold ${
              strong
                ? "text-emerald-600"
                : "text-orange-600"
            }`}
          >
            {score}%
          </span>
        </div>

        <div
          className={`w-full h-2 rounded-full mt-4 ${
            strong ? "bg-emerald-200" : "bg-orange-200"
          }`}
        >
          <div
            className={`h-2 rounded-full ${
              strong
                ? "bg-emerald-500"
                : "bg-orange-500"
            }`}
            style={{
              width: `${Math.min(Math.max(score, 0), 100)}%`,
            }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Correct: {Math.round(topic.correct)}</span>
          <span>Attempted: {Math.round(topic.total_attempted)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-6">

      {/* ================= STRONG TOPICS ================= */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-200">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Strong Topics
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Topics where your score is 70% or above
            </p>
          </div>

          <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-sm font-semibold">
            {strongTopics.length} Topics
          </span>
        </div>

        {strongTopics.length === 0 ? (
          <p className="text-center text-gray-500 py-5">
            No strong topics yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strongTopics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                strong={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= WEAK TOPICS ================= */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-200">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Weak Topics
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Topics where your score is below 70%
            </p>
          </div>

          <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold">
            {weakTopics.length} Topics
          </span>
        </div>

        {weakTopics.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
            <h3 className="font-bold text-emerald-700">
              Great job!
            </h3>

            <p className="text-sm text-emerald-600 mt-1">
              You have no topics that need improvement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weakTopics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                strong={false}
              />
            ))}
          </div>
        )}
      </div>

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
          <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-gray-400">{i.parent}</span>
              <span className={`text-xl font-bold ${i.score >= 75 ? "text-emerald-500" : "text-orange-500"}`}>
                {i.score}%
              </span>
            </div>
            <h4 className="font-bold mb-2">{i.name}</h4>
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
