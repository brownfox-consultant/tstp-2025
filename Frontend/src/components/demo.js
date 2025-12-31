"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { GET_Courses, GET_Students, BASE_URL } from "@/app/constants/apiConstants";
import { getStudentCountByCourse } from "@/app/services/authService";
import { useParams, useRouter } from "next/navigation";
import {
  ConcernIcon,
  DoubtIcon,
  MeetingIcon,
  IssueIcon,
  SuggestionIcon
} from "./icons/dashboard-icons";

// Icon mapping for different stat types
const STAT_ICONS = {
  CONCERN: <ConcernIcon />,
  DOUBT: <DoubtIcon />,
  MEETING: <MeetingIcon />,
  ISSUE: <IssueIcon />,
  SUGGESTION: <SuggestionIcon />,
};

function StatCard({ title, value, selectedFilter, customStartDate, customEndDate, apiKey, routeName }) {
  const router = useRouter();
  const { id } = useParams();

  const handleViewAll = () => {
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

  return (
    <div className="group bg-white rounded-2xl border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-[#0071BC] transition-all duration-300 p-5">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0071BC] to-[#0071BC] flex items-center justify-center shadow-md text-white">
          {STAT_ICONS[apiKey] || STAT_ICONS.CONCERN}
        </div>
        <button
          onClick={handleViewAll}
          className="text-xs font-semibold text-[#0071BC] hover:text-[#805830] transition-colors flex items-center gap-1 opacity-70 group-hover:opacity-100 bg-transparent"
        >
          View all
          <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Value */}
      <div className="text-4xl font-bold text-[#2E2725] mb-1 tracking-tight">{value}</div>

      {/* Title */}
      <span className="text-sm font-medium text-[#805830]/80">{title}</span>
    </div>
  );
}


