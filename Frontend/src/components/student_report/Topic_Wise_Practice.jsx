"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { BASE_URL } from "@/app/constants/apiConstants";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Topic_Wise_Practice({
  student_id,
  course_id,
  test_type,
  subject, // "English" | "Math"
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
      const res = await axios.get(
        `${BASE_URL}/api/result/Topic_Wise_Practice/?student_id=${student_id}&course_id=${course_id}&test_type=${test_type}`,
        { withCredentials: true }
      );

      const subjectData = res.data.find(
        (item) => item.subject === subject
      );

      setTopics(subjectData?.topics || []);
    } catch (err) {
      // console.error("Topic Wise Practice API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check if no topics OR all topics have 0% practice
  const hasNoData = !topics.length || topics.every((t) => t.practice_percent === 0);

  if (hasNoData) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-extrabold text-gray-800 mb-6">
          Topic Wise Practice
        </h3>
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl border border-gray-200 p-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-slate-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-gray-700 mb-2">No Data Available</h4>
          <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
            Start practicing to see your topic-wise practice distribution here!
          </p>
        </div>
      </div>
    );
  }

  const backgroundColors = [
    "#F59403",
    "#FFD36A",
    "#2E2725",
    "#805B30",
    "#0071BC",
    "#70D9E4",
  ];

  const data = {
    labels: topics.map(
      (t) => `${t.topic} ${Math.round(t.practice_percent)}%`
    ),
    datasets: [
      {
        data: topics.map((t) => Math.round(t.practice_percent)),
        backgroundColor: backgroundColors,
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <h3 className="text-lg font-extrabold text-gray-800 mb-6">
        Topic Wise Practice — {subject}
      </h3>

      <div className="w-[300px] mx-auto pb-3">
        <Pie
          data={data}
          options={{
            plugins: { legend: { display: false } },
            cutout: "60%",
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5 mt-2.5 text-center">
        {topics.map((t, i) => (
          <div key={i} className="text-[13px] font-semibold text-gray-900 whitespace-nowrap flex items-center">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block mr-2"
              style={{ backgroundColor: backgroundColors[i % backgroundColors.length] }}
            ></span>
            {t.topic} {Math.round(t.practice_percent)}%
          </div>
        ))}
      </div>
    </div>
  );
}
