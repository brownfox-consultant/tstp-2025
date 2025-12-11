"use client";
import React, { useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function Dashboard() {
  const [selectedCourse, setSelectedCourse] = useState("SAT");
  const [selectedStudent, setSelectedStudent] = useState("All Students");

  const summaryCards = [
    { title: "Assignments", value: 23, result: "+40%" },
    { title: "Full length tests", value: 12, result: "+40%" },
    { title: "Practice Questions", value: 21, result: "-10%" },
    { title: "Avg speed per question", value: "English: 45s, Math: 1m 2s" },
  ];

  const lineData = {
    labels: ["1 Jul", "3 Jul", "5 Jul", "8 Jul", "15 Jul", "18 Jul", "21 Jul", "27 Jul", "30 Jul"],
    datasets: [
      {
        label: "Time Taken",
        data: [400, 600, 500, 700, 300, 350, 420, 600, 680],
        fill: true,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const barData = {
    labels: ["1 Jul", "3 Jul", "5 Jul", "8 Jul", "15 Jul", "18 Jul", "21 Jul", "27 Jul", "30 Jul"],
    datasets: [
      {
        label: "Time Taken",
        data: [45, 60, 40, 65, 55, 50, 35, 60, 50],
        backgroundColor: "#fbbf24",
      },
      {
        label: "Accuracy %",
        data: [60, 65, 70, 90, 80, 75, 50, 70, 65],
        type: "line",
        borderColor: "#8b5cf6",
        fill: false,
      },
    ],
  };

  const strengths = [
    { name: "Algebra: Linear Solving", percent: 100 },
    { name: "Problem-Solving: Proportional Relationships", percent: 100 },
    { name: "Strategies: Plugging in the Answers", percent: 90 },
  ];

  const weaknesses = [
    { name: "Reading: Vocabulary", percent: 10 },
    { name: "Writing Rhetoric: Transitions", percent: 20 },
    { name: "Algebra: Representation and Interpretation", percent: 30 },
  ];

  const ProgressBar = ({ name, percent, color }) => (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span>{name}</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center">
        <h2 className="text-xl font-bold">Welcome back, Jane Doe</h2>
        <div className="flex flex-wrap gap-2">
          {["Last month", "Last week", "Today"].map((label) => (
            <button key={label} className="border px-3 py-1 rounded text-sm">
              {label}
            </button>
          ))}
          <button className="border px-3 py-1 rounded text-sm">Select custom date</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <div key={i} className="p-4 bg-white shadow rounded-lg space-y-1">
            <p className="text-sm text-gray-500">{card.title}</p>
            <h3 className="text-xl font-bold">{card.value}</h3>
            {card.result && (
              <span className={`text-sm font-medium ${card.result.startsWith("+") ? "text-green-600" : "text-red-500"}`}>
                {card.result}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Test Report Chart */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Test Reports</h3>
          <div className="flex gap-2">
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="border rounded p-1 text-sm">
              <option value="SAT">SAT</option>
              <option value="ACT">ACT</option>
            </select>
            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="border rounded p-1 text-sm">
              <option>All Students</option>
              <option>Student A</option>
              <option>Student B</option>
            </select>
          </div>
        </div>
        <Line data={lineData} />
      </div>

      {/* Speed vs Accuracy */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-2">Test Speed vs Accuracy</h3>
        <Bar data={barData} />
      </div>

      {/* Strengths & Weaknesses */}
      <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Key Strengths</h3>
          {strengths.map((s, i) => (
            <ProgressBar key={i} name={s.name} percent={s.percent} color="bg-green-500" />
          ))}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Areas for Improvement</h3>
          {weaknesses.map((w, i) => (
            <ProgressBar key={i} name={w.name} percent={w.percent} color="bg-red-500" />
          ))}
        </div>
      </div>
    </div>
  );
}
