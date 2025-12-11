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
import axios from "axios";
import { GET_Courses, GET_Students, BASE_URL } from "@/app/constants/apiConstants";

function StatCard({ title, value }) {
  const router = useRouter();
  const { id } = useParams();

  const handleViewAll = () => {
    const routeMap = {
      Doubt: "doubts",
      Feedbacks: "feedbacks",
      Suggestion: "suggestions",
    };

    const route = routeMap[title];
    if (route) {
      router.push(`/faculty/${id}/${route}`);
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
  const { id: facultyId } = useParams();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filteredScoreData, setFilteredScoreData] = useState([]);
  const [timeSpentData, setTimeSpentData] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState("All courses");
  const [selectedStudent, setSelectedStudent] = useState("All students");
  const [selectedTimeStudent, setSelectedTimeStudent] = useState("All students");

  const [subjectsScore, setSubjectsScore] = useState([]);
const [topicsScore, setTopicsScore] = useState([]);
const [selectedSubjectScore, setSelectedSubjectScore] = useState("All subjects");
const [selectedTopicScore, setSelectedTopicScore] = useState("All topics");

// For time chart
const [subjectsTime, setSubjectsTime] = useState([]);
const [topicsTime, setTopicsTime] = useState([]);
const [selectedSubjectTime, setSelectedSubjectTime] = useState("All subjects");
const [selectedTopicTime, setSelectedTopicTime] = useState("All topics");

  const [notificationSummary, setNotificationSummary] = useState({
    Feedbacks: 0,
    Doubt: 0,
    Suggestion: 0,
  });

  const summaryData = [
    { title: "Feedbacks", value: notificationSummary.Feedbacks },
    { title: "Doubt", value: notificationSummary.Doubt },
    { title: "Suggestion", value: notificationSummary.Suggestion },
  ];

  // Auto-select first course if not selected
useEffect(() => {
  if (courses.length > 0 && selectedCourse === "All courses") {
    setSelectedCourse(courses[0].name);
  }
}, [courses]);

// Auto-select first student for score section
useEffect(() => {
  if (filteredStudents.length > 0 && selectedStudent === "All students") {
    setSelectedStudent(filteredStudents[0].name);
  }
}, [filteredStudents]);

// Auto-select first student for time section
useEffect(() => {
  if (filteredStudents.length > 0 && selectedTimeStudent === "All students") {
    setSelectedTimeStudent(filteredStudents[0].name);
  }
}, [filteredStudents]);


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
    const fetchStudents = async () => {
      try {
        const response = await axios.get(GET_Students, { withCredentials: true });
        setStudents(response.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchFacultyStudents = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/api/doubt/students-by-faculty/?faculty_id=${facultyId}`,
          { withCredentials: true }
        );
        const studentIds = response.data.student_ids;
        const matchedStudents = students.filter(student => studentIds.includes(student.id));
        setFilteredStudents(matchedStudents);
      } catch (error) {
        console.error("Error fetching students for faculty:", error);
      }
    };

    if (students.length > 0 && facultyId) {
      fetchFacultyStudents();
    }
  }, [students, facultyId]);

  useEffect(() => {
    const fetchNotificationSummary = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/doubt/faculty_unread_summary/`, {
          withCredentials: true,
        });
        setNotificationSummary(response.data);
      } catch (error) {
        console.error("Failed to fetch notification summary:", error);
      }
    };
    fetchNotificationSummary();
  }, []);

  useEffect(() => {
    const fetchScores = async () => {
      if (selectedCourse === "All courses" || selectedStudent === "All students") {
        setFilteredScoreData([]);
        return;
      }
      let subjectParam = "", topicParam = "";
      const studentObj = students.find((s) => s.name === selectedStudent);
      const courseObj = courses.find((c) => c.name === selectedCourse);
      const subjObj = subjectsScore.find(s => s.name === selectedSubjectScore);
const topicObj = topicsScore.find(t => t.name === selectedTopicScore);
if (subjObj) subjectParam = `&subject_id=${subjObj.id}`;
if (topicObj) topicParam = `&topic_id=${topicObj.id}`;
      if (!studentObj || !courseObj) return;

      try {
        const response = await axios.get(
  `${BASE_URL}/api/test/course-wise-time/?student_id=${studentObj.id}&course_id=${courseObj.id}${subjectParam}${topicParam}`,
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
  }, [selectedCourse, selectedStudent, selectedSubjectScore, selectedTopicScore, students, courses]);

  useEffect(() => {
  const fetchTimeSpentForStudent = async () => {
    try {
      let subjectParam = "", topicParam = "";
      let userIds = [];

      // ❗ only fetch if selectedTimeStudent is not "All students"
      if (selectedTimeStudent !== "All students") {
        const studentObj = students.find((s) => s.name === selectedTimeStudent);
        if (studentObj) userIds = [studentObj.id];
      } else {
        return; // prevent multiple IDs being used on reload
      }

      let courseParam = "";
      if (selectedCourse !== "All courses") {
        const courseObj = courses.find((c) => c.name === selectedCourse);
        if (courseObj) courseParam = `&course_id=${courseObj.id}`;
      }
      const subjObjTime = subjectsTime.find(s => s.name === selectedSubjectTime);
const topicObjTime = topicsTime.find(t => t.name === selectedTopicTime);
if (subjObjTime) subjectParam = `&subject_id=${subjObjTime.id}`;
if (topicObjTime) topicParam = `&topic_id=${topicObjTime.id}`;
      const userIdsQuery = userIds.join(",");
     const response = await axios.get(
  `${BASE_URL}/api/test/course-wise-time/?user_ids=${userIdsQuery}${courseParam}${subjectParam}${topicParam}`,
  { withCredentials: true }
);


      const formattedData = response.data.map((item) => ({
        course: item.test_name || item.course,
        hours: item.time_taken_minutes,
        score: item.score || 0,
        time_taken_minutes: item.time_taken_minutes,
      }));
      setTimeSpentData(formattedData);
    } catch (error) {
      console.error("Failed to fetch time spent data:", error);
      setTimeSpentData([]);
    }
  };

  if (selectedTimeStudent !== "All students") {
    fetchTimeSpentForStudent();
  }
}, [facultyId, selectedTimeStudent, selectedCourse, selectedSubjectTime, selectedTopicTime, students, courses]);

// For scores section
useEffect(() => {
  const courseObj = courses.find((c) => c.name === selectedCourse);
  if (!courseObj) return;

  axios.get(`${BASE_URL}/api/course/${courseObj.id}/subjects/`)
    .then(res => setSubjectsScore(res.data))
    .catch(err => console.error("Error fetching subjects for score:", err));
}, [selectedCourse]);

useEffect(() => {
  const subjectObj = subjectsScore.find((s) => s.name === selectedSubjectScore);
  const courseObj = courses.find((c) => c.name === selectedCourse);

  if (!subjectObj || !courseObj) return;

  axios
    .get(`${BASE_URL}/api/test/course/${courseObj.id}/subjects/${subjectObj.id}/topics/`, {
      withCredentials: true,
    })
    .then((res) => setTopicsScore(res.data))
    .catch((err) => console.error("Error fetching topics for score:", err));
}, [selectedSubjectScore, selectedCourse]);




// For time chart section
useEffect(() => {
  const courseObj = courses.find((c) => c.name === selectedCourse);
  if (!courseObj) return;

  axios.get(`${BASE_URL}/api/course/${courseObj.id}/subjects/`)
    .then(res => setSubjectsTime(res.data))
    .catch(err => console.error("Error fetching subjects for time:", err));
}, [selectedCourse]);

useEffect(() => {
  const subjectObj = subjectsTime.find((s) => s.name === selectedSubjectTime);
  const courseObj = courses.find((c) => c.name === selectedCourse);

  if (!subjectObj || !courseObj) return;

  axios
    .get(`${BASE_URL}/api/test/course/${courseObj.id}/subjects/${subjectObj.id}/topics/`, {
      withCredentials: true,
    })
    .then((res) => setTopicsTime(res.data))
    .catch((err) => console.error("Error fetching topics for time:", err));
}, [selectedSubjectTime, selectedCourse]);


  return (
    <div className="p-4 grid gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {summaryData.map((item, index) => (
          <StatCard key={index} title={item.title} value={item.value} />
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md w-full">
        <div className="flex justify-between flex-wrap items-center mb-4">
          <h2 className="text-xl font-semibold mb-2 md:mb-0">Course-wise Students and Their Scores</h2>
          <div className="flex gap-4 flex-wrap">
            <div className="w-64 text-sm">
              <Select
                value={{ label: selectedCourse, value: selectedCourse }}
                onChange={(option) => setSelectedCourse(option.value)}
                options={[{ label: "All courses", value: "All courses" }, ...courses.map(course => ({ label: course.name, value: course.name }))]}
              />
            </div>
            <div className="w-64 text-sm">
              <Select
                value={{ label: selectedStudent, value: selectedStudent }}
                onChange={(option) => setSelectedStudent(option.value)}
                options={[{ label: "All students", value: "All students" }, ...filteredStudents.map(student => ({ label: student.name, value: student.name }))]}
              />
            </div>
            <div className="w-64 text-sm">
  <Select
    value={{ label: selectedSubjectScore, value: selectedSubjectScore }}
    onChange={(option) => setSelectedSubjectScore(option.value)}
    options={[{ label: "All subjects", value: "All subjects" }, ...subjectsScore.map(s => ({ label: s.name, value: s.name }))]}
    placeholder="Select Subject"
  />
</div>
<div className="w-64 text-sm">
  <Select
    value={{ label: selectedTopicScore, value: selectedTopicScore }}
    onChange={(option) => setSelectedTopicScore(option.value)}
    options={[{ label: "All topics", value: "All topics" }, ...topicsScore.map(t => ({ label: t.name, value: t.name }))]}
    placeholder="Select Topic"
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

      <div className="bg-white p-6 rounded-xl shadow-md w-full">
        <div className="flex justify-between flex-wrap items-center mb-4">
          <h2 className="text-xl font-semibold mb-2 md:mb-0">Time Spent on Course and Score</h2>
          <div className="flex gap-4">
            <div className="w-64 text-sm">
              <Select
                value={{ label: selectedCourse, value: selectedCourse }}
                onChange={(option) => setSelectedCourse(option.value)}
                options={[{ label: "All courses", value: "All courses" }, ...courses.map(course => ({ label: course.name, value: course.name }))]}
              />
            </div>
            <div className="w-64 text-sm">
              <Select
                value={{ label: selectedTimeStudent, value: selectedTimeStudent }}
                onChange={(option) => setSelectedTimeStudent(option.value)}
                options={[{ label: "All students", value: "All students" }, ...filteredStudents.map(student => ({ label: student.name, value: student.name }))]}
              />
            </div>
            <div className="w-64 text-sm">
  <Select
    value={{ label: selectedSubjectTime, value: selectedSubjectTime }}
    onChange={(option) => setSelectedSubjectTime(option.value)}
    options={[{ label: "All subjects", value: "All subjects" }, ...subjectsTime.map(s => ({ label: s.name, value: s.name }))]}
    placeholder="Select Subject"
  />
</div>
<div className="w-64 text-sm">
  <Select
    value={{ label: selectedTopicTime, value: selectedTopicTime }}
    onChange={(option) => setSelectedTopicTime(option.value)}
    options={[{ label: "All topics", value: "All topics" }, ...topicsTime.map(t => ({ label: t.name, value: t.name }))]}
    placeholder="Select Topic"
  />
</div>


          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={timeSpentData} barSize={30} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="course" />
            <YAxis tickFormatter={(v) => `${v}`} />
            <Tooltip
                         trigger="hover"
                         shared={false}
                         cursor={{ fill: 'transparent' }}
                         formatter={(value, name) =>
                name === "Minutes" ? `${value} min` : `${value} score`}
            
                       />
            <Legend />
            <Bar dataKey="score" fill="#f97316" name="Score" radius={[4, 4, 0, 0]} />
            <Bar dataKey="time_taken_minutes" fill="#3b82f6" name="Minutes" radius={[4, 4, 0, 0]} />
            
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}