"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashBoardStatsComponent from "@/components/DashBoardStatsComponent";
import TestReportsChart from "@/components/TestReportsChart";
import TestScoresChart from "@/components/TestScoresChart";
import FullLengthPracticeTestBar from "@/components/FullLengthPracticeTestBar";
import DashBoardImprovementStrengthComponent from "@/components/DashBoardImprovementStrengthComponent";
import FreeUserPage from "@/components/FreeUserPage";
import { RocketIcon, PracticeIcon, ReportIcon } from "@/components/icons/dashboard-icons";
import DashboardHeader from "@/components/DashboardHeader";
import "@/app/Dashboard.css";


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

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleTabChange = (key) => {
    if (key === selectedTab) return;
    setIsLoading(true);
    setSelectedTab(key);
    // Simulate a refresh delay for better UX
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
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
    <div>

      <DashboardHeader name={name} />

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
        {/* Time Filter Tabs */}
        <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
          <div className="inline-flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 whitespace-nowrap">
            {timeFilters.map((filter) => (
              <button
                key={filter.key}
                className={`dashboard-tab-button ${selectedTab === filter.key
                  ? "dashboard-tab-active"
                  : "dashboard-tab-inactive"
                  }`}
                onClick={() => handleTabChange(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <button
            className="dashboard-action-button flex-1 sm:flex-none justify-center"
            onClick={() => handleNavigation("/test?tab=full")}
          >
            <RocketIcon />
            <span className="whitespace-nowrap">Start Full-Length Test</span>
          </button>
          <button
            className="dashboard-action-button flex-1 sm:flex-none justify-center"
            onClick={() => handleNavigation("/test?tab=self")}
          >
            <PracticeIcon />
            <span className="whitespace-nowrap">Practice Questions</span>
          </button>
          <button
            className="dashboard-action-button flex-1 sm:flex-none justify-center"
            onClick={() => handleNavigation("/report")}
          >
            <ReportIcon />
            <span className="whitespace-nowrap">View Reports</span>
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        
        <div className="grid gap-5 mb-8">
          <DashBoardStatsComponent date={selectedTab} />

          <TestScoresChart dateRange={selectedTab} />

          <FullLengthPracticeTestBar date={selectedTab} />

          <DashBoardImprovementStrengthComponent date={selectedTab} />
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
