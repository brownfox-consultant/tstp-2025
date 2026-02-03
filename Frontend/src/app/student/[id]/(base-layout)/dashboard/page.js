"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { Tabs, Select, notification } from "antd";
import dayjs from "dayjs";
import axios from "axios";

// Components
import DashBoardStatsComponent from "@/components/DashBoardStatsComponent";
import TestScoresChart from "@/components/TestScoresChart";
import DashBoardImprovementStrengthComponent from "@/components/DashBoardImprovementStrengthComponent";
import DashboardHeader from "@/components/DashboardHeader";
import FreeUserPage from "@/components/FreeUserPage";
import Heatmap from "@/components/student_report/Heatmap";
import LastTestActivity from "@/components/student_report/LastTestActivity";
import {
  RocketIcon,
  PracticeIcon,
  ReportIcon,
} from "@/components/icons/dashboard-icons";

// Context & Services
import { useGlobalContext } from "@/context/store";
import { getTestsList, getPracticeTests } from "@/app/services/authService";
import { BASE_URL } from "@/app/constants/apiConstants";

// Styles
import "@/app/Dashboard.css";

/**
 * Student Dashboard Page Component
 * 
 * This component displays the main dashboard for students with:
 * - Performance statistics and charts
 * - Test activity heatmap
 * - Recent test history
 * - Quick action buttons
 * - Smart notifications for test reminders
 */
