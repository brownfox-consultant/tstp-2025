"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { BASE_URL } from "@/app/constants/apiConstants";

const TestReportsChart = ({ date }) => {
  const [activeTab, setActiveTab] = useState("full");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [lineChartData, setLineChartData] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/course/list/`, {
          withCredentials: true,
        });
        setCourses(response.data);
        if (response.data.length > 0) {
          setSelectedCourse(response.data[0].id);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;

    const fetchChartData = async () => {
      try {
        const tabParam = activeTab === "full" ? "fullLengthTest" : "practiceTest";

        const response = await axios.get(`${BASE_URL}/api/test/time-spent-per-day/`, {
          params: {
            tab: tabParam,
            course: selectedCourse,
            date_range: date,
          },
          withCredentials: true,
        });

        let data = response.data;

        // 🟡 Center if only one data point
        if (data.length === 1) {
          const single = data[0];
          data = [
            { date: "", minutes: 0 }, // left padding
            single,
            { date: "", minutes: 0 }, // right padding
          ];
        }

        setLineChartData(data);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchChartData();
  }, [activeTab, selectedCourse, date]);

  return (
    <div className="w-[97%] mx-auto h-[470px] pt-2 p-5 bg-white border border-gray-300 rounded-lg shadow-md">
      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded text-sm ${activeTab === "full" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setActiveTab("full")}
          >
            Full length test
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${activeTab === "practice" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setActiveTab("practice")}
          >
            Practice Questions
          </button>
        </div>

        <div className="flex gap-2">
          <select
            className="border px-2 py-1 rounded text-sm"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={lineChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date"  />
            <YAxis
              label={{ value: "In minutes", angle: -90, position: "insideLeft" }}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value) => `${value}`}
              cursor={{ fill: "transparent" }}
            />
            <Area
              type="monotone"
              dataKey="minutes"
              stroke="#FFA726"
              fill="#FFF3E0"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TestReportsChart;
