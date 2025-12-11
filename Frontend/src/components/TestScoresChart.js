"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Select from "react-select";
import axios from "axios";
import { usePathname } from "next/navigation";
import { BASE_URL, GET_Courses } from "@/app/constants/apiConstants";

const GET_Subjects = (courseId) =>
  `${BASE_URL}/api/course/${courseId}/subjects/`;
const GET_TestScores = ({ studentId, courseId, subjectId, dateRange }) => {
  let url = `${BASE_URL}/api/test/student-test-scores/?student_id=${studentId}&course_id=${courseId}&subject_id=${subjectId}&date_range=${dateRange}`;
  return url;
};

export default function TestScoresChart({ dateRange }) {
  const pathname = usePathname();
  const studentId = pathname?.split("/")?.[2]; // e.g. /student/12/dashboard

  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedCourseForScores, setSelectedCourseForScores] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [testScoreData, setTestScoreData] = useState([]);
  // inside TestScoresChart.jsx (above return)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-300 p-3 rounded-md shadow-md text-sm">
        <p className="font-semibold text-gray-700">{data.test}</p>
        <p className="text-yellow-600">Score: {data.score}</p>
      </div>
    );
  }
  return null;
};

  // Fetch courses
  useEffect(() => {
    axios
      .get(GET_Courses, { withCredentials: true })
      .then((res) => setCourses(res.data))
      .catch((err) => console.error("Courses fetch error:", err));
  }, []);

  // Fetch subjects for selected course
  useEffect(() => {
    if (selectedCourseForScores) {
      axios
        .get(GET_Subjects(selectedCourseForScores), { withCredentials: true })
        .then((res) => {
          setSubjects(res.data);
          setSelectedSubject(null); // reset subject
        })
        .catch((err) => {
          console.error("Subjects fetch error:", err);
          setSubjects([]);
        });
    }
  }, [selectedCourseForScores]);

  // Fetch test scores when course + subject are selected
  useEffect(() => {
    if (studentId && selectedCourseForScores) {
      const subjectObj = selectedSubject
        ? subjects.find((s) => s.name === selectedSubject)
        : null;

      const params = {
        studentId,
        courseId: selectedCourseForScores,
        subjectId: subjectObj?.id || "",
        dateRange,
      };

      axios
        .get(GET_TestScores(params), { withCredentials: true })
        .then((res) => {
          const transformed = res.data.map((item) => ({
            test: item.test_name,
            score: item.score,
          }));
          setTestScoreData(transformed);
        })
        .catch((err) => {
          console.error("Score fetch error:", err);
          setTestScoreData([]);
        });
    }
  }, [studentId, selectedCourseForScores, selectedSubject, dateRange]);

  // Default select first course
  useEffect(() => {
    if (courses.length > 0 && !selectedCourseForScores) {
      setSelectedCourseForScores(courses[0].id);
    }
  }, [courses]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mt-8 mx-4">
      <div className="flex justify-between flex-wrap items-center mb-4">
        <h2 className="text-xl font-semibold mb-2 md:mb-0">Test Scores</h2>
        <div className="flex gap-4 flex-wrap">
          {/* Course Dropdown */}
          <div className="w-64 text-sm">
            <Select
              placeholder="Select Course"
              options={courses.map((c) => ({ label: c.name, value: c.id }))}
              value={
                selectedCourseForScores
                  ? {
                      label: courses.find(
                        (c) => c.id === selectedCourseForScores
                      )?.name,
                      value: selectedCourseForScores,
                    }
                  : null
              }
              onChange={(option) => {
                setSelectedCourseForScores(option.value);
                setSelectedSubject(null);
                setTestScoreData([]);
              }}
              isSearchable
            />
          </div>

          {/* Subject Dropdown */}
          <div className="w-64 text-sm">
            <Select
              placeholder="Select Subject"
              options={[
                { label: "Select Subject", value: "" },
                ...subjects.map((subj) => ({
                  label: subj.name,
                  value: subj.name,
                })),
              ]}
              value={
                selectedSubject
                  ? { label: selectedSubject, value: selectedSubject }
                  : { label: "Select Subject", value: "" }
              }
              onChange={(option) => setSelectedSubject(option?.value || "")}
              isDisabled={!selectedCourseForScores}
              isSearchable
            />
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
  <BarChart data={testScoreData} barSize={40} barCategoryGap="20%">
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="test" />
    <YAxis />
    <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
    <Legend />
    <Bar dataKey="score" fill="#fbbf24" />
  </BarChart>
</ResponsiveContainer>

    </div>
  );
}
