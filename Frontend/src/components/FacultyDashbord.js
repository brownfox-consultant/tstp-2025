"use client";
import "@/app/Dashboard.css";

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
import Select, { components } from "react-select";
import axios from "axios";
import { GET_Students, BASE_URL } from "@/app/constants/apiConstants";

// Icon imports - reusable across all dashboards
import {
  MessageIcon,
  QuestionIcon,
  LightbulbIcon,
  BarChartIcon,
  ClockIcon,
  ArrowRightIcon,
  ChevronIcon,
} from "@/components/icons/dashboard-icons";
import DashboardHeader from "@/components/DashboardHeader";

// Brand Colors from the color palette
const COLORS = {
  primary: {
    orange: "#F59403",
    yellow: "#FFD36A",
    darkBrown: "#2E2725",
    brown: "#805830",
  },
  secondary: {
    blue: "#0071BC",
    cyan: "#70D9E4",
  },
};

// Custom Dropdown Indicator Component
const CustomDropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronIcon className="w-4 h-4" isOpen={props.selectProps.menuIsOpen} color="#805830" />
    </components.DropdownIndicator>
  );
};

// Custom Select Components
const customSelectComponents = {
  DropdownIndicator: CustomDropdownIndicator,
};

// Reusable Select Component
const DashboardSelect = ({ value, onChange, options, placeholder }) => (
  <Select
    value={{ label: value, value: value }}
    onChange={onChange}
    options={options}
    components={customSelectComponents}
    placeholder={placeholder}
    className="w-full text-sm"
  />
);

