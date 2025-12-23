"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { BASE_URL } from "@/app/constants/apiConstants";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Math_Topic_Wise_Practice({
  student_id,
  course_id,
  test_type,
}) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const colors = ["#F59403", "#FFD36A", "#2E2725", "#805B30"];

  useEffect(() => {
    if (student_id && course_id && test_type) {
      fetchData();
    }
  }, [student_id, course_id, test_type]);

  const fetchData = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/result/Topic_Wise_Practice/?student_id=${student_id}&course_id=${course_id}&test_type=${test_type}`,
        { withCredentials: true }
      );

      const mathData = res.data.find(
        (item) => item.subject === "Math"
      );

      setTopics(mathData?.topics || []);
    } catch (err) {
      console.error("Math Topic Practice API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="text-center py-16 text-gray-500 animate-pulse">
          Loading topic wise practice...
        </div>
      </div>
    );
  }

  if (!topics.length) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-xl font-extrabold text-gray-800 mb-6 text-center">
          Topic Wise Practice
        </h3>
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl border border-amber-200 p-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-gray-700 mb-2">No Practice Data</h4>
          <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
            Start practicing Math topics to see your topic-wise practice distribution here!
          </p>
        </div>
      </div>
    );
  }

  const data = {
    labels: topics.map(
      (t) => `${t.topic} ${Math.round(t.practice_percent)}%`
    ),
    datasets: [
      {
        data: topics.map((t) => Math.round(t.practice_percent)),
        backgroundColor: colors,
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <h3 className="text-xl font-extrabold text-gray-800 mb-6 text-center">Topic Wise Practice</h3>

      {/* PIE */}
      <div className="w-[300px] mx-auto pb-3">
        <Pie
          data={data}
          options={{
            plugins: { legend: { display: false } },
            cutout: "60%",
          }}
        />
      </div>

      {/* LEGEND WITH COLOR DOTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5 mt-2.5 text-center">
        {topics.map((t, i) => (
          <div key={i} className="text-[13px] font-semibold text-gray-900 whitespace-nowrap flex items-center">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block mr-2"
              style={{ backgroundColor: colors[i % colors.length] }}
            ></span>
            {t.topic} {Math.round(t.practice_percent)}%
          </div>
        ))}
      </div>
    </div>
  );
}
