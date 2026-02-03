"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import DashBoardStatsComponent from "@/components/DashBoardStatsComponent";
import TestReportsChart from "@/components/TestReportsChart";
import TestScoresChart from "@/components/TestScoresChart";
import FullLengthPracticeTestBar from "@/components/FullLengthPracticeTestBar";
import DashBoardImprovementStrengthComponent from "@/components/DashBoardImprovementStrengthComponent";
import { useGlobalContext } from "@/context/store";
import FreeUserPage from "@/components/FreeUserPage";
import {
  RocketIcon,
  PracticeIcon,
  ReportIcon,
} from "@/components/icons/dashboard-icons";
import DashboardHeader from "@/components/DashboardHeader";
import "@/app/Dashboard.css";
import axios from "axios";
import { BASE_URL } from "@/app/constants/apiConstants";
import Heatmap from "@/components/student_report/Heatmap";
import LastTestActivity from "@/components/student_report/LastTestActivity";
import { Tabs, Select } from "antd";
import { getTestsList, getPracticeTests } from "@/app/services/authService";

function DashboardPage() {
  const [name, setName] = useState("");
  const [selectedTab, setSelectedTab] = useState("last_month");
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { id } = useParams();

  const { subscriptionType } = useGlobalContext();
  const isFreeUser = subscriptionType === "FREE";

  const [heatmapData, setHeatmapData] = useState([]);
  const [fullLengthData, setFullLengthData] = useState([]);
  const [practiceData, setPracticeData] = useState([]);
  const [heatmapTab, setHeatmapTab] = useState("fullLength");

  const [latestFullLengthTests, setLatestFullLengthTests] = useState([]);
  const [latestPracticeTests, setLatestPracticeTests] = useState([]);
  
  const [coursesList, setCoursesList] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setName(window.localStorage.getItem("name") || "Student");

      // Format current date
      const today = new Date();
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      setCurrentDate(today.toLocaleDateString("en-US", options));
    }
  }, []);

  // Fetch Last Activity Data
  useEffect(() => {
    async function loadLastActivity() {
      try {
        const params = { page: 1, page_size: 5 };
        
        if (selectedCourseId !== "all") {
          params.course_id = selectedCourseId;
        }

        // Full Length
        const fullRes = await getTestsList(params);
        if (fullRes.data && fullRes.data.results) {
           setLatestFullLengthTests(fullRes.data.results.slice(0, 5));
        } else {
           setLatestFullLengthTests([]);
        }

        // Practice
        const practiceRes = await getPracticeTests(params);
        if (practiceRes.data && practiceRes.data.results) {
           setLatestPracticeTests(practiceRes.data.results.slice(0, 5));
        } else {
           setLatestPracticeTests([]);
        }

      } catch (err) {
        console.error("Error loading last activity:", err);
        setLatestFullLengthTests([]);
        setLatestPracticeTests([]);
      }
    }
    loadLastActivity();
  }, [selectedCourseId]);

  // Fetch Heatmap Data
  useEffect(() => {
    if (!id) return;

    async function loadHeatmapData() {
      try {
        // 1. Get Courses
        const courseRes = await axios.get(
          `${BASE_URL}/api/course/student-courses/?user_id=${id}`,
          { withCredentials: true }
        );
        const courses = courseRes.data;
        if (!courses || courses.length === 0) return;
        setCoursesList(courses);

        // 2. Fetch data for ALL courses
        const promises = [];
        courses.forEach(course => {
            promises.push(axios.get(`${BASE_URL}/api/result/Date_Wise_Time/?student_id=${id}&course_id=${course.id}&test_type=fullLength`, { withCredentials: true }).then(r => ({ type: 'fullLength', courseId: course.id, data: r.data })).catch(e => ({ type: 'fullLength', courseId: course.id, data: [] })));
            promises.push(axios.get(`${BASE_URL}/api/result/Date_Wise_Time/?student_id=${id}&course_id=${course.id}&test_type=practiceTest`, { withCredentials: true }).then(r => ({ type: 'practiceTest', courseId: course.id, data: r.data })).catch(e => ({ type: 'practiceTest', courseId: course.id, data: [] })));
        });
        
        const results = await Promise.all(promises);
        
        let aggregatedFull = [];
        let aggregatedPractice = [];
        
        results.forEach(res => {
            if (res.data && Array.isArray(res.data)) {
                // Inject courseId into each data item
                const dataWithCourse = res.data.map(item => ({ ...item, courseId: res.courseId }));
                if (res.type === 'fullLength') aggregatedFull = [...aggregatedFull, ...dataWithCourse];
                else aggregatedPractice = [...aggregatedPractice, ...dataWithCourse];
            }
        });

        setFullLengthData(aggregatedFull);
        setPracticeData(aggregatedPractice);

      } catch (error) {
        console.error("Error loading heatmap data:", error);
      }
    }
    loadHeatmapData();
  }, [id]);

  // Process data based on selected tab
  useEffect(() => {
    let dataToProcess = heatmapTab === "fullLength" ? fullLengthData : practiceData;
    
    // Filter by Course
    if (selectedCourseId !== "all") {
       dataToProcess = dataToProcess.filter(d => d.courseId === selectedCourseId);
    }
    
    const dateMap = {};

    if (dataToProcess) {
       dataToProcess.forEach(item => {
          const dateKey = new Date(item.date).toDateString(); 
          if (!dateMap[dateKey]) {
                dateMap[dateKey] = { date: item.date, seconds: 0 };
          }
          dateMap[dateKey].seconds += item.seconds;
       });
    }

    // 3. Transform Data for Heatmap
    const transformed = Object.values(dateMap).map((item) => {
      const d = new Date(item.date);
      return {
        dayLabel: d.getDate().toString(),
        monthIndex: d.getMonth(),
        seconds: item.seconds,
      };
    });
    setHeatmapData(transformed);

  }, [fullLengthData, practiceData, heatmapTab, selectedCourseId]);

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

  const handleViewAllActivity = () => {
    if (heatmapTab === "fullLength") {
      router.push(`/student/${id}/test/full`);
    } else {
      router.push(`/student/${id}/test/practice`);
    }
  };

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

      <div className="grid gap-5 mb-8">
        <DashBoardStatsComponent date={selectedTab} />

        <TestScoresChart dateRange={selectedTab} />

        <div className="-mb-5 -mt-2 px-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs
            activeKey={heatmapTab}
            onChange={setHeatmapTab}
            items={[
              {
                key: 'fullLength',
                label: 'Full Length Test',
              },
              {
                key: 'practiceTest',
                label: 'Practice Test',
              },
            ]}
          />
          
          <Select 
            value={selectedCourseId}
            onChange={setSelectedCourseId}
            style={{ width: 220 }}
            options={[
              { value: "all", label: "All Courses" },
              ...coursesList.map(c => ({ value: c.id, label: c.name }))
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          <Heatmap 
            dateWise={heatmapData} 
          />
          <LastTestActivity 
            activeTab={heatmapTab} 
            fullLengthData={latestFullLengthTests}
            practiceData={latestPracticeTests}
            onViewAll={handleViewAllActivity}
            onTestClick={handleTestClick}
          />
        </div>
        
        <DashBoardImprovementStrengthComponent date={selectedTab} />
      </div>
    </div>
  );
}

export default DashboardPage;
