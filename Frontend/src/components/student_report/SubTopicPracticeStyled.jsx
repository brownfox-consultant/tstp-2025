"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { BASE_URL } from "@/app/constants/apiConstants";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Wrap long labels
const formatLabel = (str, maxLen = 14) => {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  const words = str.split(" ");
  const lines = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    if ((current + " " + words[i]).length <= maxLen) {
      current += " " + words[i];
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
};

export default function SubTopicPracticeStyled({
  student_id,
  course_id,
  test_type,
  subject, // 🔑 "English" | "Math"
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

  if (loading) return <div>Loading...</div>;

  if (!topics.length) {
    return (
      <div className="w-full py-6 px-4">
        <div className="bg-white rounded-xl px-4 py-2 inline-block mb-6 shadow-sm">
          <h2 className="text-lg md:text-xl font-extrabold text-gray-800">
            Sub – Topic Wise Practice
          </h2>
        </div>
        <div className="text-center text-gray-500 mt-8">
          No sub-topic data available
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white px-4 py-2 inline-block mb-6 border-b">
        <h2 className="text-lg md:text-xl font-extrabold text-gray-800">
          Sub – Topic Wise Practice — {subject}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-[25px] max-[1300px]:grid-cols-1">
        {topics.map((topicBlock, i) => {
          const labels = topicBlock.subtopics.map((s) =>
            formatLabel(s.subtopic)
          );

          const questionData = topicBlock.subtopics.map(
            (s) => s.practiced_questions || 0
          );

          const timeData = topicBlock.subtopics.map(
            (s) => s.avg_time_seconds || 0
          );

          const accuracyData = topicBlock.subtopics.map(
            (s) => s.accuracy_percent || 0
          );

          const data = {
            labels,
            datasets: [
              {
                label: "Questions",
                data: questionData,
                backgroundColor: "#F59403",
                borderColor: "#F59403",
                maxBarThickness: 30,
              },
              {
                label: "Time",
                data: timeData,
                backgroundColor: "#FFD36A",
                borderColor: "#FFD36A",
                maxBarThickness: 30,
              },
              {
                label: "Accuracy",
                data: accuracyData,
                backgroundColor: "#0071BC",
                borderColor: "#0071BC",
                maxBarThickness: 30,
              },
            ],
          };

          const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false, 
              },
              tooltip: { mode: "index", intersect: false },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  autoSkip: false,
                  font: { size: 16 },
                },
              },
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 20,
                  callback: (v) => v + "%",
                  font: { size: 14 },
                },
                grid: { color: "#f0f0f0", drawBorder: false },
              },
            },
          };

          return (
            <div key={i} className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-extrabold text-gray-800 mb-3">
                {topicBlock.topic}
              </h3>

              <div className="overflow-x-auto pb-2">
                <div className="h-[300px] md:h-[340px] w-full max-w-[700px]">
                  <Bar data={data} options={options} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
