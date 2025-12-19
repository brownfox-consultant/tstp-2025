"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashBoardStatsComponent from "@/components/DashBoardStatsComponent";
import TestReportsChart from "@/components/TestReportsChart";
import TestScoresChart from "@/components/TestScoresChart";
import FullLengthPracticeTestBar from "@/components/FullLengthPracticeTestBar";
import DashBoardImprovementStrengthComponent from "@/components/DashBoardImprovementStrengthComponent";
import FreeUserPage from "@/components/FreeUserPage";
import { CalendarIcon, RocketIcon, PracticeIcon, ReportIcon } from "@/components/icons/dashboard-icons";

function DashboardPage() {
  const [name, setName] = useState("");
  const [isFreeUser, setIsFreeUser] = useState(false);
  const [selectedTab, setSelectedTab] = useState("last_month");
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setName(window.localStorage.getItem("name") || "Student");
      const type = window.localStorage.getItem("subscription_type");
      setIsFreeUser(type === "FREE");
      
      // Format current date
      const today = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDate(today.toLocaleDateString('en-US', options));
    }
  }, []);

  const handleNavigation = (path) => {
    const basePath = pathname.split("/").slice(0, 3).join("/");
    router.push(`${basePath}${path}`);
  };

  const timeFilters = [
    { key: "today", label: "Today" },
    { key: "last_week", label: "Last Week" },
    { key: "last_month", label: "Last Month" },
    { key: "last_six_month", label: "Last Six Month" },
  ];

  // If FREE USER → show free UI
  if (isFreeUser) {
    return <FreeUserPage />;
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold  tracking-tight">
              <span className="text-gray-800">Welcome back, </span> <b className="text-orange-500">{name}</b> <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="text-gray-500 mt-1 text-md">Here's your learning progress overview</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
            <CalendarIcon />
            <span className="text-sm font-medium text-gray-700">{currentDate}</span>
          </div>
        </div>
      </div>

      {/* Time Filter Tabs */}
      <div className="mb-6">
        <div className="inline-flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          {timeFilters.map((filter) => (
            <button
              key={filter.key}
              className={`px-4 md:px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                selectedTab === filter.key
                  ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 bg-transparent"
              }`}
              onClick={() => setSelectedTab(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button 
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-medium bg-white shadow-md hover:shadow-lg hover:text-white hover:bg-gradient-to-r hover:from-orange-500 hover:to-amber-400"
          onClick={() => handleNavigation("/test?tab=full")}
        >
          <RocketIcon />
          Start Full-Length Test
        </button>
        <button 
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-medium bg-white shadow-md hover:shadow-lg hover:text-white hover:bg-gradient-to-r hover:from-orange-500 hover:to-amber-400"
          onClick={() => handleNavigation("/test?tab=self")}
        >
          <PracticeIcon />
          Practice Questions
        </button>
        <button 
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-medium bg-white shadow-md hover:shadow-lg hover:text-white hover:bg-gradient-to-r hover:from-orange-500 hover:to-amber-400"
          onClick={() => handleNavigation("/report")}
        >
          <ReportIcon />
          View Reports
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <DashBoardStatsComponent date={selectedTab} />

          {/* Time Spent Chart */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-3">
              <span className="w-1 h-5 bg-gradient-to-b from-orange-500 to-amber-400 rounded-full"></span>
              Time Spent Analysis
            </h2>
            <TestReportsChart date={selectedTab} />
          </div>

          {/* Score Trends */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-3">
              <span className="w-1 h-5 bg-gradient-to-b from-orange-500 to-amber-400 rounded-full"></span>
              Score Trends
            </h2>
            <TestScoresChart dateRange={selectedTab} />
          </div>

          {/* Full Length vs Practice Chart */}
          <div className="mb-8">
            <FullLengthPracticeTestBar date={selectedTab} />
          </div>

          {/* Improvement & Strength Areas */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-3">
              <span className="w-1 h-5 bg-gradient-to-b from-orange-500 to-amber-400 rounded-full"></span>
              Areas of Focus
            </h2>
            <DashBoardImprovementStrengthComponent date={selectedTab} />
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