// Stat Card Component
function StatCard({ title, value, icon: Icon, gradient }) {
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
    <div
      className="group relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer bg-white shadow-lg m-0"
      onClick={handleViewAll}
    >
      {/* Gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: gradient }} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
          <p className="text-4xl font-bold" style={{ color: COLORS.primary.darkBrown }}>
            {value}
          </p>
        </div>

        <div
          className="p-3 rounded-lg transition-all duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${COLORS.primary.yellow}30, ${COLORS.primary.orange}20)`,
            color: COLORS.primary.orange,
          }}
        >
          <Icon />
        </div>
      </div>

      <button
        className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors hover:underline bg-transparent"
        style={{ color: COLORS.primary.orange }}
        onClick={(e) => {
          e.stopPropagation();
          handleViewAll();
        }}
      >
       View all →    
      </button>
    </div>
  );
}

// Chart Container Component
function ChartContainer({ title, icon: Icon, children, filters, isLoading }) {
  return (
    <div className="bg-white shadow-md rounded-xl">
      {/* Header */}
      <div
        className="px-6 py-4 border-b rounded-t-xl"
        style={{
          background: `linear-gradient(135deg, ${COLORS.primary.brown}), ${COLORS.primary.darkBrown}`,
          borderColor: "#f3f4f6",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-600 text-white">
              <Icon />
            </div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
        </div>
      </div>

      {/* Filters */}
      {filters && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filters}
          </div>
        </div>
      )}

      {/* Chart Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          children
        )}
      </div>
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

  // Loading States
  const [loadingScore, setLoadingScore] = useState(false);
  const [loadingTime, setLoadingTime] = useState(false);

  const [name, setName] = useState("");

  const [notificationSummary, setNotificationSummary] = useState({
    Feedbacks: 0,
    Doubt: 0,
    Suggestion: 0,
  });

  const summaryData = [
    {
      title: "Feedbacks",
      value: notificationSummary.Feedbacks,
      icon: MessageIcon,
      gradient: `linear-gradient(135deg, ${COLORS.secondary.blue}, ${COLORS.secondary.cyan})`,
    },
    {
      title: "Doubt",
      value: notificationSummary.Doubt,
      icon: QuestionIcon,
      gradient: `linear-gradient(135deg, ${COLORS.primary.orange}, ${COLORS.primary.yellow})`,
    },
    {
      title: "Suggestion",
      value: notificationSummary.Suggestion,
      icon: LightbulbIcon,
      gradient: `linear-gradient(135deg, ${COLORS.primary.brown}, ${COLORS.primary.darkBrown})`,
    },
  ];

  // Helper for simulated refresh
  const handleScoreFilterChange = (setter, value) => {
    setLoadingScore(true);
    setter(value);
    setTimeout(() => setLoadingScore(false), 600);
  };

  const handleTimeFilterChange = (setter, value) => {
    setLoadingTime(true);
    setter(value);
    setTimeout(() => setLoadingTime(false), 600);
  };

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
    const fetchStudentCourses = async () => {
      try {
        if (selectedStudent === "All students") {
          setCourses([]);
          setSelectedCourse("All courses");
          return;
        }

        const studentObj = filteredStudents.find(
          (s) => s.name === selectedStudent
        );

        if (!studentObj) {
          setCourses([]);
          return;
        }

        const res = await axios.get(
          `${BASE_URL}/api/course/student-courses/?user_id=${studentObj.id}`,
          { withCredentials: true }
        );

        const data = res.data || [];
        setCourses(data);

        // auto-select first course
        if (data.length > 0) {
          setSelectedCourse(data[0].name);
        }
      } catch (error) {
        console.error("Error fetching student courses:", error);
        setCourses([]);
      }
    };

    fetchStudentCourses();
  }, [selectedStudent, filteredStudents]);

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
        const matchedStudents = students.filter((student) =>
          studentIds.includes(student.id)
        );
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
    // Set user name
    if (typeof window !== "undefined") {
      setName(window.localStorage.getItem("name") || "Faculty");
    }

    const fetchNotificationSummary = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/api/doubt/faculty_unread_summary/`,
          {
            withCredentials: true,
          }
        );
        setNotificationSummary(response.data);
      } catch (error) {
        console.error("Failed to fetch notification summary:", error);
      }
    };
    fetchNotificationSummary();
  }, []);

  useEffect(() => {
    const fetchScores = async () => {
      if (
        selectedCourse === "All courses" ||
        selectedStudent === "All students"
      ) {
        setFilteredScoreData([]);
        return;
      }
      let subjectParam = "",
        topicParam = "";
      const studentObj = students.find((s) => s.name === selectedStudent);
      const courseObj = courses.find((c) => c.name === selectedCourse);
      const subjObj = subjectsScore.find((s) => s.name === selectedSubjectScore);
      const topicObj = topicsScore.find((t) => t.name === selectedTopicScore);
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
  }, [
    selectedCourse,
    selectedStudent,
    selectedSubjectScore,
    selectedTopicScore,
    students,
    courses,
  ]);

  useEffect(() => {
    const fetchTimeSpentForStudent = async () => {
      try {
        let subjectParam = "",
          topicParam = "";
        let userIds = [];

        if (selectedTimeStudent !== "All students") {
          const studentObj = students.find(
            (s) => s.name === selectedTimeStudent
          );
          if (studentObj) userIds = [studentObj.id];
        } else {
          return;
        }

        let courseParam = "";
        if (selectedCourse !== "All courses") {
          const courseObj = courses.find((c) => c.name === selectedCourse);
          if (courseObj) courseParam = `&course_id=${courseObj.id}`;
        }
        const subjObjTime = subjectsTime.find(
          (s) => s.name === selectedSubjectTime
        );
        const topicObjTime = topicsTime.find(
          (t) => t.name === selectedTopicTime
        );
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
  }, [
    facultyId,
    selectedTimeStudent,
    selectedCourse,
    selectedSubjectTime,
    selectedTopicTime,
    students,
    courses,
  ]);

  // For scores section
  useEffect(() => {
    const courseObj = courses.find((c) => c.name === selectedCourse);
    if (!courseObj) return;

    axios
      .get(`${BASE_URL}/api/course/${courseObj.id}/subjects/`)
      .then((res) => setSubjectsScore(res.data))
      .catch((err) => console.error("Error fetching subjects for score:", err));
  }, [selectedCourse]);

  useEffect(() => {
    const subjectObj = subjectsScore.find((s) => s.name === selectedSubjectScore);
    const courseObj = courses.find((c) => c.name === selectedCourse);

    if (!subjectObj || !courseObj) return;

    axios
      .get(
        `${BASE_URL}/api/test/course/${courseObj.id}/subjects/${subjectObj.id}/topics/`,
        {
          withCredentials: true,
        }
      )
      .then((res) => setTopicsScore(res.data))
      .catch((err) => console.error("Error fetching topics for score:", err));
  }, [selectedSubjectScore, selectedCourse]);

  // For time chart section
  useEffect(() => {
    const courseObj = courses.find((c) => c.name === selectedCourse);
    if (!courseObj) return;

    axios
      .get(`${BASE_URL}/api/course/${courseObj.id}/subjects/`)
      .then((res) => setSubjectsTime(res.data))
      .catch((err) => console.error("Error fetching subjects for time:", err));
  }, [selectedCourse]);

  useEffect(() => {
    const subjectObj = subjectsTime.find((s) => s.name === selectedSubjectTime);
    const courseObj = courses.find((c) => c.name === selectedCourse);

    if (!subjectObj || !courseObj) return;

    axios
      .get(
        `${BASE_URL}/api/test/course/${courseObj.id}/subjects/${subjectObj.id}/topics/`,
        {
          withCredentials: true,
        }
      )
      .then((res) => setTopicsTime(res.data))
      .catch((err) => console.error("Error fetching topics for time:", err));
  }, [selectedSubjectTime, selectedCourse]);

  return (
    <div>
   
        <DashboardHeader name={name} />
 

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {summaryData.map((item, index) => (
          <StatCard
            key={index}
            title={item.title}
            value={item.value}
            icon={item.icon}
            gradient={item.gradient}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Score Chart */}
        <ChartContainer
          title="Course-wise Students and Their Scores"
          icon={BarChartIcon}
          isLoading={loadingScore}
          filters={
            <>
              <DashboardSelect
                value={selectedCourse}
                onChange={(option) => handleScoreFilterChange(setSelectedCourse, option.value)}
                options={[
                  { label: "All courses", value: "All courses" },
                  ...courses.map((course) => ({
                    label: course.name,
                    value: course.name,
                  })),
                ]}
                placeholder="Select Course"
              />
              <DashboardSelect
                value={selectedStudent}
                onChange={(option) => handleScoreFilterChange(setSelectedStudent, option.value)}
                options={[
                  { label: "All students", value: "All students" },
                  ...filteredStudents.map((student) => ({
                    label: student.name,
                    value: student.name,
                  })),
                ]}
                placeholder="Select Student"
              />
              <DashboardSelect
                value={selectedSubjectScore}
                onChange={(option) => handleScoreFilterChange(setSelectedSubjectScore, option.value)}
                options={[
                  { label: "All subjects", value: "All subjects" },
                  ...subjectsScore.map((s) => ({
                    label: s.name,
                    value: s.name,
                  })),
                ]}
                placeholder="Select Subject"
              />
              <DashboardSelect
                value={selectedTopicScore}
                onChange={(option) => handleScoreFilterChange(setSelectedTopicScore, option.value)}
                options={[
                  { label: "All topics", value: "All topics" },
                  ...topicsScore.map((t) => ({
                    label: t.name,
                    value: t.name,
                  })),
                ]}
                placeholder="Select Topic"
              />
            </>
          }
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={filteredScoreData} barSize={30} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="test_name"
                tick={{ fill: COLORS.primary.darkBrown, fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tickFormatter={(v) => `${v}`}
                tick={{ fill: COLORS.primary.darkBrown, fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <Tooltip
                trigger="hover"
                cursor={{ fill: "transparent" }}
                formatter={(value) => `${value}`}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span style={{ color: COLORS.primary.darkBrown }}>{value}</span>
                )}
              />
              <Bar
                dataKey="score"
                fill={COLORS.primary.orange}
                radius={[4, 4, 0, 0]}
                name="Score"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Time Chart */}
        <ChartContainer
          title="Time Spent on Course and Score"
          icon={ClockIcon}
          isLoading={loadingTime}
          filters={
            <>
              <DashboardSelect
                value={selectedCourse}
                onChange={(option) => handleTimeFilterChange(setSelectedCourse, option.value)}
                options={[
                  { label: "All courses", value: "All courses" },
                  ...courses.map((course) => ({
                    label: course.name,
                    value: course.name,
                  })),
                ]}
                placeholder="Select Course"
              />
              <DashboardSelect
                value={selectedTimeStudent}
                onChange={(option) => handleTimeFilterChange(setSelectedTimeStudent, option.value)}
                options={[
                  { label: "All students", value: "All students" },
                  ...filteredStudents.map((student) => ({
                    label: student.name,
                    value: student.name,
                  })),
                ]}
                placeholder="Select Student"
              />
              <DashboardSelect
                value={selectedSubjectTime}
                onChange={(option) => handleTimeFilterChange(setSelectedSubjectTime, option.value)}
                options={[
                  { label: "All subjects", value: "All subjects" },
                  ...subjectsTime.map((s) => ({
                    label: s.name,
                    value: s.name,
                  })),
                ]}
                placeholder="Select Subject"
              />
              <DashboardSelect
                value={selectedTopicTime}
                onChange={(option) => handleTimeFilterChange(setSelectedTopicTime, option.value)}
                options={[
                  { label: "All topics", value: "All topics" },
                  ...topicsTime.map((t) => ({
                    label: t.name,
                    value: t.name,
                  })),
                ]}
                placeholder="Select Topic"
              />
            </>
          }
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={timeSpentData} barSize={30} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="course"
                tick={{ fill: COLORS.primary.darkBrown, fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tickFormatter={(v) => `${v}`}
                tick={{ fill: COLORS.primary.darkBrown, fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <Tooltip
                trigger="hover"
                cursor={{ fill: "transparent" }}
                formatter={(value, name) =>
                  name === "Minutes" ? `${value} min` : `${value} score`
                }
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span style={{ color: COLORS.primary.darkBrown }}>{value}</span>
                )}
              />
              <Bar
                dataKey="score"
                fill={COLORS.primary.orange}
                name="Score"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="time_taken_minutes"
                fill={COLORS.secondary.blue}
                name="Minutes"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}

