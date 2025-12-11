// components/RingChart.js
import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const RingChart = ({ data }) => {
  const correctCount = data.correct_count;
  const incorrectCount = data.incorrect_count;
  const totalCount = correctCount + incorrectCount;

  const correctPercentage = (correctCount / totalCount) * 100;
  const incorrectPercentage = (incorrectCount / totalCount) * 100;

  const chartData = {
    datasets: [
      {
        data: [correctPercentage, incorrectPercentage],
        backgroundColor: ["#4CAF50", "#F44336"],
        hoverBackgroundColor: ["#66BB6A", "#E57373"],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    cutout: "70%",
    plugins: {
      tooltip: { enabled: false },
      legend: { display: false },
      datalabels: { display: false }, // ✅ prevents internal numbers
    },
  };

  return (
    <div style={{ width: "40px", height: "40px" }}>
      <Doughnut data={chartData} options={chartOptions} />
    </div>
  );
};

export default RingChart;
