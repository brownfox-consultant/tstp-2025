"use client";


import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import Select from "react-select";
import axios from "axios"; // Also make sure axios is imported
import { GET_Courses, GET_Students,BASE_URL } from "@/app/constants/apiConstants";

function StatCard({ title, value }) {
  const router = useRouter();
  const { id } = useParams();

  const handleViewAll = () => {
    const routeMap = {
      Doubt: "doubts",
      Feedbacks:"feedbacks",
      Issues: "issues",
    };

    const route = routeMap[title];
    if (route) {
       router.push(`/mentor/${id}/${route}`);
    }
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
  const { id: mentorId } = useParams();

  const [courses, setCourses] = useState([]);
const [students, setStudents] = useState([]);


const [filteredScoreData, setFilteredScoreData] = useState([]);

 const [timeSpentData, setTimeSpentData] = useState([]);


  const [selectedCourse, setSelectedCourse] = useState("All courses");
  const [selectedStudent, setSelectedStudent] = useState("All students");
  const [selectedTimeStudent, setSelectedTimeStudent] = useState("All students");
  const [selectedTimeCourse, setSelectedTimeCourse] = useState("All courses");



  
  const [notificationSummary, setNotificationSummary] = useState({
  Feedbacks: 0,
  Doubt: 0,
  Suggestion: 0,
});

const summaryData = [
  { title: "Feedbacks", value: notificationSummary.Feedbacks },
  { title: "Doubt", value: notificationSummary.Doubt },
  { title: "Issues", value: notificationSummary.Issues },
];

useEffect(() => {
  const fetchNotificationSummary = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/doubt/mentor_unread_summary/`,
        { withCredentials: true }
      );
      setNotificationSummary(response.data);
    } catch (error) {
      console.error("Failed to fetch mentor notification summary:", error);
    }
  };

  fetchNotificationSummary();
}, []);



useEffect(() => {
  const fetchTimeSpent = async () => {
    try {
      let studentIds = [];

      // ✅ ONLY proceed if a specific student is selected
      if (selectedTimeStudent === "All students") return;

      const selectedStudentObj = students.find((s) => s.name === selectedTimeStudent);
      if (!selectedStudentObj) {
        setTimeSpentData([]);
        return;
      }

      studentIds = [selectedStudentObj.id];

      const studentIdsParam = studentIds.join(",");

      let url = `${BASE_URL}/api/test/course-wise-time/?user_ids=${studentIdsParam}`;

      if (selectedTimeCourse !== "All courses") {
        const selectedCourseObj = courses.find((c) => c.name === selectedTimeCourse);
        if (selectedCourseObj) {
          url += `&course_id=${selectedCourseObj.id}`;
        }
      }

      const response = await axios.get(url, { withCredentials: true });
      const formatted = response.data.map((item) => ({
        name: item.test_name || item.course,
        time_taken_minutes: item.time_taken_minutes || 0,
        score: item.score || 0,
      }));
      setTimeSpentData(formatted);
    } catch (error) {
      console.error("Failed to fetch time spent data:", error);
      setTimeSpentData([]);
    }
  };

  // ✅ Only fetch when a student is selected
  if (mentorId && selectedTimeStudent !== "All students") {
    fetchTimeSpent();
  }
}, [mentorId, selectedTimeStudent, selectedTimeCourse, students, courses]);





  useEffect(() => {
  const fetchCourses = async () => {
    try {
      const response = await axios.get(GET_Courses, { withCredentials: true });
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };
  fetchCourses();
}, []);

useEffect(() => {
  const fetchStudentsByMentor = async () => {
    try {
      // Get all students
      const allStudentsRes = await axios.get(GET_Students, { withCredentials: true });
      const allStudents = allStudentsRes.data;

      // Get student IDs under mentor
      const mentorStudentRes = await axios.get(
        `${BASE_URL}/api/doubt/students-by-mentor/?mentor_id=${mentorId}`,
        { withCredentials: true }
      );
      const studentIds = mentorStudentRes.data.student_ids;

      // Filter only those students
      const filtered = allStudents.filter(student => studentIds.includes(student.id));
      setStudents(filtered);
    } catch (error) {
      console.error("Error fetching students by mentor:", error);
    }
  };

  if (mentorId) {
    fetchStudentsByMentor();
  }
}, [mentorId]);



useEffect(() => {
  const fetchScores = async () => {
    if (
      selectedCourse === "All courses" ||
      selectedStudent === "All students"
    ) {
      setFilteredScoreData([]);
      return;
    }

    const studentObj = students.find((s) => s.name === selectedStudent);
    const courseObj = courses.find((c) => c.name === selectedCourse);

    if (!studentObj || !courseObj) return;

    try {
      const response = await axios.get(
        `${BASE_URL}/api/test/course-wise-time/?student_id=${studentObj.id}&course_id=${courseObj.id}`,
        { withCredentials: true }
      );

      const scores = response.data.map((item) => ({
        test_name: item.test_name,
        score: item.score,
      }));

      setFilteredScoreData(scores);
    } catch (error) {
      console.error("Failed to fetch test-wise scores:", error);
      setFilteredScoreData([]);
    }
  };

  fetchScores();
}, [selectedCourse, selectedStudent, students, courses]);

useEffect(() => {
  if (courses.length > 0 && selectedCourse === "All courses") {
    setSelectedCourse(courses[0].name);
  }
}, [courses]);

  useEffect(() => {
  if (students.length > 0 && selectedStudent === "All students") {
    setSelectedStudent(students[0].name);
  }
  }, [students]);
  
 useEffect(() => {
  if (selectedTimeStudent === "All students" && students.length > 0) {
    setSelectedTimeStudent(students[0].name);  // default to first student
  }
}, [selectedTimeStudent, students]);



  return (
    <div className="p-4 grid gap-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {summaryData.map((item, index) => (
          <StatCard key={index} title={item.title} value={item.value} />
        ))}
      </div>

      {/* Course-wise Students and Scores with Filters */}
      <div className="bg-white p-6 rounded-xl shadow-md w-full">
        <div className="flex justify-between flex-wrap items-center mb-4">
          <h2 className="text-xl font-semibold mb-2 md:mb-0">Course-wise Students and Their Scores</h2>
          <div className="flex gap-4 flex-wrap">
            <div className="w-64 text-sm">
              <Select
  value={{ label: selectedCourse, value: selectedCourse }}
  onChange={(option) => setSelectedCourse(option.value)}
  options={[
    { label: "All courses", value: "All courses" },
    ...courses.map((course) => ({
      label: course.name,
      value: course.name,
    })),
  ]}
/>

            </div>
            <div className="w-64 text-sm">
             <Select
  value={{ label: selectedStudent, value: selectedStudent }}
  onChange={(option) => setSelectedStudent(option.value)}
  options={[
    { label: "All students", value: "All students" },
    ...students.map((student) => ({
      label: student.name,
      value: student.name,
    })),
  ]}
/>

            </div>
          </div>
        </div>
<ResponsiveContainer width="100%" height={350}>
  <BarChart data={filteredScoreData} barSize={40} barCategoryGap="20%">
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="test_name" />
    <YAxis  tickFormatter={(v) => `${v}`} />
             <Tooltip
  trigger="hover"
  shared={false}
  cursor={{ fill: 'transparent' }}
  formatter={(value) => `${value}`}
/>
    <Legend />
    <Bar dataKey="score" fill="#fbbf24" />
  </BarChart>
</ResponsiveContainer>

      </div>

      {/* Time Spent on Course Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md w-full">
  <div className="flex justify-between flex-wrap items-center mb-4">
  <h2 className="text-xl font-semibold mb-2 md:mb-0">Time Spent on Course and Score</h2>
  <div className="flex gap-4 flex-wrap">
            <div className="w-64 text-sm">
              
              <Select
        value={{ label: selectedTimeCourse, value: selectedTimeCourse }}
        onChange={(option) => setSelectedTimeCourse(option.value)}
        options={[
          { label: "All courses", value: "All courses" },
          ...courses.map((course) => ({
            label: course.name,
            value: course.name,
          })),
        ]}
        isSearchable
      />
    
    </div>
    <div className="w-64 text-sm">
        <Select
        value={{ label: selectedTimeStudent, value: selectedTimeStudent }}
        onChange={(option) => setSelectedTimeStudent(option.value)}
        options={[
          { label: "All students", value: "All students" },
          ...students.map((student) => ({
            label: student.name,
            value: student.name,
          })),
        ]}
        isSearchable
      />
    </div>
  </div>
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
    </div>
  );
}
