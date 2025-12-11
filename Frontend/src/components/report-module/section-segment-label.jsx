import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { timeInMMSS } from "@/utils/utils";
import Image from "next/image";
import BookmarkIcon from "../../../public/bookmark2.svg";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

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
    backgroundColor.push(status === "correct" ? "#22c55e" : "#ef4444"); // green/red
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
    marked,
    questions_data = [],
  } = data;

  const { labels, data: values, backgroundColor } = getTopicWiseDataset(questions_data);

  const pieData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor,
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    cutout: "50%",
    plugins: {
      legend: { display: false },
      datalabels: {
        formatter: (val, context) => {
          const total = context.dataset.data.reduce((sum, v) => sum + v, 0);
          const percent = ((val / total) * 100).toFixed(0);
          return `${percent}%`; // Don't show if <5%
        },
        color: "#000",
        font: {
          weight: "bold",
          size: 12,
        },
        clamp: true,
        clip: false,
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-4 flex flex-col lg:flex-row items-center lg:items-stretch gap-6 w-full max-w-4xl mx-auto border border-gray-100">
      {/* Chart Section */}
      <div className="w-60 h-60 flex-shrink-0">
        <Pie data={pieData} options={pieOptions} />
      </div>

      {/* Details */}
      

      <div className="flex-1 space-y-3">
        <h2 className="text-xl font-semibold text-gray-800">{name}</h2>

        <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
  {/* 1 - Correct (top-left) */}
  <div className="flex items-center gap-1">
    ✅ <span className="font-medium">Correct:</span> {section_correct_count}
  </div>

  {/* 2 - Incorrect (top-right) */}
  <div className="flex items-center gap-1">
    ❌ <span className="font-medium">Incorrect:</span> {section_incorrect_count}
  </div>

  {/* 3 - Marked (bottom-left) */}
  <div className="flex items-center gap-1">
    <Image src={BookmarkIcon} width={16} height={16} alt="Marked" />
    {marked} Marked
  </div>

  {/* 4 - Blank (bottom-right) */}
  <div className="flex items-center gap-1">
    ⚪ <span className="font-medium">Blank:</span> {section_blank_count}
  </div>
</div>


        <div className="pt-2 text-sm text-gray-700 space-y-1" style={{textAlign:"left"}}
    >
          <div>🕒 <b>Time on Section:</b> {timeInMMSS(time_on_section)}</div>
          <div>🟢 <b>Time on Correct:</b> {timeInMMSS(section_correct_time_taken)}</div>
          <div>🔴 <b>Time on Incorrect:</b> {timeInMMSS(section_incorrect_time_taken)}</div>
        </div>
      </div>
    </div>
  );
};

export default SectionSegmentLabel;
