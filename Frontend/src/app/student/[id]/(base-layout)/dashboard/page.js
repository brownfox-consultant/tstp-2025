"use client";

import DashBoardImprovementStrengthComponent from "@/components/DashBoardImprovementStrengthComponent";
import DashBoardStatsComponent from "@/components/DashBoardStatsComponent";
import FullLengthPracticeTestBar from "@/components/FullLengthPracticeTestBar";
import React, { useState, useEffect } from "react";
import TestReportsChart from "@/components/TestReportsChart";
import TestScoresChart from "@/components/TestScoresChart";
import FreeUserPage from "@/components/FreeUserPage";

function DashboardPage() {
  const [name, setName] = useState("");
  const [isFreeUser, setIsFreeUser] = useState(false);
  const [selectedTab, setSelectedTab] = useState("last_month");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setName(window.localStorage.getItem("name"));

      const type = window.localStorage.getItem("subscription_type");
      setIsFreeUser(type === "FREE");
    }
  }, []);

  // ⭐ If FREE USER → show free UI
  if (isFreeUser) {
    return <FreeUserPage />;
  }

  // ⭐ Otherwise PAID dashboard
  return (
    <div>
      <h2 className="text-2xl font-semibold ml-4">Welcome back, {name}</h2>

      <div className="inline-flex border border-gray-300 rounded-lg mt-8 ml-4">
        <div
          className={`px-4 py-2 cursor-pointer rounded-l-lg ${
            selectedTab === "last_six_month" ? "bg-gray-50" : "bg-white"
          } border-r border-gray-300 font-medium text-base`}
          onClick={() => setSelectedTab("last_six_month")}
        >
          Last six month
        </div>

        <div
          className={`px-4 py-2 cursor-pointer rounded-l-lg ${
            selectedTab === "last_month" ? "bg-gray-50" : "bg-white"
          } border-r border-gray-300 font-medium text-base`}
          onClick={() => setSelectedTab("last_month")}
        >
          Last month
        </div>

        <div
          className={`px-4 py-2 cursor-pointer ${
            selectedTab === "last_week" ? "bg-gray-50" : "bg-white"
          } border-r border-gray-300 font-medium text-base`}
          onClick={() => setSelectedTab("last_week")}
        >
          Last week
        </div>

        <div
          className={`px-4 py-2 cursor-pointer rounded-r-lg font-medium text-base ${
            selectedTab === "today" ? "bg-gray-50" : "bg-white"
          }`}
          onClick={() => setSelectedTab("today")}
        >
          Today
        </div>
      </div>

      {isLoading ? (
        <div className="loader">Loading...</div>
      ) : (
        <>
          <DashBoardStatsComponent date={selectedTab} />
          <TestReportsChart date={selectedTab} />
          <TestScoresChart dateRange={selectedTab} />
          <div className="mt-6 md:mt-8 lg:mt-10">
            <FullLengthPracticeTestBar date={selectedTab} />
          </div>
          <DashBoardImprovementStrengthComponent date={selectedTab} />
        </>
      )}
    </div>
  );
}

export default DashboardPage;
