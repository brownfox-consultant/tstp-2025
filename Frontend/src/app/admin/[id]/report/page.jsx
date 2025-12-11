"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "@/app/constants/apiConstants";
import ChartBlock from "@/components/ChartBlock";

const GET_Courses = `${BASE_URL}/api/course/list/`;

export default function ReportPage() {
  const [selectedFilter, setSelectedFilter] = useState("last_month");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [appliedCustomDate, setAppliedCustomDate] = useState({ start: "", end: "" });
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(GET_Courses, { withCredentials: true });
        setCourses(response.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, []);

  const filterBtnClass = (filter) =>
    `px-4 py-1 text-sm rounded-md ${
      selectedFilter === filter
        ? "bg-black text-white"
        : "bg-gray-100 hover:bg-gray-200 text-black"
    }`;

  return (
    <div className="">
      <div className="text-2xl font-bold mb-4 text-black">Reports</div>

      <div className="flex justify-between flex-wrap items-center gap-4 mb-6">
        {/* Filter buttons */}
        <div className="flex gap-2">
          <button onClick={() => {
            setSelectedFilter("last_month");
            setAppliedCustomDate({ start: "", end: "" });
          }} className={filterBtnClass("last_month")}>
            Last month
          </button>
          <button onClick={() => {
            setSelectedFilter("last_week");
            setAppliedCustomDate({ start: "", end: "" });
          }} className={filterBtnClass("last_week")}>
            Last week
          </button>
          <button onClick={() => {
            setSelectedFilter("today");
            setAppliedCustomDate({ start: "", end: "" });
          }} className={filterBtnClass("today")}>
            Today
          </button>
        </div>

        {/* Custom Date Picker */}
        <div className="relative inline-block text-left">
          <button
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              setSelectedFilter(""); // clear selected filter
            }}
            className={`flex items-center gap-2 px-4 py-1 text-sm rounded-md transition-colors ${
              showDatePicker ? "bg-blue-100 text-blue-700" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {showDatePicker ? "✖ Hide custom date" : "📅 Select custom date"}
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-md z-20 p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Custom Date Range</div>
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">From:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="border px-2 py-1 rounded-md text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">To:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="border px-2 py-1 rounded-md text-sm"
                  />
                </div>
                <button
                  onClick={() => {
                    setAppliedCustomDate({
                      start: customStartDate,
                      end: customEndDate,
                    });
                    setShowDatePicker(false);
                  }}
                  className="w-full mt-2 bg-blue-500 text-white text-sm py-1.5 rounded-md hover:bg-blue-600"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 📊 Full Length Test Chart */}
      <ChartBlock
        title="Full Length Test"
        courses={courses}
        selectedFilter={selectedFilter}
        customStartDate={appliedCustomDate.start}
        customEndDate={appliedCustomDate.end}
        apiPath="/api/test/full-length-scores/"
      />

      {/* 📊 Practice Test Chart */}
      <ChartBlock
        title="Practice Questions"
        courses={courses}
        selectedFilter={selectedFilter}
        customStartDate={appliedCustomDate.start}
        customEndDate={appliedCustomDate.end}
        apiPath="/api/practice/practice-test-scores/"
      />
    </div>
  );
}
