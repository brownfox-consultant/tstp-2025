'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { usePathname, useRouter } from 'next/navigation';
import Select from 'react-select';
import { Col, Row } from 'antd';
import { BASE_URL, GET_Courses } from '@/app/constants/apiConstants';
import { getDashboardStats } from '@/app/services/authService';
import { getTestsPerDay } from "@/app/services/authService";




const GET_Subjects = (courseId) => `${BASE_URL}/api/course/${courseId}/subjects/`;
const CustomLegend = ({ payload }) => (
  <div className="flex justify-between items-center w-full mb-4">
    <div className="flex flex-row">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center ml-4">
          <div className="w-4 h-4 rounded-md" style={{ backgroundColor: entry.color }}></div>
          <span className="ml-2">
            {entry.value === 'fullLengthTest' ? 'Full Length Test' : 'Practice Test'}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default function Dashbord() {
  const pathname = usePathname();
  const router = useRouter();
  const parentId = pathname.split('/')[2];

  // === Student & Stats ===
  const [studentId, setStudentId] = useState();
  const [selectedRange, setSelectedRange] = useState('last_month');
  const [stats, setStats] = useState([]);

  // === Time Spent ===
  const [timeSpentData, setTimeSpentData] = useState([]);

  // === Tests & Their Scores (dynamic) ===
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedCourseForScores, setSelectedCourseForScores] = useState(null);
  const [selectedSubjectForScores, setSelectedSubjectForScores] = useState(null);
  const [testScoresData, setTestScoresData] = useState([]);

  const [selectedCourseForTime, setSelectedCourseForTime] = useState(null);
  const [selectedSubjectForTime, setSelectedSubjectForTime] = useState(null);
  const [subjectsForTime, setSubjectsForTime] = useState([]);

  const [selectedCourseForLine, setSelectedCourseForLine] = useState(null);
  const [selectedSubjectForLine, setSelectedSubjectForLine] = useState(null);
  const [subjectsForLine, setSubjectsForLine] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);
  const [fullVsPracticeData, setFullVsPracticeData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [areasOfFocus, setAreasOfFocus] = useState([]);
  const [keyStrengths, setKeyStrengths] = useState([]);

  const [topics, setTopics] = useState([]);
const [selectedTopic, setSelectedTopic] = useState(null);
const [subtopics, setSubtopics] = useState([]);
const [selectedSubtopic, setSelectedSubtopic] = useState(null);





  // === Line + Area Chart (static for now) ===
  const [activeType, setActiveType] = useState('fullLengthTest');
  

  // === Full vs Practice Stacked Bar (static) ===
 

  // === Strengths & Weaknesses (static) ===
  const dummyKeyStrengths = [
    { name: 'Algebra', percent: 70 },
    { name: 'Problem Solving', percent: 85 },
    { name: 'Strategies', percent: 90 },
  ];
  const dummyWeaknesses = [
    { name: 'Reading', percent: 34 },
    { name: 'Writing', percent: 32 },
    { name: 'Objective', percent: 30 },
  ];
  
  useEffect(() => {
  axios
    .get(GET_Courses, { withCredentials: true })
    .then((res) => {
      setCourses(res.data);
      if (res.data.length > 0 && !selectedCourseForScores) {
        setSelectedCourseForScores(res.data[0].id); // default select first course for scores
      }
      if (res.data.length > 0 && !selectedCourseForTime) {
        setSelectedCourseForTime(res.data[0].id); // default select first course for time
      }
      if (res.data.length > 0 && !selectedCourseForLine) {
        setSelectedCourseForLine(res.data[0].id); // default select first course for line chart
      }
    })
    .catch((err) => console.error('Courses fetch error:', err));
}, []);

    useEffect(() => {
  if (!selectedCourseForScores || !selectedSubjectForScores) {
    setTopics([]);
    setSelectedTopic(null);
    return;
  }

  axios
    .get(`${BASE_URL}/api/test/course/${selectedCourseForScores}/subjects/${selectedSubjectForScores}/topics/`, { withCredentials: true })
    .then((res) => setTopics(res.data))
    .catch((err) => {
      console.error('Topics fetch error:', err);
      setTopics([]);
    });
}, [selectedCourseForScores, selectedSubjectForScores]);

  
  useEffect(() => {
  if (!selectedTopic) {
    setSubtopics([]);
    setSelectedSubtopic(null);
    return;
  }

  axios
    .get(`${BASE_URL}/api/test/topics/${selectedTopic}/subtopics/`, { withCredentials: true })
    .then((res) => setSubtopics(res.data))
    .catch((err) => {
      console.error('Subtopics fetch error:', err);
      setSubtopics([]);
    });
}, [selectedTopic]);

  
  useEffect(() => {
  if (!selectedCourseForScores) {
    setSubjects([]);
    setSelectedSubjectForScores(null);
    setTestScoresData([]);
    return;
  }
  axios
    .get(GET_Subjects(selectedCourseForScores), { withCredentials: true })
    .then((res) => {
      setSubjects(res.data);
      if (res.data.length > 0 && !selectedSubjectForScores) {
        setSelectedSubjectForScores(res.data[0].id);
      }
    })
    .catch((err) => {
      console.error('Subjects fetch error:', err);
      setSubjects([]);
    });
}, [selectedCourseForScores]);



useEffect(() => {
  if (!studentId) return;

  const params = {
    student_id: studentId,
    date_range: selectedRange,
  };

  axios
    .get(`${BASE_URL}/api/test/topic-scores/`, {
      params,
      withCredentials: true,
    })
    .then((res) => {
      const allowedTopics = [
        'Problem Solving and Data Analysis',
        'Expression of Ideas',
        'Advance Algebra'
      ];

      const filteredStrengths = res.data
        .filter((item) => allowedTopics.includes(item.area))
        .map((item) => ({
          name: item.area,
          percent: item.score,
        }));

      setKeyStrengths(filteredStrengths);
    })
    .catch((err) => {
      console.error('Failed to fetch topic scores:', err);
      setKeyStrengths([]);
    });
}, [studentId, selectedRange]);



  useEffect(() => {
  if (!studentId) return;

  const params = {
    student_id: studentId,
    date_range: selectedRange,
  };

  axios
    .get(`${BASE_URL}/api/test/user-areas/`, {
      params,
      withCredentials: true,
    })
    .then((res) => {
      const focus = res.data.areas_of_focus;
      const formattedFocus = Object.keys(focus).map((key) => ({
        name: key,
        percent: focus[key].percentage,
      }));
      setAreasOfFocus(formattedFocus);
    })
    .catch((err) => {
      console.error('Failed to fetch user areas:', err);
      setAreasOfFocus([]);
    });
}, [studentId, selectedRange]);


useEffect(() => {
  if (!studentId) return;

  const params = selectedRange === 'custom' && startDate && endDate
    ? { date_range: 'custom', start_date: startDate, end_date: endDate, student_id: studentId }
    : { date_range: selectedRange, student_id: studentId };

  getTestsPerDay(params).then((res) => {
    setFullVsPracticeData(res.data);
  });
}, [selectedRange, startDate, endDate, studentId]);





  useEffect(() => {
  if (
    !studentId ||
    !selectedCourseForLine ||
    !selectedSubjectForLine ||
    !activeType
  ) {
    setLineChartData([]);
    return;
  }

  const url = `${BASE_URL}/api/test/test-time-series/?student_id=${studentId}&course_id=${selectedCourseForLine}&subject_id=${selectedSubjectForLine}&test_type=${activeType}&date_range=${selectedRange}`;

 axios
  .get(url, { withCredentials: true })
  .then((res) => {
    let data = res.data;

    if (data.length === 1) {
      const single = data[0];
      data = [
        { date: '', minutes: 0 },
        single,
        { date: '', minutes: 0 },
      ];
    }

    setLineChartData(data); // ✅ Use modified `data`
  })

    .catch((err) => {
      console.error("Line chart data fetch error:", err);
      setLineChartData([]);
    });
}, [studentId, selectedCourseForLine, selectedSubjectForLine, activeType, selectedRange]);


 useEffect(() => {
  if (!selectedCourseForLine) {
    setSubjectsForLine([]);
    setSelectedSubjectForLine(null);
    return;
  }

  axios
    .get(GET_Subjects(selectedCourseForLine), { withCredentials: true })
    .then((res) => {
      setSubjectsForLine(res.data);
      if (res.data.length > 0 && !selectedSubjectForLine) {
        setSelectedSubjectForLine(res.data[0].id);
      }
    })
    .catch((err) => {
      console.error('Subjects fetch error (Line Chart):', err);
      setSubjectsForLine([]);
    });
}, [selectedCourseForLine]);



  useEffect(() => {
  if (!selectedCourseForTime) {
    setSubjectsForTime([]);
    setSelectedSubjectForTime(null);
    return;
  }

  axios
    .get(GET_Subjects(selectedCourseForTime), { withCredentials: true })
    .then((res) => {
      setSubjectsForTime(res.data);
      if (res.data.length > 0 && !selectedSubjectForTime) {
        setSelectedSubjectForTime(res.data[0].id);
      }
    })
    .catch((err) => {
      console.error('Subjects fetch error:', err);
      setSubjectsForTime([]);
    });
}, [selectedCourseForTime]);


  // ─── Fetch Student ID ──────────────────────────────────────────
  useEffect(() => {
    const fetchStudent = async () => {
      if (!parentId) return;
      try {
        const { data } = await axios.get(
          `${BASE_URL}/api/test/parentid_to_studentid/?parent_id=${parentId}`,
          { withCredentials: true }
        );
        setStudentId(data.studentid?.[0] ?? null);
      } catch (err) {
        console.error('Failed to fetch student ID:', err);
      }
    };
    fetchStudent();
  }, [parentId]);

  // ─── Fetch Dashboard Stats ────────────────────────────────────
  useEffect(() => {
    if (studentId === undefined) return;
    const params = { date_range: selectedRange };
    if (studentId) params.student_id = studentId;
    getDashboardStats(params)
      .then((res) => {
        setStats([
          {
            title: 'Full length tests',
            count: res.data.full_length_tests.count,
            result: res.data.full_length_tests.change_percentage,
          },
          {
            title: 'Practice Questions',
            count: res.data.practice_tests.count,
            result: res.data.practice_tests.change_percentage,
          },
          {
            title: 'Avg score of all the tests',
            count: res.data.overall_average_percentage.average_percentage,
            result: res.data.overall_average_percentage.change_percentage,
          },
        ]);
      })
      .catch((err) => console.error('Stats error:', err));
  }, [studentId, selectedRange]);

  // ─── Fetch Time Spent ─────────────────────────────────────────
  useEffect(() => {
 if (!parentId || !selectedCourseForTime) return;

  let url = `${BASE_URL}/api/test/course-wise-time/?student_id=${studentId}&date_range=${selectedRange}`;
  if (selectedCourseForTime) url += `&course_id=${selectedCourseForTime}`;
  if (selectedSubjectForTime) url += `&subject_id=${selectedSubjectForTime}`;

  axios
    .get(url, { withCredentials: true })
    .then((res) => {
      const formatted = res.data.map((item) => ({
          name: item.test_name || item.course,
          time_taken_minutes: item.time_taken_minutes || 0,
          score: item.score || 0,
        }));
        setTimeSpentData(formatted);
      
    })
    .catch((err) => console.error('Time Spent fetch error:', err));
}, [parentId, selectedCourseForTime, selectedSubjectForTime, selectedRange]);



  // ─── Courses & Subjects for “Tests & Their Scores” ────────────
  useEffect(() => {
    axios
      .get(GET_Courses, { withCredentials: true })
      .then((res) => setCourses(res.data))
      .catch((err) => console.error('Courses fetch error:', err));
  }, []);

  useEffect(() => {
    if (!selectedCourseForScores) {
      setSubjects([]);
      setSelectedSubjectForScores(null);
      setTestScoresData([]);
      return;
    }
    axios
      .get(GET_Subjects(selectedCourseForScores), { withCredentials: true })
      .then((res) => setSubjects(res.data))
      .catch((err) => {
        console.error('Subjects fetch error:', err);
        setSubjects([]);
      });
  }, [selectedCourseForScores]);

  // ─── Fetch “Tests & Their Scores” ────────────────────────────

useEffect(() => {
  if (!studentId || !selectedCourseForScores || !selectedSubjectForScores) {
    setTestScoresData([]);
    return;
  }

  let url = `${BASE_URL}/api/test/student-test-scores/?student_id=${studentId}&course_id=${selectedCourseForScores}&subject_id=${selectedSubjectForScores}&date_range=${selectedRange}`;
  
  if (selectedTopic) {
    url += `&topic_id=${selectedTopic}`;
  }
  if (selectedSubtopic) {
    url += `&subtopic_id=${selectedSubtopic}`;
  }

  axios
    .get(url, { withCredentials: true })
    .then((res) => {
      setTestScoresData(
        res.data.map((item) => ({
          test: item.test_name,
          score: item.score,
        }))
      );
    })
    .catch((err) => console.error('Test Scores fetch error:', err));
}, [studentId, selectedCourseForScores, selectedSubjectForScores, selectedRange, selectedTopic, selectedSubtopic]);




  return (
    <div className="p-6 space-y-6  min-h-screen">
      {/* ─── Date Range Buttons ───────────────────────────────────── */}
      <div className="flex space-x-2 mb-4">
        {['last_six_month','last_month', 'last_week', 'today'].map((range) => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`px-4 py-1 rounded-md text-sm font-medium ${
              selectedRange === range ? 'bg-black text-white' : 'bg-gray-100 text-black'
            }`}
          >
            {range.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* ─── Dashboard Stats ──────────────────────────────────────── */}
      <div  >
        <Row gutter={[16, 16]}>
          {stats.map((stat, i) => (
            <Col xs={24} sm={12} md={8} key={i}>
              <div className="border bg-white border-gray-300 rounded-lg p-5 bg-white p-6 rounded-xl shadow-md w-full">
                <div className="flex justify-between items-center mb-8">
  <span className="text-base font-semibold">{stat.title}</span>
  {stat.title === "Full length tests" && (
    <button
      onClick={() => router.push(`/parent/${parentId}/test`)}
      className="text-xs text-orange-500 font-medium"
    >
      View all
    </button>
  )}
</div>
                <div className="flex justify-between items-center text-2xl mb-2">
                  <div className="text-left font-bold">{stat.count}</div>
                  <div className="text-gray-500 text-sm ml-auto font-semibold">
                    Result{' '}
                    <span
                      className={`px-2 py-1 rounded-full font-bold ${
                        stat.result > 0 ? 'text-green-500 bg-green-50' : 'text-red-400 bg-red-50'
                      }`}
                    >
                      {stat.result > 0 ? '↑' : '↓'} {Math.abs(stat.result)}%
                    </span>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* ─── Time Spent on Course ──────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5  ">
         <div className="flex flex-wrap justify-between items-center mb-4">
    <h3 className="text-xl font-semibold text-gray-800">
      Time Spent on Course and Score
    </h3>
    <div className="flex gap-4 flex-wrap">
      <div className="w-64 text-sm">
        <Select
          placeholder="Select Course"
          options={courses.map((c) => ({ label: c.name, value: c.id }))}
          value={
            selectedCourseForTime
              ? { label: courses.find((c) => c.id === selectedCourseForTime)?.name, value: selectedCourseForTime }
              : null
          }
          onChange={(opt) => setSelectedCourseForTime(opt?.value || null)}
          isClearable
        />
      </div>
      {/* <div className="w-64 text-sm">
        <Select
          placeholder="Select Subject"
          options={subjectsForTime.map((s) => ({ label: s.name, value: s.id }))}
          value={
            selectedSubjectForTime
              ? { label: subjectsForTime.find((s) => s.id === selectedSubjectForTime)?.name, value: selectedSubjectForTime }
              : null
          }
          onChange={(opt) => setSelectedSubjectForTime(opt?.value || null)}
          isClearable
          isDisabled={!selectedCourseForTime}
        />
            </div> */}
            
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

      {/* ─── Tests and Their Scores ───────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
        <div className="flex justify-between flex-wrap items-center mb-4">
          <h2 className="text-xl font-semibold">Test Scores</h2>
          <div className="flex gap-4 flex-wrap">
            <div className="w-64 text-sm">
              <Select
                placeholder="Select Course"
                options={courses.map((c) => ({ label: c.name, value: c.id }))}
                value={
                  selectedCourseForScores
                    ? { label: courses.find((c) => c.id === selectedCourseForScores).name, value: selectedCourseForScores }
                    : null
                }
                onChange={(opt) => setSelectedCourseForScores(opt?.value || null)}
                isClearable
              />
            </div>
            <div className="w-64 text-sm">
              <Select
                placeholder="Select Subject"
                options={subjects.map((s) => ({ label: s.name, value: s.id }))}
                value={
                  selectedSubjectForScores
                    ? { label: subjects.find((s) => s.id === selectedSubjectForScores).name, value: selectedSubjectForScores }
                    : null
                }
                onChange={(opt) => setSelectedSubjectForScores(opt?.value || null)}
                isClearable
                isDisabled={!selectedCourseForScores}
              />
            </div>

              <div className="w-64 text-sm">
  <Select
    placeholder="Select Topic"
    options={topics.map((t) => ({ label: t.name, value: t.id }))}
    value={selectedTopic ? { label: topics.find((t) => t.id === selectedTopic)?.name, value: selectedTopic } : null}
    onChange={(opt) => setSelectedTopic(opt?.value || null)}
    isClearable
  />
</div>

<div className="w-64 text-sm">
  <Select
    placeholder="Select Subtopic"
    options={subtopics.map((s) => ({ label: s.name, value: s.id }))}
    value={selectedSubtopic ? { label: subtopics.find((s) => s.id === selectedSubtopic)?.name, value: selectedSubtopic } : null}
    onChange={(opt) => setSelectedSubtopic(opt?.value || null)}
    isClearable
    isDisabled={!selectedTopic}
  />
</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={testScoresData} barSize={40} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="test" />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}`} />
                              <Tooltip
  trigger="hover"
  shared={false}
  cursor={{ fill: 'transparent' }}
  formatter={(value) => `${value}`}
/>
            <Legend />
            <Bar dataKey="score" fill="#fbbf24" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ─── Line + Area Chart ────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
  <div className="flex gap-2">
    <button
      className={`px-4 py-1 rounded-md text-sm font-medium ${activeType === 'fullLengthTest' ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}
      onClick={() => setActiveType('fullLengthTest')}
    >
      Full length test
    </button>
    <button
      className={`px-4 py-1 rounded-md text-sm font-medium ${activeType === 'practiceTest' ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}
      onClick={() => setActiveType('practiceTest')}
    >
      Practice Questions
    </button>
  </div>
  <div className="flex gap-4">
    <div className="w-64 text-sm">
      <Select
        placeholder="Select Course"
        options={courses.map((c) => ({ label: c.name, value: c.id }))}
        value={
          selectedCourseForLine
            ? { label: courses.find((c) => c.id === selectedCourseForLine)?.name, value: selectedCourseForLine }
            : null
        }
        onChange={(opt) => setSelectedCourseForLine(opt?.value || null)}
        isClearable
      />
            </div>
            
    <div className="w-64 text-sm">
      <Select
        placeholder="Select Subject"
        options={subjectsForLine.map((s) => ({ label: s.name, value: s.id }))}
        value={
          selectedSubjectForLine
            ? { label: subjectsForLine.find((s) => s.id === selectedSubjectForLine)?.name, value: selectedSubjectForLine }
            : null
        }
        onChange={(opt) => setSelectedSubjectForLine(opt?.value || null)}
        isClearable
        isDisabled={!selectedCourseForLine}
      />
            </div>
            
          

  </div>
</div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={lineChartData}>

            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'In minutes', angle: -90, position: 'insideLeft' }} />
                             <Tooltip
  trigger="hover"
  shared={false}
  cursor={{ fill: 'transparent' }}
  formatter={(value) => `${value}`}
/>
           <Area
  type="monotone"
  dataKey="minutes"
  stroke="#FFA726"
  fill="#FFF3E0"
  strokeWidth={2}
/>

          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ─── Full Length vs Practice Test ────────────────────────── */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
        <h3 className="text-xl font-semibold mb-4">Full Length vs Practice Questions</h3>
        <ResponsiveContainer width="100%" height={320}>
  <BarChart data={fullVsPracticeData} barCategoryGap="20%" barSize={50}>
    <CartesianGrid vertical={false} horizontal={true} stroke="#E0E0E0" />
    <XAxis dataKey="date" axisLine={false} />
    <YAxis domain={[0, 100]} axisLine={false} tickFormatter={(t) => `${t}`} />
    <Tooltip
      trigger="hover"
      shared={false}
      cursor={{ fill: 'transparent' }}
      formatter={(value) => `${value}`}
    />
    <Legend content={<CustomLegend />} verticalAlign="top" align="right" />
    <Bar dataKey="fullLengthTest" stackId="a" fill="#FFB74D" />
    <Bar dataKey="practiceTest" stackId="a" fill="#FFE0B2" />
  </BarChart>
</ResponsiveContainer>

      </div>

      {/* ─── Strengths & Weaknesses ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
  <h3 className="text-lg font-semibold mb-4">Key Strengths</h3>
  {keyStrengths.length > 0 ? (
    keyStrengths.map((item, i) => (
      <div key={i} className="mb-4">
        <div className="flex justify-between mb-1 text-sm text-gray-600">
          <span>{item.name}</span>
          <span>{item.percent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-500 h-2.5 rounded-full"
            style={{ width: `${item.percent}%` }}
          />
        </div>
      </div>
    ))
  ) : (
    <p className="text-sm text-gray-500">No key strengths found.</p>
  )}
</div>

       <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
  <h3 className="text-lg font-semibold mb-4">Areas for Improvement</h3>
  {areasOfFocus.length > 0 ? (
    areasOfFocus.map((item, i) => (
      <div key={i} className="mb-4">
        <div className="flex justify-between mb-1 text-sm text-gray-600">
          <span>{item.name}</span>
          <span>{item.percent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-red-500 h-2.5 rounded-full"
            style={{ width: `${item.percent}%` }}
          />
        </div>
      </div>
    ))
  ) : (
    <p className="text-sm text-gray-500">No areas of improvement found.</p>
  )}
</div>

      </div>
    </div>
  );
}
