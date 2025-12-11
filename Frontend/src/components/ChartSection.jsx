'use client';

import React, { useEffect, useState } from 'react';
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
} from 'recharts';
import axios from 'axios';
import Select from 'react-select';
import { GET_Courses, GET_Students, BASE_URL } from '@/app/constants/apiConstants';

const ChartSection = ({ courseChartData, dummyLineData, dateFilterParams }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseForTime, setSelectedCourseForTime] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [scoreStudent, setScoreStudent] = useState(null);
  const [barPercentData, setBarPercentData] = useState([]);

  const [timeStudent, setTimeStudent] = useState(null);
  const [timeSpentData, setTimeSpentData] = useState([]);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(GET_Courses);
        setCourses(response.data);
        if (response.data.length > 0) {
          setSelectedCourse(response.data[0].id.toString());
          setSelectedCourseForTime(response.data[0].id.toString());
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, []);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get(GET_Students, { withCredentials: true });
        setStudents(response.data);
        if (response.data.length > 0) {
          setScoreStudent(response.data[0].id.toString());
          setTimeStudent(response.data[0].id.toString());
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };
    fetchStudents();
  }, [dateFilterParams]);

  // Fetch subjects for selected course (time section)
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedCourseForTime) return;
      try {
        const res = await axios.get(`${BASE_URL}/api/course/${selectedCourseForTime}/subjects/`, {
          withCredentials: true,
        });
        setSubjects(res.data);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setSubjects([]);
      }
    };
    fetchSubjects();
  }, [selectedCourseForTime,dateFilterParams]);

  // Fetch scores
  useEffect(() => {
    const fetchScores = async () => {
      if (!selectedCourse || !scoreStudent) {
        setBarPercentData([]);
        return;
      }

      try {
        const response = await axios.get(
          `${BASE_URL}/api/test/test-wise-scores/?student_id=${scoreStudent}&course_id=${selectedCourse}`,
          { withCredentials: true }
        );

        const formattedData = response.data.map((item) => ({
          name: item.test_name,
          value: item.score,
        }));

        setBarPercentData(formattedData);
      } catch (error) {
        console.error('Error fetching test-wise scores:', error);
        setBarPercentData([]);
      }
    };

    fetchScores();
  }, [scoreStudent, selectedCourse,dateFilterParams]);

  // Fetch time spent
  useEffect(() => {
    const fetchTimeSpentData = async () => {
      if (!timeStudent || !selectedCourseForTime) {
        setTimeSpentData([]);
        return;
      }

      try {
        const response = await axios.get(
  `${BASE_URL}/api/test/course-wise-time/`,
  {
    params: {
      ...dateFilterParams, // ✅ include date filter
      student_id: timeStudent,
      course_id: selectedCourseForTime,
      ...(selectedSubject ? { subject_id: selectedSubject } : {}),
    },
    withCredentials: true,
  }
);

        const formatted = response.data.map((item) => ({
  name: item.test_name || item.course,
  time_taken_minutes: item.time_taken_minutes || 0,
  score: item.score || 0,
}));


        setTimeSpentData(formatted);
      } catch (error) {
        console.error('Error fetching time spent data:', error);
        setTimeSpentData([]);
      }
    };

    fetchTimeSpentData();
  }, [timeStudent, selectedCourseForTime, selectedSubject,dateFilterParams]);

  return (
    <div className="grid gap-6">
      {/* Total Students and their Courses */}
      <div className="bg-white p-4 rounded-xl shadow-md w-full">
        <h3 className="text-xl font-semibold mb-4">Total students and their courses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={courseChartData} barSize={40}>
            <XAxis dataKey="name" />
            <YAxis />
             <Tooltip
              trigger="hover"
              shared={false}
              cursor={{ fill: 'transparent' }}
              formatter={(value) => `${value}` }
            />
            
            <Bar dataKey="value" fill="#fbbf24" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Course-wise Students and Scores */}
      <div className="bg-white p-4 rounded-xl shadow-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Course-wise students and their scores</h3>
          <div className="flex gap-4 items-center">
            {/* Course Dropdown */}
            <div className="w-64 text-sm">
              <Select
                value={courses.find((c) => c.id.toString() === selectedCourse) || null}
                onChange={(opt) => setSelectedCourse(opt?.id.toString() || null)}
                options={courses}
                getOptionLabel={(e) => e.name}
                getOptionValue={(e) => e.id.toString()}
                isSearchable
              />
            </div>

            {/* Student Dropdown */}
            <div className="w-64 text-sm">
              <Select
                value={students.find((s) => s.id.toString() === scoreStudent) || null}
                onChange={(opt) => setScoreStudent(opt?.id.toString() || null)}
                options={students}
                getOptionLabel={(e) => e.name}
                getOptionValue={(e) => e.id.toString()}
                isSearchable
              />
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barPercentData} barSize={40}>
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
            
             <Tooltip
              trigger="hover"
              shared={false}
              cursor={{ fill: 'transparent' }}
              formatter={(value) => `${value} %`}
            />
            <Bar dataKey="value" fill="#fde68a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Faculty Performance */}
      <div className="bg-white p-4 rounded-xl shadow-md w-full">
        <h3 className="text-xl font-semibold mb-4">Faculty Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dummyLineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="students" fill="#fbbf24" />
            <Line yAxisId="right" type="monotone" dataKey="timeSpent" stroke="#8b5cf6" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Time Spent Section */}
      <div className="bg-white p-4 rounded-xl shadow-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Time spent on course and score</h3>
          <div className="flex gap-4">
            {/* Course Dropdown */}
            <div className="w-64 text-sm">
              <Select
                value={courses.find((c) => c.id.toString() === selectedCourseForTime) || null}
                onChange={(opt) => setSelectedCourseForTime(opt?.id.toString() || null)}
                options={courses}
                getOptionLabel={(e) => e.name}
                getOptionValue={(e) => e.id.toString()}
                isSearchable
              />
            </div>

            {/* Subject Dropdown */}
            

            {/* Student Dropdown */}
            <div className="w-64 text-sm">
              <Select
                value={students.find((s) => s.id.toString() === timeStudent) || null}
                onChange={(opt) => setTimeStudent(opt?.id.toString() || null)}
                options={students}
                getOptionLabel={(e) => e.name}
                getOptionValue={(e) => e.id.toString()}
                isSearchable
              />
            </div>
          </div>
        </div>

        {/* <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeSpentData} barSize={40}>
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `${value} min`} />
             <Tooltip
              trigger="hover"
              shared={false}
              cursor={{ fill: 'transparent' }}
              formatter={(value) => `${value} min`}
            />
            
            <Bar dataKey="value" fill="#fde68a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer> */}
        <ResponsiveContainer width="100%" height={300}>
  <BarChart data={timeSpentData} barSize={30} barCategoryGap="20%">
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis tickFormatter={(value) => `${value}`} />
    {/* <Tooltip
      formatter={(value, name) =>
        name === "time_taken_minutes" ? `${value} min` : `${value} score`
      }
            /> */}
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
};

export default ChartSection;