export default function Dashboard() {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("last_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const datePickerRef = React.useRef(null);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [notificationCounts, setNotificationCounts] = useState({});
  const [courseChartData, setCourseChartData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [barPercentData, setBarPercentData] = useState([]);
  const [timeSpentData, setTimeSpentData] = useState([]);
  const [englishTopics, setEnglishTopics] = useState([]);
  const [mathTopics, setMathTopics] = useState([]);
  const [loadingKeyStrengths, setLoadingKeyStrengths] = useState(false);
  const [questionCounts, setQuestionCounts] = useState([]);
  const SECTIONS = [
    { display: "Concerns", key: "CONCERN", route: "concerns" },
    { display: "Doubts", key: "DOUBT", route: "doubts" },
    { display: "Meetings", key: "MEETING", route: "meetings" },
    { display: "Issues", key: "ISSUE", route: "issues" },
    { display: "Suggestions", key: "SUGGESTION", route: "suggestions" },
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
    axios.get(`${BASE_URL}/api/question/question-count/`, { withCredentials: true })
      .then(res => setQuestionCounts(res.data))
      .catch(() => setQuestionCounts([]));
  }, []);

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
    axios.get(GET_Courses).then((res) => {
      setCourses(res.data);
      setSelectedCourse(res.data[0]?.id.toString());
    });

    axios.get(GET_Students, { withCredentials: true }).then((res) => {
      const studentList = res.data || [];
      const allOption = { id: "", name: "All Students" };
      const updatedList = [allOption, ...studentList];

      setStudents(updatedList);
      // Set the first student as default if available
      if (studentList.length > 0) {
        setSelectedStudent(studentList[0].id.toString());
      } else {
        setSelectedStudent(""); // fallback to "All Students" (empty string ID)
      }
    });

    getStudentCountByCourse().then(({ data }) => {
      const formatted = data.map((item) => ({
        name: item.course_name,
        value: item.student_count,
      }));
      setCourseChartData(formatted);
    });
  }, []);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        let params = {};
        let res;

        if (selectedFilter === "custom") {
          if (customStartDate && customEndDate) {
            params = {
              start_date: customStartDate,
              end_date: customEndDate,
            };
          } else {
            return; // 🔁 Don't run if both dates aren't selected
          }
        } else {
          params = {
            filter: selectedFilter,
          };
        }

        res = await axios.get(`${BASE_URL}/api/notification/unread/`, {
          params,
          withCredentials: true,
        });

        setNotificationCounts(res.data);
      } catch (err) {
        console.error("Unread notification fetch error:", err);
        setNotificationCounts({});
      }
    };

    fetchUnreadNotifications();
  }, [selectedFilter, customStartDate, customEndDate]);

  useEffect(() => {
    if (selectedCourse === null || selectedStudent === null || selectedCourse === undefined || selectedStudent === undefined) return;


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
    if (selectedCourse === null || selectedStudent === null || selectedCourse === undefined || selectedStudent === undefined) return;

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
        setBarPercentData(formatted.map(item => ({ name: item.name, value: item.score })));
      });
  }, [selectedCourse, selectedStudent, finalDateParams, selectedTest]);

  return (
    <div className="grid gap-6">
      {/* Global Filters */}
      <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter Pills */}
          <div className="flex items-center bg-gray-50 rounded-xl p-1 gap-1">
            {["last_month", "last_week", "today"].map((val) => (
              <button
                key={val}
                onClick={() => {
                  setSelectedFilter(val);
                  setCustomStartDate("");
                  setCustomEndDate("");
                  setShowDatePicker(false);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${selectedFilter === val
                    ? "bg-gradient-to-r from-[#F59403] to-[#FFD36A] text-white shadow-md"
                    : "text-[#805830] hover:bg-gray-100"
                  }`}
              >
                {val === "last_month" ? "This Month" : val === "last_week" ? "This Week" : "Today"}
              </button>
            ))}

            {/* Custom Date Button */}
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => {
                  setShowDatePicker(!showDatePicker);
                  setSelectedFilter("custom");
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 ${selectedFilter === "custom"
                    ? "bg-gradient-to-r from-[#F59403] to-[#FFD36A] text-white shadow-md"
                    : "text-[#805830] hover:bg-gray-100"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Custom
              </button>

              {showDatePicker && (
                <div className="absolute z-50 mt-2 w-80 bg-white border border-[#FFD36A]/30 shadow-2xl rounded-2xl p-5 space-y-4 right-0 md:left-0">
                  <h4 className="font-semibold text-[#2E2725]">Select Date Range</h4>
                  <div>
                    <label className="text-sm text-[#805830] font-medium">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      className="w-full border border-gray-200 rounded-xl p-2.5 mt-1 focus:ring-2 focus:ring-[#F59403] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#805830] font-medium">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      className="w-full border border-gray-200 rounded-xl p-2.5 mt-1 focus:ring-2 focus:ring-[#F59403] focus:border-transparent transition-all"
                    />
                  </div>
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

          {/* Divider */}
          <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

          {/* Course & Student Selectors */}
          <Select
            className="w-56 text-sm"
            value={courses.find((c) => c.id.toString() === selectedCourse)}
            onChange={(opt) => setSelectedCourse(opt?.id.toString())}
            options={courses}
            getOptionLabel={(e) => e.name}
            getOptionValue={(e) => e.id.toString()}
            placeholder="Select Course"
          />
          <Select
            className="w-56 text-sm"
            value={students.find((s) => s.id.toString() === selectedStudent)}
            onChange={(opt) => setSelectedStudent(opt?.id.toString())}
            options={students}
            getOptionLabel={(e) => e.name}
            getOptionValue={(e) => e.id.toString()}
            placeholder="Select Student"
          />
          <Select
            className="w-64 text-sm"
            value={tests.find((t) => t.id.toString() === selectedTest)}
            onChange={(opt) => setSelectedTest(opt?.id.toString())}
            options={[{ id: "", name: "All Tests" }, ...tests]}
            getOptionLabel={(e) => e.name}
            getOptionValue={(e) => e.id.toString()}
            placeholder="Select Test"
          />
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {SECTIONS.map(({ display, key, route }) => (
          <StatCard
            key={display}
            title={display}
            apiKey={key}
            routeName={route}
            value={notificationCounts[key]?.unread_count ?? 0}
            selectedFilter={selectedFilter}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
          />
        ))}
      </div>

      {/* Question Count Table */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[#2E2725] to-[#805830]">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Question Count by Course & Subject
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-[#2E2725]">Course</th>
                <th className="px-5 py-4 text-left font-semibold text-[#2E2725]">Subject</th>
                <th className="px-5 py-4 text-left font-semibold text-[#2E2725]">Total</th>
                <th className="px-5 py-4 text-left font-semibold text-[#2E2725]">Active</th>
                <th className="px-5 py-4 text-left font-semibold text-[#2E2725]">Inactive</th>
                <th className="px-5 py-4 text-left font-semibold text-[#2E2725]">Practice</th>
                <th className="px-5 py-4 text-left font-semibold text-[#2E2725]">Full Length</th>
              </tr>
            </thead>
            <tbody>
              {questionCounts.length > 0 ? (
                questionCounts.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-[#FFD36A]/10 transition-colors">
                    <td className="px-5 py-4 font-medium text-[#2E2725]">{item.course}</td>
                    <td className="px-5 py-4 text-[#805830]">{item.subject}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-[#0071BC]/10 text-[#0071BC] rounded-full font-semibold text-xs">
                        {item.total_questions}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-green-100 text-green-600 rounded-full font-semibold text-xs">
                        {item.active_questions}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-red-100 text-red-600 rounded-full font-semibold text-xs">
                        {item.inactive_questions}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#805830]">{item.total_self_practice_questions}</td>
                    <td className="px-5 py-4 text-[#805830]">{item.total_full_length_questions}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      No question data available
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-sm text-[#805830]">
            Showing {questionCounts.length} records
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Count Chart */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#2E2725]">Student Count by Course</h3>
            <div className="w-8 h-8 rounded-lg bg-[#FFD36A]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#F59403]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={courseChartData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fill: '#805830', fontSize: 12 }} />
              <YAxis tick={{ fill: '#805830', fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'rgba(245, 148, 3, 0.1)' }} />
              <Bar dataKey="value" fill="#F59403" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Test Scores Chart */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#2E2725]">Test Scores</h3>
            <div className="w-8 h-8 rounded-lg bg-[#70D9E4]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#0071BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barPercentData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fill: '#805830', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#805830', fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'rgba(112, 217, 228, 0.1)' }} />
              <Bar dataKey="value" fill="#70D9E4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time Spent Chart */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#2E2725]">Time Spent vs Score</h3>
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#F59403]"></div>
              <span className="text-sm text-[#805830]">Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#0071BC]"></div>
              <span className="text-sm text-[#805830]">Minutes</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeSpentData} barSize={30}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fill: '#805830', fontSize: 12 }} />
            <YAxis tick={{ fill: '#805830', fontSize: 12 }} />
            <Tooltip cursor={{ fill: 'rgba(245, 148, 3, 0.1)' }} />
            <Legend />
            <Bar dataKey="score" fill="#F59403" name="Score" radius={[4, 4, 0, 0]} />
            <Bar dataKey="time_taken_minutes" fill="#0071BC" name="Minutes" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Key Strengths Section */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F59403] to-[#FFD36A] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#2E2725]">Key Strengths by Subject</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[{ label: "English", data: englishTopics, color: "#0071BC" }, { label: "Math", data: mathTopics, color: "#F59403" }].map(
            ({ label, data, color }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-md font-semibold text-[#2E2725] mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                  {label}
                </h4>
                {loadingKeyStrengths ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-[#F59403] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : data.length > 0 ? (
                  data.map((item, i) => (
                    <div key={i} className="mb-3">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-[#805830] font-medium">{item.topic}</span>
                        <span className="font-semibold text-[#2E2725]">{item.score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${item.score}%`, backgroundColor: color }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm py-4 text-center">No data available</p>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
