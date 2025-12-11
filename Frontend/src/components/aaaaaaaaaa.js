"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Select from "react-select";
import { GET_Courses, GET_Students, BASE_URL } from "@/app/constants/apiConstants";
import { getUnreadNotificationCount, getStudentCountByCourse } from "@/app/services/authService";

function StatCard({ title, value, selectedFilter, customStartDate, customEndDate }) {
  const router = useRouter();
  const { id } = useParams();

  const handleViewAll = () => {
    const params = new URLSearchParams();
    params.append("category", title.toUpperCase());
    if (selectedFilter === "custom" && customStartDate && customEndDate) {
      params.append("start_date", customStartDate);
      params.append("end_date", customEndDate);
    } else {
      params.append("filter", selectedFilter);
    }
    router.push(`/admin/${id}/${title.toLowerCase()}s?${params.toString()}`);
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

  const [notificationCounts, setNotificationCounts] = useState({});
  const [courseChartData, setCourseChartData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourseForTime, setSelectedCourseForTime] = useState(null);
  const [scoreStudent, setScoreStudent] = useState(null);
  const [timeStudent, setTimeStudent] = useState(null);
  const [barPercentData, setBarPercentData] = useState([]);
  const [timeSpentData, setTimeSpentData] = useState([]);
  const [englishTopics, setEnglishTopics] = useState([]);
  const [mathTopics, setMathTopics] = useState([]);
  const [loadingKeyStrengths, setLoadingKeyStrengths] = useState(false);

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
    axios.get(GET_Courses).then((res) => {
      setCourses(res.data);
      if (!selectedCourse) setSelectedCourse(res.data[0]?.id.toString());
      if (!selectedCourseForTime) setSelectedCourseForTime(res.data[0]?.id.toString());
    });
    axios.get(GET_Students, { withCredentials: true }).then((res) => {
      setStudents(res.data);
      if (!selectedStudent) setSelectedStudent(res.data[0]?.id.toString());
      if (!scoreStudent) setScoreStudent(res.data[0]?.id.toString());
      if (!timeStudent) setTimeStudent(res.data[0]?.id.toString());
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
    if (!selectedStudent || !selectedCourse) return;
    setLoadingKeyStrengths(true);
    axios
      .get(`${BASE_URL}/api/test/key-strengths/`, {
        params: {
          ...finalDateParams,
          student_id: selectedStudent,
          course_id: selectedCourse,
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
  }, [finalDateParams, selectedCourse, selectedStudent]);

  useEffect(() => {
    if (!selectedCourse || !scoreStudent) return;
    axios
      .get(`${BASE_URL}/api/test/course-wise-time/`, {
        params: {
          ...finalDateParams,  
          student_id: scoreStudent, course_id: selectedCourse
        },
        withCredentials: true,
      })
      .then((res) => {
        const formatted = res.data.map((item) => ({
          name: item.test_name,
          value: item.score,
        }));
        setBarPercentData(formatted);
      });
  }, [scoreStudent, selectedCourse, finalDateParams]);

  useEffect(() => {
    if (!selectedCourseForTime || !timeStudent) return;
    axios
      .get(`${BASE_URL}/api/test/course-wise-time/`, {
        params: {
          ...finalDateParams,
          student_id: timeStudent,
          course_id: selectedCourseForTime,
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
      });
  }, [timeStudent, selectedCourseForTime, finalDateParams]);

  return (
    <div className="p-4 grid gap-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {["last_month", "last_week", "today"].map((val) => (
            <button
              key={val}
              onClick={() => {
                setSelectedFilter(val);
                setShowDatePicker(false);
                setCustomStartDate("");
                setCustomEndDate("");
              }}
              className={`px-4 py-1 text-sm rounded-md ${
                selectedFilter === val ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {val.replace("_", " ")}
            </button>
          ))}
        </div>
       <div className="relative">
  <button
    onClick={() => {
      setShowDatePicker(!showDatePicker);
      setSelectedFilter("custom");
    }}
    className={`flex items-center gap-2 px-4 py-1 text-sm rounded-md ${
      selectedFilter === "custom" ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"
    }`}
  >
    📅 Custom date
  </button>

  {showDatePicker && (
    <div className="absolute right-0 z-10 mt-2 w-72 bg-white border border-gray-200 shadow-xl rounded-md p-4 space-y-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600 font-medium">Start Date</label>
        <input
          type="date"
          value={customStartDate}
          onChange={(e) => setCustomStartDate(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring focus:border-blue-300"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600 font-medium">End Date</label>
        <input
          type="date"
          value={customEndDate}
          onChange={(e) => setCustomEndDate(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring focus:border-blue-300"
        />
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => {
            setCustomStartDate("");
            setCustomEndDate("");
            setShowDatePicker(false);
            setSelectedFilter("last_month"); // or any default
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

      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {["Concern", "Doubt", "Meeting", "Issue", "Suggestion"].map((title) => (
          <StatCard
            key={title}
            title={title}
            value={notificationCounts[title.toUpperCase()]?.unread_count ?? 0}
            selectedFilter={selectedFilter}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
          />
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold mb-4">Total students and their courses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={courseChartData} barSize={50}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
            cursor={{ fill: 'transparent' }}
            />
            <Bar dataKey="value" fill="#fbbf24" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold mb-4">Course-wise students and Their scores</h3>
        <div className="flex gap-4 mb-4">
          <Select
            className="w-64 text-sm"
            value={courses.find((c) => c.id.toString() === selectedCourse)}
            onChange={(opt) => setSelectedCourse(opt?.id.toString() || null)}
            options={courses}
            getOptionLabel={(e) => e.name}
            getOptionValue={(e) => e.id.toString()}
            isSearchable
          />
          <Select
            className="w-64 text-sm"
            value={students.find((s) => s.id.toString() === scoreStudent)}
            onChange={(opt) => setScoreStudent(opt?.id.toString() || null)}
            options={students}
            getOptionLabel={(e) => e.name}
            getOptionValue={(e) => e.id.toString()}
            isSearchable
          />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barPercentData} barSize={50}>
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}`} />
            <Tooltip
             cursor={{ fill: 'transparent' }} 
              formatter={(value) => `${value} `} />
            <Bar dataKey="value" fill="#fde68a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold mb-4">Time spent on course and score</h3>
        <div className="flex gap-4 mb-4">
          <Select
            className="w-64 text-sm"
            value={courses.find((c) => c.id.toString() === selectedCourseForTime)}
            onChange={(opt) => setSelectedCourseForTime(opt?.id.toString() || null)}
            options={courses}
            getOptionLabel={(e) => e.name}
            getOptionValue={(e) => e.id.toString()}
            isSearchable
          />
          <Select
            className="w-64 text-sm"
            value={students.find((s) => s.id.toString() === timeStudent)}
            onChange={(opt) => setTimeStudent(opt?.id.toString() || null)}
            options={students}
            getOptionLabel={(e) => e.name}
            getOptionValue={(e) => e.id.toString()}
            isSearchable
          />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeSpentData} barSize={30}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              formatter={(value, name) =>
                name === "Minutes" ? `${value} min` : `${value} score`
              }
            />
            <Legend />
            <Bar dataKey="score" fill="#f97316" name="Score" />
            <Bar dataKey="time_taken_minutes" fill="#3b82f6" name="Minutes" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex gap-4 mb-4">
          <Select
            className="w-64 text-sm"
            value={courses.find((c) => c.id.toString() === selectedCourse)}
            onChange={(opt) => setSelectedCourse(opt?.id.toString() || null)}
            options={courses}
            getOptionLabel={(e) => e.name}
            getOptionValue={(e) => e.id.toString()}
            isSearchable
          />
          <Select
            className="w-64 text-sm"
            value={students.find((s) => s.id.toString() === selectedStudent)}
            onChange={(opt) => setSelectedStudent(opt?.id.toString() || null)}
            options={students}
            getOptionLabel={(e) => e.name}
            getOptionValue={(e) => e.id.toString()}
            isSearchable
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">English</h3>
            {loadingKeyStrengths ? (
              <p>Loading...</p>
            ) : englishTopics.length > 0 ? (
              englishTopics.map((item, i) => (
                <div key={i} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span>{item.topic}</span>
                    <span>{item.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full"
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p>No data found</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Math</h3>
            {loadingKeyStrengths ? (
              <p>Loading...</p>
            ) : mathTopics.length > 0 ? (
              mathTopics.map((item, i) => (
                <div key={i} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span>{item.topic}</span>
                    <span>{item.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full"
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p>No data found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 