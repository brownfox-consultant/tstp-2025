"use client";

import "@/app/Dashboard.css";
import React, { useState, useEffect, useMemo } from "react";
import { DatePicker, ConfigProvider, Progress, Table, Tag, Tabs } from "antd";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import Select from "react-select";
import {
  GET_Courses,
  GET_Students,
  BASE_URL,
} from "@/app/constants/apiConstants";
import {
  getStudentCountByCourse,
  getTestResult,
  getDoubtsList,
  getIssuesList,
} from "@/app/services/authService";
import { useParams, useRouter } from "next/navigation";
import {
  ConcernIcon,
  DoubtIcon,
  MeetingIcon,
  IssueIcon,
  SuggestionIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClipboardIcon,
  NoDataChartIcon,
  NoDataClockIcon,
  BadgeCheckIcon,
  ChevronIcon,
  ActivityFeedCalendarIcon,
  QuestionMarkCircleIcon,
  BookOpenNodeIcon,
  CheckCircleNodeIcon,
  PlusCircleNodeIcon,
  ClockMiniIcon,
  BookMiniIcon,
  CheckMiniIcon,
} from "./icons/dashboard-icons";
import { NoDataIcon } from "@/components/icons/improvement-strength-icons";
import { components } from "react-select";
import { Row, Col } from "antd";
// Custom Dropdown Indicator with rotating arrow
const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronIcon
        className="w-4 h-4"
        isOpen={props.selectProps.menuIsOpen}
        color="#805830"
      />
    </components.DropdownIndicator>
  );
};





// Helper for calculating relative time
function timeAgo(dateString) {
  if (!dateString) return "-";
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatActivityTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }) + ", " + date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

// Sparkline data generator based on value and today's count
const generateSparklineData = (value, todayCount) => {
  if (value === 0) return [0, 0, 0, 0, 0];
  const todayVal = todayCount || 0;
  const historicalTotal = value - todayVal;
  const p1 = Math.round(historicalTotal * 0.2);
  const p2 = Math.round(historicalTotal * 0.5);
  const p3 = Math.round(historicalTotal * 0.8);
  const p4 = historicalTotal;
  const p5 = value;
  return [p1, p2, p3, p4, p5];
};

// Lightweight premium visual sparkline area chart
function Sparkline({ data, width = 80, height = 30, color = "#F59403" }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min;
  
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return { x, y };
  });

  const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(" L ")}`;
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;
  const gradId = `sparkline-grad-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg width={width} height={height} className="overflow-visible" style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill={color} />
    </svg>
  );
}

