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

function StatCard({ title, value, selectedFilter, customStartDate, customEndDate, apiKey, routeName }) {
  const router = useRouter();
  const { id } = useParams();

  const handleViewAll = () => {
    const params = new URLSearchParams();
    params.append("category", apiKey); // ✅ singular API key
    if (selectedFilter === "custom" && customStartDate && customEndDate) {
      params.append("start_date", customStartDate);
      params.append("end_date", customEndDate);
    } else {
      params.append("filter", selectedFilter);
    }
    router.push(`/admin/${id}/${routeName}?${params.toString()}`); // ✅ plural route
  };

  return (
    <div className="rounded-xl border p-4 shadow-md bg-white">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <button onClick={handleViewAll} className="text-xs text-orange-500 font-medium">
          View all
        </button>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
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
  const allOption = { id: "", name: "All Students" }; // 👈 this is important
  const updatedList = [allOption, ...studentList];

  setStudents(updatedList);
  setSelectedStudent(""); // default to "All Students"
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
  }, [selectedCourse, selectedStudent,selectedTest, finalDateParams]);

  useEffect(() => {
    if (selectedCourse === null || selectedStudent === null || selectedCourse === undefined || selectedStudent === undefined) return;

    axios
      .get(`${BASE_URL}/api/test/course-wise-time/`, {
        params: {
          ...finalDateParams,
          student_id: selectedStudent,
          course_id: selectedCourse,
          test_id : selectedTest,
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
  }, [selectedCourse, selectedStudent, finalDateParams,selectedTest]);

  return (
    <div className="p-4 grid gap-6">
      {/* Global Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {["last_month", "last_week", "today"].map((val) => (
          <button
            key={val}
            onClick={() => {
              setSelectedFilter(val);
              setCustomStartDate("");
              setCustomEndDate("");
              setShowDatePicker(false);
            }}
            className={`px-4 py-1 text-sm rounded-md ${
              selectedFilter === val ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {val.replace("_", " ")}
          </button>
        ))}

        <div className="relative">
          <button
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              setSelectedFilter("custom");
            }}
            className={`px-4 py-1 text-sm rounded-md ${
              selectedFilter === "custom" ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            📅 Custom Date
          </button>

          {showDatePicker && (
            <div className="absolute z-10 mt-2 w-72 bg-white border border-gray-200 shadow-xl rounded-md p-4 space-y-3">
              <div>
                <label className="text-sm">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full border rounded-md p-1"
                />
              </div>
              <div>
                <label className="text-sm">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full border rounded-md p-1"
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
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        
        
        {/* Course & Student Selectors */}
        <Select
          className="w-64 text-sm"
          value={courses.find((c) => c.id.toString() === selectedCourse)}
          onChange={(opt) => setSelectedCourse(opt?.id.toString())}
          options={courses}
          getOptionLabel={(e) => e.name}
          getOptionValue={(e) => e.id.toString()}
          placeholder="Select Course"
        />
       <Select
  className="w-64 text-sm"
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

      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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

      <div className="bg-white p-4 rounded-xl shadow-md">
  <h3 className="text-xl font-semibold mb-4">Question Count by Course & Subject</h3>
  <div className="overflow-x-auto">
     <div className="bg-white p-4 rounded-xl shadow-md">
  
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm border">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left">Course</th>
          <th className="px-4 py-2 text-left">Subject</th>
          <th className="px-4 py-2 text-left">Total Questions</th>
          <th className="px-4 py-2 text-left">Active</th>
          <th className="px-4 py-2 text-left">Inactive</th>
          <th className="px-4 py-2 text-left">Self Practice</th>
          <th className="px-4 py-2 text-left">Full Length</th>
        </tr>
      </thead>
      <tbody>
        {questionCounts.length > 0 ? (
          questionCounts.map((item, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">{item.course}</td>
              <td className="px-4 py-3">{item.subject}</td>
              <td className="px-4 py-3">{item.total_questions}</td>
              <td className="px-4 py-3 text-green-600">{item.active_questions}</td>
              <td className="px-4 py-3 text-red-600">{item.inactive_questions}</td>
              <td className="px-4 py-3">{item.total_self_practice_questions}</td>
              <td className="px-4 py-3">{item.total_full_length_questions}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="text-center py-4 text-gray-500">
              No question data available
            </td>
          </tr>
        )}
      </tbody>
    </table>

    {/* Pagination Placeholder */}
    <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
      <span>
        Showing {questionCounts.length} records
      </span>
    </div>
  </div>
</div>

  </div>
</div>


      {/* Graphs */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold mb-4">Student Count by Course</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={courseChartData} barSize={40}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
            cursor={{ fill: 'transparent' }}
            />
            <Bar dataKey="value" fill="#facc15" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold mb-4">Test Scores</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barPercentData} barSize={40}>
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip
            cursor={{ fill: 'transparent' }}
            />
            <Bar dataKey="value" fill="#86efac" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold mb-4">Time Spent vs Score</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeSpentData} barSize={30}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
            cursor={{ fill: 'transparent' }}
            />
            <Legend />
            <Bar dataKey="score" fill="#f97316" name="Score" />
            <Bar dataKey="time_taken_minutes" fill="#3b82f6" name="Minutes" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md">
        {/* <h3 className="text-xl font-semibold mb-4">Key Strengths</h3> */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[{ label: "English", data: englishTopics }, { label: "Math", data: mathTopics }].map(
            ({ label, data }) => (
              <div key={label}>
                <h4 className="text-lg font-medium mb-2">{label}</h4>
                {loadingKeyStrengths ? (
                  <p>Loading...</p>
                ) : data.length > 0 ? (
                  data.map((item, i) => (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.topic}</span>
                        <span>{item.score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded">
                        <div
                          className="h-2 bg-green-500 rounded"
                          style={{ width: `${item.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No data</p>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
