"use client";

import "@/app/Dashboard.css";
import React, { useState, useEffect, useMemo } from "react";
import { DatePicker, ConfigProvider, Progress } from "antd";
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
import { GET_Courses, GET_Students, BASE_URL } from "@/app/constants/apiConstants";
import { getStudentCountByCourse } from "@/app/services/authService";
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
  ChevronIcon
} from "./icons/dashboard-icons";
import { NoDataIcon } from "@/components/icons/improvement-strength-icons";
import { components } from "react-select";
import { Row, Col } from "antd";
// Custom Dropdown Indicator with rotating arrow
const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronIcon className="w-4 h-4" isOpen={props.selectProps.menuIsOpen} color="#805830" />
    </components.DropdownIndicator>
  );
};

function StatCard({ title, value, selectedFilter, customStartDate, customEndDate, apiKey, routeName, gradientClass }) {
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
    <div
      onClick={handleViewAll}
      className="relative bg-white rounded-lg p-3 sm:p-4 md:p-5 lg:p-6 border-2 border-gray-50 shadow-md hover:shadow-lg overflow-hidden group cursor-pointer transition-all"
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r ${gradientClass}`} />
      <div className="flex justify-between items-start mb-2 sm:mb-3 md:mb-4 gap-2">
        <p className="text-xs sm:text-sm font-medium text-gray-500 leading-tight">{title}</p>
        <button
          className="text-xs sm:text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors hover:underline bg-transparent whitespace-nowrap flex-shrink-0"
        >
          View all →
        </button>
      </div>
      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{value}</div>
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
  const [isLoading, setIsLoading] = useState(false);

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
    { display: "Concerns", key: "CONCERN", route: "concerns", gradient: "from-orange-500 to-amber-400" },
    { display: "Doubts", key: "DOUBT", route: "doubts", gradient: "from-blue-500 to-cyan-400" },
    { display: "Meetings", key: "MEETING", route: "meetings", gradient: "from-emerald-500 to-teal-400" },
    { display: "Issues", key: "ISSUE", route: "issues", gradient: "from-rose-500 to-pink-400" },
    { display: "Suggestions", key: "SUGGESTION", route: "suggestions", gradient: "from-indigo-500 to-purple-400" },
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
            return;
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
              className={`dashboard-tab-button ${selectedFilter === val
                ? "dashboard-tab-active"
                : "dashboard-tab-inactive"
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
              <CalendarIcon className="w-4 h-4" />
              Custom
            </button>

            {showDatePicker && (
              <div className="absolute z-50 mt-2 w-80 bg-gradient-to-br from-white to-[#FFF8F0] border border-gray-200 shadow-md rounded-md p-5 space-y-4 right-0 md:left-0">
                <h4 className="font-semibold text-[#2E2725]">Select Date Range</h4>
                <ConfigProvider
                  theme={{
                    token: {
                      colorPrimary: '#F59403',
                      borderRadius: 8,
                    },
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#805830] font-medium block mb-1">Start Date</label>
                      <DatePicker
                        value={customStartDate ? dayjs(customStartDate) : null}
                        onChange={(date, dateString) => setCustomStartDate(dateString)}
                        className="w-full border border-gray-200 rounded-md p-2.5 shadow-none hover:border-[#F59403] focus:border-[#F59403]"
                        format="YYYY-MM-DD"
                        placeholder="Select start date"
                        getPopupContainer={trigger => trigger.parentNode}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#805830] font-medium block mb-1">End Date</label>
                      <DatePicker
                        value={customEndDate ? dayjs(customEndDate) : null}
                        onChange={(date, dateString) => setCustomEndDate(dateString)}
                        className="w-full border border-gray-200 rounded-md p-2.5 shadow-none hover:border-[#F59403] focus:border-[#F59403]"
                        format="YYYY-MM-DD"
                        placeholder="Select end date"
                        getPopupContainer={trigger => trigger.parentNode}
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
            {SECTIONS.map(({ display, key, route, gradient }) => (
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
              />
            ))}
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
                    <th className="px-5 py-4 text-left font-semibold text-[#2E2725] border-r border-gray-300">Course</th>
                    <th className="px-5 py-4 text-left font-semibold text-[#2E2725] border-r border-gray-300">Subject</th>
                    <th className="px-5 py-4 text-left font-semibold text-[#2E2725] border-r border-gray-300">Total</th>
                    <th className="px-5 py-4 text-left font-semibold text-[#2E2725] border-r border-gray-300">Active</th>
                    <th className="px-5 py-4 text-left font-semibold text-[#2E2725] border-r border-gray-300">Inactive</th>
                    <th className="px-5 py-4 text-left font-semibold text-[#2E2725] border-r border-gray-300">Practice</th>
                    <th className="px-5 py-4 text-left font-semibold text-[#2E2725]">Full Length</th>
                  </tr>
                </thead>
                <tbody>
                  {questionCounts.length > 0 ? (
                    questionCounts.map((item, i) => (
                      <tr key={i} className="border-b border-gray-400 hover:bg-[#FFD36A]/10 transition-colors">
                        <td className="px-5 py-4 font-medium text-[#2E2725] border-r border-gray-300">{item.course}</td>
                        <td className="px-5 py-4 text-[#805830] border-r border-gray-300">{item.subject}</td>
                        <td className="px-5 py-4 border-r border-gray-300">
                          <span className="px-2.5 py-1 bg-[#0071BC]/10 text-[#0071BC] rounded-full font-semibold text-xs">
                            {item.total_questions}
                          </span>
                        </td>
                        <td className="px-5 py-4 border-r border-gray-300">
                          <span className="px-2.5 py-1 bg-green-100 text-green-600 rounded-full font-semibold text-xs">
                            {item.active_questions}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 bg-red-100 text-red-600 rounded-full font-semibold text-xs">
                            {item.inactive_questions}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#805830] border-r border-gray-300">{item.total_self_practice_questions}</td>
                        <td className="px-5 py-4 text-[#805830]">{item.total_full_length_questions}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardIcon className="w-10 h-10 text-gray-300" />
                          No question data available
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-5 py-3 bg-gray-50 text-sm text-[#805830">
                Showing {questionCounts.length} records
              </div>
            </div>
          </div>

          {/* Student Count Chart */}
          <div className="bg-white shadow-md rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#2E2725]">Student Count by Course</h3>
            </div>
            <div className="overflow-x-auto overflow-y-hidden">
              <div style={{ minWidth: courseChartData.length > 3 ? `${courseChartData.length * 100}px` : '100%' }} className="md:min-w-full">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={courseChartData} barSize={40} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" tick={{ fill: '#000000', fontSize: 13, dy: 2, fontWeight: 'bold' }} height={60} />
                    <YAxis tick={{ fill: '#000000', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" fill="#F59403" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Time Spent Chart */}
          <div className="bg-white shadow-md rounded-xl p-5 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-4 justify-between w-full flex-wrap">
                <h3 className="text-lg font-bold text-[#2E2725]">Time Spent vs Score</h3>
                <div className="flex gap-2 flex-wrap">
                  <Select
                    className="w-40 text-sm"
                    value={courses.find((c) => c.id.toString() === selectedCourse)}
                    onChange={(opt) => setSelectedCourse(opt?.id.toString())}
                    options={courses}
                    getOptionLabel={(e) => e.name}
                    getOptionValue={(e) => e.id.toString()}
                    placeholder="Select Course"
                    components={{ DropdownIndicator }}
                  />
                  <Select
                    className="w-40 text-sm"
                    value={students.find((s) => s.id.toString() === selectedStudent)}
                    onChange={(opt) => setSelectedStudent(opt?.id.toString())}
                    options={students}
                    getOptionLabel={(e) => e.name}
                    getOptionValue={(e) => e.id.toString()}
                    placeholder="Select Student"
                    components={{ DropdownIndicator }}
                  />
                  <Select
                    className="w-40 text-sm"
                    value={tests.find((t) => t.id.toString() === selectedTest)}
                    onChange={(opt) => setSelectedTest(opt?.id.toString())}
                    options={[{ id: "", name: "All Tests" }, ...tests]}
                    getOptionLabel={(e) => e.name}
                    getOptionValue={(e) => e.id.toString()}
                    placeholder="Select Test"
                    components={{ DropdownIndicator }}
                  />
                </div>
              </div>
              {timeSpentData.length > 0 && (
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
              )}
            </div>
            {timeSpentData.length > 0 ? (
              <div className="overflow-x-auto overflow-y-hidden">
                <div style={{ minWidth: timeSpentData.length > 3 ? `${timeSpentData.length * 120}px` : '100%' }} className="md:min-w-full">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={timeSpentData} barSize={30} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fill: '#805830', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#805830', fontSize: 12 }} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Legend />
                      <Bar dataKey="score" fill="#F59403" name="Score" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="time_taken_minutes" fill="#0071BC" name="Minutes" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                <NoDataClockIcon className="w-12 h-12 mb-3 text-gray-300" />
                <span className="text-sm font-medium">No data available</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100 ">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-[#2E2725]">Topic-wise Performance</h3>
            </div>

            <Row gutter={[24, 24]} className="flex">
              <Col xs={24} md={12}>
                <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border border-blue-100 rounded-md p-3 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-blue-600">English</h4>
                  </div>

                  {loadingKeyStrengths ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : englishTopics.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 flex-1 flex flex-col items-center justify-center">
                      <NoDataIcon />
                      <p className="text-sm">No data available</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {englishTopics.map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600">{item.topic}</span>
                            <span className={`text-sm font-semibold ${item.score >= 50 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {item.score}%
                            </span>
                          </div>
                          <Progress
                            percent={item.score}
                            strokeColor="#0071BC"
                            trailColor="#e5e7eb"
                            showInfo={false}
                            strokeWidth={8}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Col>

              {/* Math Section */}
              <Col xs={24} md={12}>
                <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 border border-orange-100 rounded-md p-3 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-orange-500">Math</h4>
                  </div>

                  {loadingKeyStrengths ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : mathTopics.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 flex-1 flex flex-col items-center justify-center">
                      <NoDataIcon />
                      <p className="text-sm">No data available</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {mathTopics.map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600">{item.topic}</span>
                            <span className="text-sm font-semibold text-[#805830]">
                              {item.score}%
                            </span>
                          </div>
                          <Progress
                            percent={item.score}
                            strokeColor="#F59403"
                            trailColor="#e5e7eb"
                            showInfo={false}
                            strokeWidth={8}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        </>
      )}
    </div>
  );
}
