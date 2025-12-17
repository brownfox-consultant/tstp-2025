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

  if (loading) return <div>Loading...</div>;
  if (!topics.length) return <div>No data available</div>;

  const colors = ["#F59403", "#FFD36A", "#2E2725", "#805B30"];

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

      {/* ✅ TEXT-ONLY LEGEND (IMAGE STYLE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5 mt-2.5 text-center ">
        {topics.map((t, i) => (
          <div key={i} className="text-[13px] font-semibold text-gray-900 whitespace-nowrap">
            {t.topic} {Math.round(t.practice_percent)}%
          </div>
        ))}
      </div>
    </div>
  );
}