function StatCard({
  title,
  value,
  selectedFilter,
  customStartDate,
  customEndDate,
  apiKey,
  routeName,
  gradientClass,
  trendType = "up",
}) {
  const router = useRouter();
  const { id } = useParams();

  const handleViewAll = () => {
    if (value === 0) return;
    const params = new URLSearchParams();
    params.append("category", apiKey);
    if (selectedFilter === "custom" && customStartDate && customEndDate) {
      params.append("start_date", customStartDate);
      params.append("end_date", customEndDate);
    } else {
      params.append("filter", selectedFilter);
    }
    router.push(`/admin/${id}/${routeName}?${params.toString()}`);
  };

  const isMuted = value === 0;

  return (
    <div
      onClick={handleViewAll}
      className={`relative bg-white rounded-xl p-4 md:p-5 border transition-all duration-300 ${
        isMuted
          ? "border-gray-100 opacity-60 bg-gray-50/50 cursor-default"
          : "border-gray-100 shadow-sm hover:shadow-md cursor-pointer hover:-translate-y-0.5 hover:border-gray-200"
      }`}
    >
      {!isMuted && (
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientClass}`}
        />
      )}

      <div className="flex justify-between items-start mb-2 gap-2">
        <p className={`text-xs font-semibold uppercase tracking-wider ${isMuted ? "text-gray-400" : "text-gray-500"}`}>
          {title}
        </p>
        {!isMuted && (
          <span className="text-xs text-orange-500 font-medium hover:underline flex items-center gap-0.5">
            View all <span className="text-[10px]">→</span>
          </span>
        )}
      </div>

      <div className="flex items-end justify-between mt-3">
        <div>
          <div className={`text-3xl font-extrabold tracking-tight ${isMuted ? "text-gray-400" : "text-gray-900"}`}>
            {value}
          </div>
        </div>

        <div className="flex-shrink-0">
          {trendType === "up" ? (
            <span className="  text-emerald-600 text-lg font-extrabold">
              ↑
            </span>
          ) : (
            <span className="text-red-600 text-lg font-extrabold">
              ↓
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const getActivityIcon = (type, isHighlighted) => {
  if (isHighlighted) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-md shadow-orange-500/20 ring-4 ring-white">
        <QuestionMarkCircleIcon className="w-4 h-4" />
      </div>
    );
  }
  
  switch (type) {
    case "fl-test":
        return (
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                <BookOpenNodeIcon className="w-4 h-4"/>
            </div>
        );

    case "pr-test":
        return (
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                <CheckCircleNodeIcon className="w-4 h-4"/>
            </div>
        );

    case "issue":
        return (
            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">
                <IssueIcon className="w-4 h-4"/>
            </div>
        );

    case "meeting":
        return (
            <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center">
                <MeetingIcon className="w-4 h-4"/>
            </div>
        );

    case "concern":
        return (
            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center">
                <ConcernIcon className="w-4 h-4"/>
            </div>
        );

    case "suggestion":
        return (
            <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                <SuggestionIcon className="w-4 h-4"/>
            </div>
        );

    default:
        return (
            <div className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center">
                <PlusCircleNodeIcon className="w-4 h-4"/>
            </div>
        );
}
};

export default function Dashboard() {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("last_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fullLengthTests, setFullLengthTests] = useState([]);
  const [practiceTests, setPracticeTests] = useState([]);

  const datePickerRef = React.useRef(null);

  const activityConfig = {
  "fl-test": {
    label: "Full Length Test",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  "pr-test": {
    label: "Practice Test",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  issue: {
    label: "Issue",
    badge: "bg-red-50 text-red-700 border border-red-200",
  },
  concern: {
    label: "Concern",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  suggestion: {
    label: "Suggestion",
    badge: "bg-purple-50 text-purple-700 border border-purple-200",
  },
  meeting: {
    label: "Meeting",
    badge: "bg-cyan-50 text-cyan-700 border border-cyan-200",
  },
};



  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [notificationCounts, setNotificationCounts] = useState({});
  const [todayCounts, setTodayCounts] = useState({});
const [activityFeed, setActivityFeed] = useState({
  today: [],
  previous_day: [],
});
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityDayTab, setActivityDayTab] = useState("today"); // "today" or "prev_day"

  const displayActivities = useMemo(() => {
  return activityDayTab === "today"
    ? activityFeed.today
    : activityFeed.previous_day;
}, [activityDayTab, activityFeed]);
  const [courseChartData, setCourseChartData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [barPercentData, setBarPercentData] = useState([]);
  const [timeSpentData, setTimeSpentData] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [activeTab, setActiveTab] = useState("1"); // 1: Full Length, 2: Practice

  const [englishTopics, setEnglishTopics] = useState([]);
  const [mathTopics, setMathTopics] = useState([]);
  const [loadingKeyStrengths, setLoadingKeyStrengths] = useState(false);
  const [questionCounts, setQuestionCounts] = useState([]);
  const statusColor = {
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
};
  const SECTIONS = [
    {
      display: "Concerns",
      key: "CONCERN",
      route: "concerns",
      gradient: "from-orange-500 to-amber-400",
      color: "#F59403",
      trendType: "up",
    },
    {
      display: "Doubts",
      key: "DOUBT",
      route: "doubts",
      gradient: "from-blue-500 to-cyan-400",
      color: "#3B82F6",
      trendType: "up",
    },
    {
      display: "Meetings",
      key: "MEETING",
      route: "meetings",
      gradient: "from-emerald-500 to-teal-400",
      color: "#10B981",
      trendType: "down",
    },
    {
      display: "Issues",
      key: "ISSUE",
      route: "issues",
      gradient: "from-rose-500 to-pink-400",
      color: "#F43F5E",
      trendType: "up",
    },
    {
      display: "Suggestions",
      key: "SUGGESTION",
      route: "suggestions",
      gradient: "from-indigo-500 to-purple-400",
      color: "#6366F1",
      trendType: "down",
    },
  ];
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);

  const finalDateParams = useMemo(() => {
    if (selectedFilter === "custom" && customStartDate && customEndDate) {
      return {
        date_range: "custom",
        start_date: customStartDate,
        end_date: customEndDate,
      };
    }
    return { date_range: selectedFilter };
  }, [selectedFilter, customStartDate, customEndDate]);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/question/question-count/`, {
        withCredentials: true,
      })
      .then((res) => setQuestionCounts(res.data))
      .catch(() => setQuestionCounts([]));

    setLoadingSubmissions(true);

    // Dummy data logic handled via constants
    // setRecentSubmissions(DUMMY_FULL_LENGTH);

    setLoadingSubmissions(false);
  }, []);

  useEffect(() => {
    setLoadingSubmissions(true);

    const endpoint =
      activeTab === "1"
        ? `${BASE_URL}/api/result/recent/full-length/`
        : `${BASE_URL}/api/result/recent/practice/`;

    axios
      .get(endpoint, {
        params: {
          course_id: selectedCourse,
          limit: 10,
          ...finalDateParams,
        },
        withCredentials: true,
      })
      .then((res) => {
        if (activeTab === "1") {
          setFullLengthTests(res.data);
        } else {
          setPracticeTests(res.data);
        }
      })
      .catch((err) => {
        console.error("Recent submissions fetch error:", err);
        if (activeTab === "1") setFullLengthTests([]);
        else setPracticeTests([]);
      })
      .finally(() => setLoadingSubmissions(false));
  }, [activeTab, selectedCourse, selectedStudent, finalDateParams]);

  useEffect(() => {
    if (selectedCourse === null || selectedStudent === null) return;

    axios
      .get(`${BASE_URL}/api/test/full-list/`, {
        params: {
          course_id: selectedCourse || undefined,
          student_id: selectedStudent || undefined,
        },
        withCredentials: true,
      })
      .then((res) => {
        setTests(res.data || []);
        setSelectedTest(""); // default to "All Tests"
      })
      .catch(() => {
        setTests([]);
        setSelectedTest("");
      });
  }, [selectedCourse, selectedStudent]);

  useEffect(() => {
    axios
      .get(GET_Courses)
      .then((res) => {
        setCourses(res.data);
        setSelectedCourse(res.data[0]?.id.toString());
      })
      .catch((err) => console.error("Courses fetch error:", err));

    axios
      .get(GET_Students, { withCredentials: true })
      .then((res) => {
        const studentList = res.data || [];
        const allOption = { id: "", name: "All Students" };
        const updatedList = [allOption, ...studentList];

        setStudents(updatedList);
        if (studentList.length > 0) {
          setSelectedStudent(studentList[0].id.toString());
        } else {
          setSelectedStudent("");
        }
      })
      .catch((err) => console.error("Students fetch error:", err));

    getStudentCountByCourse()
      .then(({ data }) => {
        const formatted = data.map((item) => ({
          name: item.course_name,
          value: item.student_count,
        }));
        setCourseChartData(formatted);
      })
      .catch((err) => console.error("Student count fetch error:", err));
  }, []);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        let params = {};
        if (selectedFilter === "custom") {
          if (customStartDate && customEndDate) {
            params = {
              start_date: customStartDate,
              end_date: customEndDate,
            };
          } else {
            return;
          }
        } else {
          params = {
            filter: selectedFilter,
          };
        }

        const [res, todayRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/notification/unread/`, {
            params,
            withCredentials: true,
          }),
          axios.get(`${BASE_URL}/api/notification/unread/`, {
            params: { filter: "today" },
            withCredentials: true,
          }).catch(() => ({ data: {} })),
        ]);

        setNotificationCounts(res.data);
        setTodayCounts(todayRes.data);
      } catch (err) {
        console.error("Unread notification fetch error:", err);
        setNotificationCounts({});
      }
    };

    fetchUnreadNotifications();
  }, [selectedFilter, customStartDate, customEndDate]);

 useEffect(() => {
  const fetchActivityFeed = async () => {
    setLoadingActivity(true);

    try {
      const { data } = await axios.get(
        `${BASE_URL}/api/doubt/activity-feed/`,
        {
          withCredentials: true,
        }
      );

      setActivityFeed({
        today: data.today || [],
        previous_day: data.previous_day || [],
      });
    } catch (err) {
      console.error("Activity Feed Error:", err);

      setActivityFeed({
        today: [],
        previous_day: [],
      });
    } finally {
      setLoadingActivity(false);
    }
  };

  fetchActivityFeed();
}, []);

  useEffect(() => {
    if (
      selectedCourse === null ||
      selectedStudent === null ||
      selectedCourse === undefined ||
      selectedStudent === undefined
    )
      return;

    setLoadingKeyStrengths(true);
    axios
      .get(`${BASE_URL}/api/test/key-strengths/`, {
        params: {
          ...finalDateParams,
          student_id: selectedStudent,
          course_id: selectedCourse,
          test_id: selectedTest,
        },
        withCredentials: true,
      })
      .then((res) => {
        setEnglishTopics(res.data?.topics?.English || []);
        setMathTopics(res.data?.topics?.Math || []);
      })
      .catch(() => {
        setEnglishTopics([]);
        setMathTopics([]);
      })
      .finally(() => setLoadingKeyStrengths(false));
  }, [selectedCourse, selectedStudent, selectedTest, finalDateParams]);

  useEffect(() => {
    if (
      selectedCourse === null ||
      selectedStudent === null ||
      selectedCourse === undefined ||
      selectedStudent === undefined
    )
      return;

    axios
      .get(`${BASE_URL}/api/test/course-wise-time/`, {
        params: {
          ...finalDateParams,
          student_id: selectedStudent,
          course_id: selectedCourse,
          test_id: selectedTest,
        },
        withCredentials: true,
      })
      .then((res) => {
        const formatted = res.data.map((item) => ({
          name: item.test_name || item.course,
          time_taken_minutes: item.time_taken_minutes || 0,
          score: item.score || 0,
        }));
        setTimeSpentData(formatted);
        setBarPercentData(
          formatted.map((item) => ({ name: item.name, value: item.score })),
        );
      })
      .catch((err) => {
        console.error("Course wise time fetch error:", err);
        setTimeSpentData([]);
        setBarPercentData([]);
      });
  }, [selectedCourse, selectedStudent, finalDateParams, selectedTest]);

  const handleFilterChange = (val) => {
    if (val === selectedFilter) return;
    setIsLoading(true);
    setSelectedFilter(val);
    setCustomStartDate("");
    setCustomEndDate("");
    setShowDatePicker(false);

    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  return (
    <div>
      {/* Global Filters */}
      <div className="bg-white rounded-xl p-3 shadow-md border border-gray-100 mb-6">
        <div className="flex items-center bg-gray-50 rounded-xl p-1 flex-wrap gap-3">
          {["last_month", "last_week", "today"].map((val) => (
            <button
              key={val}
              onClick={() => handleFilterChange(val)}
              className={`dashboard-tab-button ${
                selectedFilter === val
                  ? "dashboard-tab-active"
                  : "dashboard-tab-inactive"
              }`}
            >
              {val === "last_month"
                ? "This Month"
                : val === "last_week"
                  ? "This Week"
                  : "Today"}
            </button>
          ))}

          {/* Custom Date Button */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => {
                setShowDatePicker(!showDatePicker);
                setSelectedFilter("custom");
              }}
              className={`px-4 py-1 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 ${
                selectedFilter === "custom"
                  ? "bg-gradient-to-r from-[#F59403] to-[#FFD36A] text-white shadow-md"
                  : "text-[#805830] hover:bg-gray-100"
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Custom
            </button>

            {showDatePicker && (
              <div className="absolute z-50 mt-2 w-80 bg-gradient-to-br from-white to-[#FFF8F0] border border-gray-200 shadow-md rounded-md p-5 space-y-4 right-0 md:left-0">
                <h4 className="font-semibold text-[#2E2725]">
                  Select Date Range
                </h4>
                <ConfigProvider
                  theme={{
                    token: {
                      colorPrimary: "#F59403",
                      borderRadius: 8,
                    },
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#805830] font-medium block mb-1">
                        Start Date
                      </label>
                      <DatePicker
                        value={customStartDate ? dayjs(customStartDate) : null}
                        onChange={(date, dateString) =>
                          setCustomStartDate(dateString)
                        }
                        className="w-full border border-gray-200 rounded-md p-2.5 shadow-none hover:border-[#F59403] focus:border-[#F59403]"
                        format="YYYY-MM-DD"
                        placeholder="Select start date"
                        getPopupContainer={(trigger) => trigger.parentNode}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#805830] font-medium block mb-1">
                        End Date
                      </label>
                      <DatePicker
                        value={customEndDate ? dayjs(customEndDate) : null}
                        onChange={(date, dateString) =>
                          setCustomEndDate(dateString)
                        }
                        className="w-full border border-gray-200 rounded-md p-2.5 shadow-none hover:border-[#F59403] focus:border-[#F59403]"
                        format="YYYY-MM-DD"
                        placeholder="Select end date"
                        getPopupContainer={(trigger) => trigger.parentNode}
                      />
                    </div>
                  </div>
                </ConfigProvider>
                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => {
                      setCustomStartDate("");
                      setCustomEndDate("");
                      setSelectedFilter("last_month");
                      setShowDatePicker(false);
                    }}
                    className="text-sm text-gray-500 hover:text-[#805830] transition-colors bg-transparent"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="px-4 py-1.5 bg-[#2E2725] text-white text-sm rounded-lg hover:bg-[#805830] transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-6">
            {SECTIONS.map(
              ({ display, key, route, gradient, trendType }) => (
                <StatCard
                  key={display}
                  title={display}
                  apiKey={key}
                  routeName={route}
                  value={notificationCounts[key]?.unread_count ?? 0}
                  selectedFilter={selectedFilter}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                  gradientClass={gradient}
                  trendType={trendType}
                />
              )
            )}
          </div>
          {/* Question Count Table */}
          <div className="bg-white shadow-md rounded-xl mb-6">
            <div className="p-5 border-b border-white bg-gradient-to-r from-[#2E2725] to-[#805830] rounded-t-xl">
              <h3 className="text-md lg:text-xl font-bold text-white flex items-center gap-2">
                <ClipboardIcon className="w-5 h-5" />
                Question Count by Course & Subject
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gray-50 border-b-2 border-gray-400">
                  <tr>
                    <th className="px-4 py-1 text-left font-semibold text-[#2E2725] border-r border-gray-300">
                      Course
                    </th>
                    <th className="px-4 py-1 text-left font-semibold text-[#2E2725] border-r border-gray-300">
                      Subject
                    </th>
                    <th className="px-4 py-1 text-left font-semibold text-[#2E2725] border-r border-gray-300">
                      Total
                    </th>
                    <th className="px-4 py-1 text-left font-semibold text-[#2E2725] border-r border-gray-300">
                      Active
                    </th>
                    <th className="px-4 py-1 text-left font-semibold text-[#2E2725] border-r border-gray-300">
                      Inactive
                    </th>
                    <th className="px-4 py-1 text-left font-semibold text-[#2E2725] border-r border-gray-300">
                      Practice
                    </th>
                    <th className="px-4 py-1 text-left font-semibold text-[#2E2725] border-r border-gray-300">
                      Full Length
                    </th>
                    <th className="px-4 py-1 text-left font-semibold text-[#2E2725]">
                      Health Check (Active vs Inactive Ratio)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {questionCounts.length > 0 ? (
                    questionCounts.map((item, i) => {
                      const total = item.total_questions || 1;
                      const activePercent = ((item.active_questions || 0) / total) * 100;
                      const inactivePercent = ((item.inactive_questions || 0) / total) * 100;
                      
                      return (
                        <tr
                          key={i}
                          className="border-b border-gray-400 hover:bg-[#FFD36A]/10 transition-colors"
                        >
                          <td className="px-4 py-1 font-medium text-[#2E2725] border-r border-gray-300">
                            {item.course}
                          </td>
                          <td className="px-4 py-1 text-[#805830] border-r border-gray-300">
                            {item.subject}
                          </td>
                          <td className="px-4 py-1 border-r border-gray-300">
                            <span className="px-2.5 py-1 bg-[#0071BC]/10 text-[#0071BC] rounded-full font-semibold text-xs">
                              {item.total_questions}
                            </span>
                          </td>
                          <td className="px-4 py-1 border-r border-gray-300">
                            <span className="px-2.5 py-1 bg-green-100 text-green-600 rounded-full font-semibold text-xs">
                              {item.active_questions}
                            </span>
                          </td>
                          <td className="px-4 py-1 border-r border-gray-300">
                            <span className="px-2.5 py-1 bg-red-100 text-red-600 rounded-full font-semibold text-xs">
                              {item.inactive_questions}
                            </span>
                          </td>
                          <td className="px-4 py-1 text-[#805830] border-r border-gray-300">
                            {item.total_self_practice_questions}
                          </td>
                          <td className="px-4 py-1 text-[#805830] border-r border-gray-300">
                            {item.total_full_length_questions}
                          </td>
                          <td className="px-4 py-1">
                            <div className="flex flex-col gap-1 w-full min-w-[180px] max-w-[240px]">
                              <div className="flex justify-between text-[11px] font-semibold">
                                <span className="text-emerald-600">{activePercent.toFixed(1)}% active</span>
                                <span className="text-rose-500">{inactivePercent.toFixed(1)}% inactive</span>
                              </div>
                              <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden flex items-center">
                                <div style={{ width: `${activePercent}%` }} className="bg-emerald-500 h-full transition-all duration-500" />
                                <div style={{ width: `${inactivePercent}%` }} className="bg-rose-400 h-full transition-all duration-500" />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className="text-center py-8 text-gray-400"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardIcon className="w-10 h-10 text-gray-300" />
                          No question data available
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-5 py-3 bg-gray-50 text-sm text-[#805830]">
                Showing {questionCounts.length} records
              </div>
            </div>
          </div>
          <div >
            {/* Student Count Chart */}
            <div className="lg:col-span-2 bg-white shadow-md rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#2E2725]">
                  Student Count by Course
                </h3>
              </div>
              <div className="overflow-x-auto overflow-y-hidden">
                <div
                  style={{
                    minWidth:
                      courseChartData.length > 3
                        ? `${courseChartData.length * 100}px`
                        : "100%",
                  }}
                  className="md:min-w-full"
                >
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={courseChartData}
                      barSize={40}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        tick={{
                          fill: "#000000",
                          fontSize: 13,
                          dy: 2,
                          fontWeight: "bold",
                        }}
                        height={60}
                      />
                      <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
                      <Tooltip cursor={{ fill: "transparent" }} />
                      <Bar dataKey="value" fill="#F59403" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-md border border-gray-100/80 rounded-xl p-5 flex flex-col h-full min-h-[500px] mt-6 transition-all duration-300">
              {/* Header Bar with Today / Prev Day Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-gray-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                    <ActivityFeedCalendarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base lg:text-lg font-bold text-[#2E2725]">
                      Activity Feed
                    </h3>
                  </div>
                </div>

                {/* Today vs Prev Day Tabs */}
                <div className="flex items-center bg-gray-100/90 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setActivityDayTab("today")}
                    className={`px-4 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                      activityDayTab === "today"
                        ? "bg-[#F59403] text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setActivityDayTab("prev_day")}
                    className={`px-4 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                      activityDayTab === "prev_day"
                        ? "bg-[#F59403] text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Prev Day
                  </button>
                </div>
              </div>

              {/* Content Body */}
              {loadingActivity ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12">
                  <div className="w-9 h-9 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-gray-400 mt-3 font-medium">Fetching recent activities...</span>
                </div>
              ) : displayActivities.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <NoDataClockIcon className="w-10 h-10 text-gray-300 mb-2" />
                  <span className="text-sm font-semibold text-gray-600">No activity found</span>
                  <span className="text-xs text-gray-400 mt-1">There are no activities for this day yet.</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto max-h-[580px] pr-2 relative dashboard-activity-scroll">
                  <div className="space-y-3 relative">
                    {displayActivities.map((activity, index) => {
                      const isDoubtPending = activity.type === "doubt";
                      const isLast = index === displayActivities.length - 1;

                      const config = activityConfig[activity.type] || {
    label: activity.title,
    badge: "bg-gray-50 text-gray-700 border border-gray-200",
};

                      return (
                        <div key={activity.id} className="relative flex gap-3.5 group items-center">
                          {/* Timeline Node */}
                          <div className="flex flex-col items-center flex-shrink-0 relative">
                            <div className="z-10">{getActivityIcon(activity.type, isDoubtPending)}</div>
                            {!isLast && (
                              <div className="w-0.5 bg-gradient-to-b from-gray-200 via-gray-200 to-gray-100 flex-1 my-1 hidden sm:block"></div>
                            )}
                          </div>

                          {/* Activity Card - Single Responsive Line */}
                          <div className="flex-1">
                            {isDoubtPending ? (
                              <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white border border-amber-200/70 rounded-md px-4 py-2.5 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/90 text-amber-900 border border-amber-300/60 whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    {activity.title}
                                  </span>
                                  <span className="text-xs font-medium text-gray-800">
                                    {activity.description}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F59403] text-white shadow-xs whitespace-nowrap">
                                    ⚡ {activity.meta}
                                  </span>
                                </div>
                                <span className="text-[11px] text-amber-700 font-medium whitespace-nowrap bg-white/80 border border-amber-200 px-2 py-0.5 rounded-full shadow-2xs self-end sm:self-center">
                                 {formatActivityTime(activity.time)}
                                </span>
                              </div>
                            ) : (
                              <div className="bg-white hover:bg-slate-50/80 border border hover:border-orange-200/80 rounded-md px-4 py-2.5 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                                 <span
  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap ${config.badge}`}
>
  {config.label}
</span>

                                  <span className="font-bold text-gray-900">
                                    {activity.description || activity.title}
                                  </span>

                                 <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${
        statusColor[activity.status] || "bg-gray-50 text-gray-700 border-gray-200"
    }`}
>
    {activity.meta}
</span>
                                </div>

                                <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap flex items-center gap-1 self-end sm:self-center">
                                  <ClockMiniIcon className="w-3.5 h-3.5 text-gray-400" />
                                  {activity.time?.includes("Jul") ? activity.time : formatActivityTime(activity.time)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </>
      )}
    </div>
  );
}
