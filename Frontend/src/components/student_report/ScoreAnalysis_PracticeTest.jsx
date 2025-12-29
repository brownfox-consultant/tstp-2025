"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { BASE_URL } from "@/app/constants/apiConstants";
import axios from "axios";

export default function ScoreAnalysis_PracticeTest({
  student_id,
  course_id,
  courseName = "Course",
}) {
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(6);
  const [hideButtons, setHideButtons] = useState(false);
  
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const subjectOptions = useMemo(() => {
    const baseOptions = [{ value: "All", label: "All" }];
    
    if (!apiData || !apiData.tests) return baseOptions;

    // Get unique subjects from the tests
    const subjects = [...new Set(apiData.tests.map(t => t.subject))].filter(Boolean);
    
    // Create options from unique subjects
    const dynamicOptions = subjects.map(subject => ({
      value: subject,
      label: subject
    }));

    return [...baseOptions, ...dynamicOptions];
  }, [apiData]);

  const selectedOption = subjectOptions.find(opt => opt.value === selectedSubject);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    if (!student_id || !course_id) return;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${BASE_URL}/api/result/score-analysis/`, {
            params: {
                student_id,
                course_id,
                test_type: "PRACTICE"
            },
            withCredentials: true
        });
        setApiData(res.data);
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [student_id, course_id]);


  // Filter data based on selected subject
  const chartData = useMemo(() => {
    if (!apiData || !apiData.tests) return [];

    let filteredTests = apiData.tests;
    if (selectedSubject !== "All") {
      filteredTests = filteredTests.filter(t => t.subject === selectedSubject);
    }
    
    // Sort by date (oldest first or newest first? usually charts show chronological left-to-right)
    // Assuming API returns chronological or we sort. Let's sort by date ascending for chart.
    const sortedTests = [...filteredTests].sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

    return sortedTests.map(t => ({
        name: `T-${t.practice_test_id}`, // Label for X-axis
        Total: t.total_questions,
        Correct: t.correct,
        Incorrect: t.incorrect,
        subject: t.subject,
        date: t.date_time,
        // formattedDate: new Date(t.date_time).toLocaleDateString() // Optional for tooltip
    }));
  }, [apiData, selectedSubject]);

  // Reset pagination when subject changes
  useEffect(() => {
    setStartIndex(0);
  }, [selectedSubject]);

  /* ================= RESPONSIVE VISIBLE COUNT ================= */
  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      
      // Hide buttons below 500px
      setHideButtons(width < 500);
      
      if (width < 640) {
        setVisibleCount(2);
      } else if (width < 1024) {
        setVisibleCount(4);
      } else if (width < 1300) {
        setVisibleCount(6);
      } else if (width < 1400) {
        setVisibleCount(8); 
      } else {
        setVisibleCount(10); 
      }
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  /* ================= NAVIGATION ================= */
  const displayData = chartData.slice(startIndex, startIndex + visibleCount);
  const canGoLeft = startIndex > 0;
  const canGoRight = startIndex + visibleCount < chartData.length;
  const needsPagination = chartData.length > visibleCount;

  const handlePrev = () => {
    if (canGoLeft) {
      setStartIndex(prev => Math.max(0, prev - visibleCount));
    }
  };

  const handleNext = () => {
    if (canGoRight) {
      setStartIndex(prev => Math.min(chartData.length - visibleCount, prev + visibleCount));
    }
  };

  /* ================= CALCULATE SUMMARY ================= */
  const totalQuestions = chartData.reduce((sum, d) => sum + d.Total, 0);
  const totalCorrect = chartData.reduce((sum, d) => sum + d.Correct, 0);
  const totalIncorrect = chartData.reduce((sum, d) => sum + d.Incorrect, 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  /* ================= RENDER ================= */
  return (
    <div className="space-y-8 animate-fadeIn mb-10">

      {/* ================= SCORE CHART ================= */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        
        {/* Header: Title on Left, Dropdown on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            Practice Test - {courseName} Analysis
          </h3>
          
          {/* Subject Filter - Custom Dropdown */}
          {subjectOptions.length > 2 && (
            <div className="flex gap-1 align-baseline">
              <span className="text-sm font-semibold text-amber-500 uppercase tracking-wide flex items-center align-baseline me-2">Subject</span>
              <div className="relative">
                {/* Dropdown Button */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                  className="flex items-center justify-between gap-4 px-3 py-2 min-w-[120px] bg-white border border-gray-200 rounded-md text-gray-800 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 cursor-pointer transition-all duration-200 hover:border-amber-100"
                >
                  <span>{selectedOption?.label}</span>
                  <svg 
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Options */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 w-full bg-white rounded-md shadow-md overflow-hidden z-50 border border-gray-100">
                    {subjectOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedSubject(option.value);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left font-medium transition-all duration-150 cursor-pointer
                          ${selectedSubject === option.value 
                            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' 
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <span>{option.label}</span>
                        {selectedSubject === option.value && (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chart Area */}
        {chartData.length === 0 ? (
          <div className="h-[350px] w-full flex flex-col items-center justify-center text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
             </div>
             <h4 className="text-lg font-semibold text-gray-700">No Data Available</h4>
             <p className="text-sm text-gray-500 mt-1">
               {selectedSubject !== "All" 
                 ? `No practice tests found for ${selectedSubject}.` 
                 : "No practice tests data available yet."}
             </p>
          </div>
        ) : (
          /* Chart with Navigation Arrows */
          <div className="relative flex items-center">
            {/* Left Arrow - Only show when pagination is needed AND can go left */}
            {!hideButtons && needsPagination && canGoLeft && (
              <button
                onClick={handlePrev}
                className="absolute left-0 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-amber-500 text-white shadow-lg hover:bg-amber-600 hover:scale-110 cursor-pointer"
                style={{ left: '-5px' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Chart */}
            <div className={`h-[350px] w-full flex justify-center ${hideButtons ? 'px-2' : 'px-12'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayData} barGap={2} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 'auto']}
                    fontSize={11}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  
                  {/* Grouped Bars: Total, Correct, Incorrect */}
                  <Bar
                    dataKey="Total"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                    name="Total Questions"
                  />
                  <Bar
                    dataKey="Correct"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                    name="Correct"
                  />
                  <Bar
                    dataKey="Incorrect"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                    name="Incorrect"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Right Arrow - Only show when pagination is needed AND can go right */}
            {!hideButtons && needsPagination && canGoRight && (
              <button
                onClick={handleNext}
                className="absolute right-0 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-amber-500 text-white shadow-lg hover:bg-amber-600 hover:scale-110 cursor-pointer"
                style={{ right: '-5px' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Page Indicator */}
        {chartData.length > visibleCount && (
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: Math.ceil(chartData.length / visibleCount) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStartIndex(idx * visibleCount)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  Math.floor(startIndex / visibleCount) === idx 
                    ? 'bg-amber-500 w-6' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Total Practice Tests */}
        <div className="p-5 rounded-2xl shadow-lg bg-gradient-to-br from-[#FFF8EB] to-[#FFF0D4]">
          <h4 className="text-sm font-semibold uppercase mb-2 text-[#805830]">
            Total Practice Tests
          </h4>
          <div className="text-4xl font-black text-[#F59403]">
            {chartData.length}
          </div>
          <p className="mt-2 text-xs text-[#805830]">
            Tests completed
          </p>
        </div>

        {/* Overall Accuracy */}
        <div className="p-5 rounded-2xl shadow-lg bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5]">
          <h4 className="text-sm font-semibold uppercase mb-2 text-[#065f46]">
            Overall Accuracy
          </h4>
          <div className="text-4xl font-black text-[#10b981]">
            {overallAccuracy}%
          </div>
          <div className="mt-2 w-full bg-green-200 rounded-full h-2">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${overallAccuracy}%`,
                background: "linear-gradient(90deg, #10b981, #6ee7b7)",
              }}
            />
          </div>
        </div>

        {/* Total Correct */}
        <div className="p-5 rounded-2xl shadow-lg bg-gradient-to-br from-[#EBF4FF] to-[#D4E4FF]">
          <h4 className="text-sm font-semibold uppercase mb-2 text-[#1e40af]">
            Total Correct
          </h4>
          <div className="text-4xl font-black text-[#3b82f6]">
            {totalCorrect}
          </div>
          <div className="text-sm text-[#60a5fa]">
            out of {totalQuestions}
          </div>
        </div>

        {/* Total Incorrect */}
        <div className="p-5 rounded-2xl shadow-lg bg-gradient-to-br from-[#FEF2F2] to-[#FECACA]">
          <h4 className="text-sm font-semibold uppercase mb-2 text-[#991b1b]">
            Total Incorrect
          </h4>
          <div className="text-4xl font-black text-[#ef4444]">
            {totalIncorrect}
          </div>
          <p className="mt-2 text-xs text-[#b91c1c]">
            Questions to review
          </p>
        </div>

      </div>
    </div>
  );
}