function DashboardPage() {
  // ==================== ROUTER & PARAMS ====================
  const pathname = usePathname();
  const router = useRouter();
  const { id } = useParams(); // Student ID from URL

  // ==================== GLOBAL CONTEXT ====================
  const { subscriptionType } = useGlobalContext();
  const isFreeUser = subscriptionType === "FREE";

  // ==================== STATE MANAGEMENT ====================
  
  // User Information
  const [name, setName] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Time Filter State
  const [selectedTab, setSelectedTab] = useState("last_month");
  const [isLoading, setIsLoading] = useState(false);

  // Heatmap & Activity State
  const [heatmapTab, setHeatmapTab] = useState("fullLength"); // 'fullLength' or 'practiceTest'
  const [heatmapData, setHeatmapData] = useState([]);
  const [fullLengthData, setFullLengthData] = useState([]);
  const [practiceData, setPracticeData] = useState([]);

  // Test Lists State
  const [latestFullLengthTests, setLatestFullLengthTests] = useState([]);
  const [latestPracticeTests, setLatestPracticeTests] = useState([]);

  // Course Filter State
  const [coursesList, setCoursesList] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("all");

  // ==================== CONSTANTS ====================
  const TIME_FILTERS = [
    { key: "today", label: "Today" },
    { key: "last_week", label: "Last Week" },
    { key: "last_month", label: "Last Month" },
    { key: "last_six_month", label: "Last Six Month" },
  ];

  // ==================== INITIALIZATION ====================
  
  /**
   * Initialize user data from localStorage
   * Sets student name and current date
   */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const studentName = window.localStorage.getItem("name") || "Student";
      setName(studentName);

      const today = new Date();
      const dateOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      setCurrentDate(today.toLocaleDateString("en-US", dateOptions));
    }
  }, []);

  // ==================== DATA FETCHING ====================

  /**
   * Fetch latest test activity (both full-length and practice tests)
   * Filters by selected course if applicable
   */
  useEffect(() => {
    async function loadLastActivity() {
      try {
        const params = { page: 1, page_size: 5 };

        // Add course filter if specific course is selected
        if (selectedCourseId !== "all") {
          params.course_id = selectedCourseId;
        }

        // Fetch Full-Length Tests
        const fullLengthResponse = await getTestsList(params);
        if (fullLengthResponse.data?.results) {
          setLatestFullLengthTests(fullLengthResponse.data.results.slice(0, 5));
        } else {
          setLatestFullLengthTests([]);
        }

        // Fetch Practice Tests
        const practiceResponse = await getPracticeTests(params);
        if (practiceResponse.data?.results) {
          setLatestPracticeTests(practiceResponse.data.results.slice(0, 5));
        } else {
          setLatestPracticeTests([]);
        }
      } catch (error) {
        console.error("Error loading last activity:", error);
        setLatestFullLengthTests([]);
        setLatestPracticeTests([]);
      }
    }

    loadLastActivity();
  }, [selectedCourseId]);

  /**
   * Fetch heatmap data for all courses
   * Loads date-wise time spent data for both test types
   */
  useEffect(() => {
    if (!id) return;

    async function loadHeatmapData() {
      try {
        // Step 1: Fetch student's enrolled courses
        const courseResponse = await axios.get(
          `${BASE_URL}/api/course/student-courses/?user_id=${id}`,
          { withCredentials: true }
        );

        const courses = courseResponse.data;
        if (!courses || courses.length === 0) return;

        setCoursesList(courses);

        // Step 2: Fetch time data for all courses (parallel requests)
        const dataPromises = [];
        
        courses.forEach((course) => {
          // Full-length test data
          dataPromises.push(
            axios
              .get(
                `${BASE_URL}/api/result/Date_Wise_Time/?student_id=${id}&course_id=${course.id}&test_type=fullLength`,
                { withCredentials: true }
              )
              .then((response) => ({
                type: "fullLength",
                courseId: course.id,
                data: response.data,
              }))
              .catch(() => ({
                type: "fullLength",
                courseId: course.id,
                data: [],
              }))
          );

          // Practice test data
          dataPromises.push(
            axios
              .get(
                `${BASE_URL}/api/result/Date_Wise_Time/?student_id=${id}&course_id=${course.id}&test_type=practiceTest`,
                { withCredentials: true }
              )
              .then((response) => ({
                type: "practiceTest",
                courseId: course.id,
                data: response.data,
              }))
              .catch(() => ({
                type: "practiceTest",
                courseId: course.id,
                data: [],
              }))
          );
        });

        // Step 3: Wait for all requests and aggregate data
        const results = await Promise.all(dataPromises);

        let aggregatedFullLength = [];
        let aggregatedPractice = [];

        results.forEach((result) => {
          if (result.data && Array.isArray(result.data)) {
            // Add courseId to each data item for filtering
            const dataWithCourseId = result.data.map((item) => ({
              ...item,
              courseId: result.courseId,
            }));

            if (result.type === "fullLength") {
              aggregatedFullLength = [...aggregatedFullLength, ...dataWithCourseId];
            } else {
              aggregatedPractice = [...aggregatedPractice, ...dataWithCourseId];
            }
          }
        });

        setFullLengthData(aggregatedFullLength);
        setPracticeData(aggregatedPractice);
      } catch (error) {
        console.error("Error loading heatmap data:", error);
      }
    }

    loadHeatmapData();
  }, [id]);

  /**
   * Process and transform heatmap data based on selected filters
   * Aggregates time spent by date and formats for heatmap display
   */
  useEffect(() => {
    // Select data based on active tab
    let dataToProcess = heatmapTab === "fullLength" ? fullLengthData : practiceData;

    // Apply course filter if specific course is selected
    if (selectedCourseId !== "all") {
      dataToProcess = dataToProcess.filter((item) => item.courseId === selectedCourseId);
    }

    // Aggregate data by date
    const dateMap = {};

    dataToProcess.forEach((item) => {
      const dateKey = new Date(item.date).toDateString();
      
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { date: item.date, seconds: 0 };
      }
      
      dateMap[dateKey].seconds += item.seconds;
    });

    // Transform to heatmap format
    const transformedData = Object.values(dateMap).map((item) => {
      const date = new Date(item.date);
      return {
        dayLabel: date.getDate().toString(),
        monthIndex: date.getMonth(),
        seconds: item.seconds,
      };
    });

    setHeatmapData(transformedData);
  }, [fullLengthData, practiceData, heatmapTab, selectedCourseId]);

  // ==================== NOTIFICATIONS ====================

  /**
   * Show notification if student hasn't attempted practice test in 5 days
   * Only shows once per session on large screens
   */
  useEffect(() => {
    const hasShownNotification = sessionStorage.getItem("practiceTestNotificationShown");

    // Don't show if already shown or no tests available
    if (hasShownNotification || latestPracticeTests.length === 0) return;

    const lastPracticeTest = latestPracticeTests[0];

    if (lastPracticeTest?.created_at) {
      const testDate = dayjs(lastPracticeTest.created_at);
      const fiveDaysAgo = dayjs().subtract(5, "days");

      // Show warning if last test was more than 5 days ago
      if (testDate.isBefore(fiveDaysAgo)) {
        notification.warning({
          message: "Practice Test Alert!",
          description:
            "You haven't attempted a practice test in the last 5 days. Keep practicing to improve your skills!",
          placement: "topRight",
          duration: 10,
          style: {
            backgroundColor: "#fff1f0",
            border: "1px solid #ffccc7",
            borderRadius: "8px",
          },
        });

        sessionStorage.setItem("practiceTestNotificationShown", "true");
      }
    }
  }, [latestPracticeTests]);

  /**
   * Show notification when a new full-length test is assigned
   * Tracks each test individually by ID - shows only once per test
   */
  // useEffect(() => {
  //   if (latestFullLengthTests.length === 0) return;

  //   const latestFullLengthTest = latestFullLengthTests[0];

  //   if (latestFullLengthTest) {
  //     const shownTestIds = JSON.parse(
  //       sessionStorage.getItem("fullLengthTestNotificationsShown") || "[]"
  //     );
  //     const testId = latestFullLengthTest.id || latestFullLengthTest.test_id;
      
  //     if (!shownTestIds.includes(testId)) {
  //       notification.success({
  //         key: `new-test-${testId}`,
  //         message: "New Full-Length Test Assigned!",
  //         description: `A new full-length test "${latestFullLengthTest.name}" has been assigned to you. Start test now!`,
  //         placement: "topRight",
  //         duration: 10,
  //         style: {
  //           backgroundColor: "#f6ffed",
  //           border: "1px solid #b7eb8f",
  //           borderRadius: "8px",
  //         },
  //       });

  //       shownTestIds.push(testId);
  //       sessionStorage.setItem(
  //         "fullLengthTestNotificationsShown",
  //         JSON.stringify(shownTestIds)
  //       );
  //     }
  //   }
  // }, [latestFullLengthTests]);

  // ==================== EVENT HANDLERS ====================

  /**
   * Navigate to different sections of the app
   */
  const handleNavigation = (path) => {
    const basePath = pathname.split("/").slice(0, 3).join("/");
    router.push(`${basePath}${path}`);
  };

  /**
   * Handle time filter tab change with loading state
   */
  const handleTabChange = (key) => {
    if (key === selectedTab) return;

    setIsLoading(true);
    setSelectedTab(key);

    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  /**
   * Navigate to full test list page based on active tab
   */
  const handleViewAllActivity = () => {
    if (heatmapTab === "fullLength") {
      router.push(`/student/${id}/test/full`);
    } else {
      router.push(`/student/${id}/test/practice`);
    }
  };

  /**
   * Navigate to test result page when test is clicked
   */
  const handleTestClick = (test, type) => {
    if (type === "fullLength") {
      if (test.test_submission_id) {
        router.push(`/student/${id}/test/full/${test.test_submission_id}/result`);
      }
    } else {
      if (test.id) {
        router.push(`/student/${id}/test/practice/${test.id}/result`);
      }
    }
  };

  // ==================== RENDER ====================

  // Show free user page if subscription is FREE
  if (isFreeUser) {
    return <FreeUserPage />;
  }

  return (
    <div>
      {/* Header Section */}
      <DashboardHeader name={name} />

      {/* Time Filters & Quick Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
        {/* Time Filter Tabs */}
        <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
          <div className="inline-flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 whitespace-nowrap">
            {TIME_FILTERS.map((filter) => (
              <button
                key={filter.key}
                className={`dashboard-tab-button ${
                  selectedTab === filter.key
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

        {/* Quick Action Buttons */}
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

      {/* Main Dashboard Content */}
      <div className="grid gap-5 mb-8">
        {/* Statistics Component */}
        <DashBoardStatsComponent date={selectedTab} />

        {/* Test Scores Chart */}
        <TestScoresChart dateRange={selectedTab} />

        {/* Heatmap Controls (Tab & Course Filter) */}
        <div className="-mb-5 -mt-2 px-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs
            activeKey={heatmapTab}
            onChange={setHeatmapTab}
            items={[
              {
                key: "fullLength",
                label: "Full Length Test",
              },
              {
                key: "practiceTest",
                label: "Practice Test",
              },
            ]}
          />

          <Select
            value={selectedCourseId}
            onChange={setSelectedCourseId}
            style={{ width: 220 }}
            options={[
              { value: "all", label: "All Courses" },
              ...coursesList.map((course) => ({
                value: course.id,
                label: course.name,
              })),
            ]}
          />
        </div>

        {/* Heatmap & Last Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          <Heatmap dateWise={heatmapData} />
          <LastTestActivity
            activeTab={heatmapTab}
            fullLengthData={latestFullLengthTests}
            practiceData={latestPracticeTests}
            onViewAll={handleViewAllActivity}
            onTestClick={handleTestClick}
          />
        </div>

        {/* Improvement & Strength Analysis */}
        <DashBoardImprovementStrengthComponent date={selectedTab} />
      </div>
    </div>
  );
}

export default DashboardPage;
