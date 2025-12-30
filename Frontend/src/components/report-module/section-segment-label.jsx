import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { timeInMMSS } from "@/utils/utils";

ChartJS.register(ArcElement, Tooltip, Legend);

// Topic-wise dataset
const getTopicWiseDataset = (questions = []) => {
  const topicMap = {};

  questions.forEach((q) => {
    const topic = q.topic || "Unknown";
    const key = `${topic}_${q.result ? "correct" : "incorrect"}`;
    topicMap[key] = (topicMap[key] || 0) + 1;
  });

  const labels = [];
  const data = [];
  const backgroundColor = [];

  Object.entries(topicMap).forEach(([key, value]) => {
    const [topic, status] = key.split("_");
    labels.push(`${topic} (${status})`);
    data.push(value);
    backgroundColor.push(status === "correct" ? "#22c55e" : "#ef4444");
  });

  return { labels, data, backgroundColor };
};

const SectionSegmentLabel = ({ data }) => {
  const {
    name,
    section_correct_count,
    section_incorrect_count,
    section_blank_count,
    section_correct_time_taken,
    section_incorrect_time_taken,
    time_on_section,
    marked = 0,
    questions_data = [],
  } = data;

  const totalQuestions = section_correct_count + section_incorrect_count + section_blank_count;
  const { labels, data: values, backgroundColor } = getTopicWiseDataset(questions_data);

  const pieData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor,
        borderColor: "#fff",
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const pieOptions = {
    cutout: "55%",
    plugins: {
      legend: { display: false },
      datalabels: {
        formatter: (val, context) => {
          const total = context.dataset.data.reduce((sum, v) => sum + v, 0);
          if (total === 0) return "";
          const percent = Math.round((val / total) * 100);
          return percent >= 8 ? `${percent}%` : "";
        },
        color: "#fff",
        font: {
          weight: "bold",
          size: 10,
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800">{name}</h3>
      </div>

      {/* Chart + Stats Row */}
      <div className="flex gap-4 items-start">
        {/* Donut Chart */}
        <div className="w-60 h-60 flex-shrink-0">
          <Pie data={pieData} options={pieOptions} />
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-2 gap-2 flex-1">
            {/* Correct */}
            <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-[9px] uppercase text-green-600 font-semibold tracking-wide">Correct</p>
                <p className="text-lg font-black text-green-700">{section_correct_count}</p>
              </div>
            </div>

            {/* Incorrect */}
            <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-[9px] uppercase text-red-600 font-semibold tracking-wide">Incorrect</p>
                <p className="text-lg font-black text-red-700">{section_incorrect_count}</p>
              </div>
            </div>

            {/* Marked */}
            <div className="flex items-center gap-2 p-2.5 bg-orange-50 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <div>
                <p className="text-[9px] uppercase text-orange-600 font-semibold tracking-wide">Marked</p>
                <p className="text-lg font-black text-orange-700">{marked}</p>
              </div>
            </div>

            {/* Blank */}
            <div className="flex items-center gap-2 p-2.5 bg-gray-100 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-gray-400 flex items-center justify-center shadow-sm">
                <div className="w-3 h-3 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <p className="text-[9px] uppercase text-gray-500 font-semibold tracking-wide">Blank</p>
                <p className="text-lg font-black text-gray-700">{section_blank_count}</p>
              </div>
            </div>
          </div>

          <div className="py-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Time on Section</span>
              </div>
              <span className="font-bold text-gray-800">{timeInMMSS(time_on_section)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>Time on Correct</span>
              </div>
              <span className="font-bold text-green-600">{timeInMMSS(section_correct_time_taken)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Time on Incorrect</span>
              </div>
              <span className="font-bold text-red-600">{timeInMMSS(section_incorrect_time_taken)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Metrics */}

    </div>
  );
};

export default SectionSegmentLabel;
