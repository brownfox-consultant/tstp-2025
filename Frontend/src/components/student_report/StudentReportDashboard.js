"use client";

import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";

import Header from "@/components/student_report/Header";
import PracticeDonut from "@/components/student_report/PracticeDonut";
import AccuracyChart from "@/components/student_report/AccuracyChart";
import TimeCompact from "@/components/student_report/TimeCompact";
import Heatmap from "@/components/student_report/Heatmap";
import TopicWiseReport from "@/components/student_report/TopicWiseReport";
import CourseDropdown from "@/components/student_report/CourseDropdown";
import TestTypeDropdown from "@/components/student_report/TestTypeDropdown";
import Tabs from "@/components/student_report/Tabs";

import { BASE_URL } from "@/app/constants/apiConstants";
import { useParams } from "next/navigation";
import { subjectColors } from "./data";
import Topic_Wise_Practice from "@/components/student_report/Topic_Wise_Practice";
import TopicAccuracy from "@/components/student_report/TopicAccuracy";
import SubTopicPracticeStyled from "@/components/student_report/SubTopicPracticeStyled";
import Math_Topic_Wise_Practice from "@/components/student_report/Math_Topic_Wise_Practice";
import Math_TopicAccuracy from "@/components/student_report/Math_TopicAccuracy";
import Math_SubTopicPracticeStyled from "@/components/student_report/Math_SubTopicPracticeStyled"
import Scoreboard from "@/components/student_report/Scoreboard";
import SelfPractice from "@/components/student_report/SelfPractice";
import StatusOfDoubts from "@/components/student_report/StatusOfDoubts";

import UtilisationOfResources from "@/components/student_report/UtilisationOfResources";
import PatternOfUsage from "@/components/student_report/PatternOfUsage";
// import DateWiseReport from "@/components/student_report/DateWiseReport";
import TopicWiseProgress from "@/components/student_report/TopicWiseProgress";
import ScoreAnalysis_FullLengthTest from "@/components/student_report/ScoreAnalysis_FullLengthTest";
import ScoreAnalysis_PracticeTest from "@/components/student_report/ScoreAnalysis_PracticeTest";


function StudentReportDashboard({ studentIdProp, studentNameProp, hideHeader }) {
  const [testType, setTestType] = useState("fullLength");
  const [activeReportTab, setActiveReportTab] = useState("score-analysis");

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [coursesList, setCoursesList] = useState([]);

  const [practiceData, setPracticeData] = useState([]);
  const [accuracyData, setAccuracyData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [dateWiseData, setDateWiseData] = useState([]);

  // Topic wise data for English and Math sections
  const [englishTopicData, setEnglishTopicData] = useState({ practice: [], accuracy: [], subtopic: [] });
  const [mathTopicData, setMathTopicData] = useState({ practice: [], accuracy: [], subtopic: [] });
  const [topicDataLoading, setTopicDataLoading] = useState(false);

  const params = useParams();
  const studentId = studentIdProp || params.id;

  // ============================
  // LOAD COURSES
  // ============================
  useEffect(() => {
    if (!studentId) return;

    async function loadCourses() {
      try {
        const res = await axios.get(
          `${BASE_URL}/api/course/student-courses/?user_id=${studentId}`,
          { withCredentials: true }
        );

        setCoursesList(res.data);

        // Auto-select first assigned course
        if (res.data.length > 0) {
          setSelectedCourse(res.data[0].id);
        }
      } catch (error) {
        console.error("Error fetching student courses:", error);
      }
    }

    loadCourses();
  }, [studentId]);

  const selectedCourseName = useMemo(() => {
    const course = coursesList.find(c => c.id == selectedCourse);
    return course ? course.name : "Course";
  }, [coursesList, selectedCourse]);

  // ============================
  // SUBJECT WISE PRACTICE
  // ============================
  useEffect(() => {
    if (!selectedCourse || !studentId) return;
    async function loadPractice() {
      try {
        const url = `${BASE_URL}/api/result/Subject_Wise_Practice/?student_id=${studentId}&course_id=${selectedCourse}&test_type=${testType}`;
        const res = await axios.get(url, { withCredentials: true });
        setPracticeData(res.data);
      } catch (error) {
        console.error("Error loading practice data:", error);
      }
    }
    loadPractice();
  }, [selectedCourse, testType, studentId]);

  // ============================
  // SUBJECT WISE ACCURACY
  // ============================
  useEffect(() => {
    if (!selectedCourse || !studentId) return;
    async function loadAccuracy() {
      try {
        const url = `${BASE_URL}/api/result/Subject_Wise_Accuracy/?student_id=${studentId}&course_id=${selectedCourse}&test_type=${testType}`;
        const res = await axios.get(url, { withCredentials: true });
        setAccuracyData(res.data);
      } catch (error) {
        console.error("Error loading accuracy data:", error);
      }
    }
    loadAccuracy();
  }, [selectedCourse, testType, studentId]);

  // ============================
  // SUBJECT WISE TIME
  // ============================
  useEffect(() => {
    if (!selectedCourse || !studentId) return;
    async function loadTime() {
      try {
        const url = `${BASE_URL}/api/result/Subject_Wise_Time/?student_id=${studentId}&course_id=${selectedCourse}&test_type=${testType}`;
        const res = await axios.get(url, { withCredentials: true });
        setTimeData(res.data);
      } catch (error) {
        console.error("Error loading time data:", error);
      }
    }
    loadTime();
  }, [selectedCourse, testType, studentId]);

  // ============================
  // DATE WISE TIME
  // ============================
  useEffect(() => {
    if (!selectedCourse || !studentId) return;
    async function loadDateWise() {
      try {
        const url = `${BASE_URL}/api/result/Date_Wise_Time/?student_id=${studentId}&course_id=${selectedCourse}&test_type=${testType}`;
        const res = await axios.get(url, { withCredentials: true });
        setDateWiseData(res.data);
      } catch (error) {
        console.error("Error loading date wise time:", error);
      }
    }
    loadDateWise();
  }, [selectedCourse, testType, studentId]);

  // ============================
  // TOPIC WISE DATA (FOR ENGLISH & MATH)
  // ============================
  useEffect(() => {
    if (!selectedCourse || !studentId) return;
    async function loadTopicData() {
      try {
        setTopicDataLoading(true);

        // Fetch Topic Wise Practice
        const practiceRes = await axios.get(
          `${BASE_URL}/api/result/Topic_Wise_Practice/?student_id=${studentId}&course_id=${selectedCourse}&test_type=${testType}`,
          { withCredentials: true }
        );

        // Fetch Topic Wise Accuracy
        const accuracyRes = await axios.get(
          `${BASE_URL}/api/result/Topic_Wise_Accuracy/?student_id=${studentId}&course_id=${selectedCourse}&test_type=${testType}`,
          { withCredentials: true }
        );

        // Fetch SubTopic Wise Practice
        const subtopicRes = await axios.get(
          `${BASE_URL}/api/result/SubTopic_Wise_Practice/?student_id=${studentId}&course_id=${selectedCourse}&test_type=${testType}`,
          { withCredentials: true }
        );

        // Extract English data
        const englishPractice = practiceRes.data.find(item => item.subject === "English")?.topics || [];
        const englishAccuracy = accuracyRes.data.find(s => s.subject?.toLowerCase() === "english")?.topics || [];
        const englishSubtopic = subtopicRes.data.find(s => s.subject?.toLowerCase() === "english")?.topics || [];

        // Extract Math data
        const mathPractice = practiceRes.data.find(item => item.subject === "Math")?.topics || [];
        const mathAccuracy = accuracyRes.data.find(s => s.subject?.toLowerCase() === "math")?.topics || [];
        const mathSubtopic = subtopicRes.data.find(s => s.subject?.toLowerCase() === "math")?.topics || [];

        setEnglishTopicData({ practice: englishPractice, accuracy: englishAccuracy, subtopic: englishSubtopic });
        setMathTopicData({ practice: mathPractice, accuracy: mathAccuracy, subtopic: mathSubtopic });
      } catch (error) {
        console.error("Error loading topic data:", error);
        setEnglishTopicData({ practice: [], accuracy: [], subtopic: [] });
        setMathTopicData({ practice: [], accuracy: [], subtopic: [] });
      } finally {
        setTopicDataLoading(false);
      }
    }
    loadTopicData();
  }, [selectedCourse, testType, studentId]);

  // Check if English has any meaningful data
  const hasEnglishData = useMemo(() => {
    const hasPractice = englishTopicData.practice.some(t => (t.practice_percent || 0) > 0);
    const hasAccuracy = englishTopicData.accuracy.some(t => (t.accuracy_percent || 0) > 0);
    const hasSubtopic = englishTopicData.subtopic.some(t =>
      t.subtopics?.some(s => (s.practiced_questions || 0) > 0 || (s.accuracy_percent || 0) > 0)
    );
    return hasPractice || hasAccuracy || hasSubtopic;
  }, [englishTopicData]);

  // Check if Math has any meaningful data
  const hasMathData = useMemo(() => {
    const hasPractice = mathTopicData.practice.some(t => (t.practice_percent || 0) > 0);
    const hasAccuracy = mathTopicData.accuracy.some(t => (t.accuracy_percent || 0) > 0);
    const hasSubtopic = mathTopicData.subtopic.some(t =>
      t.subtopics?.some(s => (s.practiced_questions || 0) > 0 || (s.accuracy_percent || 0) > 0)
    );
    return hasPractice || hasAccuracy || hasSubtopic;
  }, [mathTopicData]);

  // ============================
  // MEMO DATA
  // ============================
  const practice = useMemo(() => {
    return practiceData.map((item) => ({
      subject: item.subject,
      percent: Math.round(item.practice_percent),
      color: subjectColors[item.subject]?.practice || "#FFD36A",
    }));
  }, [practiceData]);

  const heatmapData = useMemo(() => {
    if (!dateWiseData || dateWiseData.length === 0) return [];
    return dateWiseData.map((item) => {
      const d = new Date(item.date);
      return {
        dayLabel: d.getDate().toString(),
        monthIndex: d.getMonth(),
        seconds: item.seconds,
      };
    });
  }, [dateWiseData]);

  const accuracy = useMemo(() => {
    return accuracyData.map((item) => ({
      subject: item.subject,
      value: Math.round(item.accuracy_percent),
      color: subjectColors[item.subject]?.accuracy || "#0071BC",
    }));
  }, [accuracyData]);

  const timeMetrics = useMemo(() => {
    return timeData.map((item) => ({
      subject: item.subject,
      avgSeconds: item.avg_time_seconds,
      totalSeconds: item.total_time_seconds,
      borderColor: subjectColors[item.subject]?.practice || "#999",
    }));
  }, [timeData]);

  return (
    <div className="dashboard-container">
      {!hideHeader && <Header studentName={studentNameProp} />}

      {/* INLINE DROPDOWNS - Course & Test Type */}
      <div className="w-full mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto">

          {/* COURSE CARD */}
          <div className="bg-gray-100 rounded-xl p-5 border-l-4 border-orange-400">
            <CourseDropdown
              coursesList={coursesList}
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
            />
          </div>

          {/* TEST TYPE CARD */}
          <div className="bg-gray-100 rounded-xl p-5 border-l-4 border-orange-400">
            <TestTypeDropdown
              testType={testType}
              setTestType={setTestType}
            />
          </div>

        </div>
      </div>

      {/* REPORT TYPE TABS */}
      <div className="w-full mb-6">
        <Tabs
          tabs={[
            { value: 'score-analysis', label: `${selectedCourseName} Score Analysis` },
            { value: 'subject', label: 'Subject Wise Report' },
            { value: 'english', label: 'English Topic Wise Report' },
            { value: 'math', label: 'Math Topic Wise Report' },
            { value: 'scoreboard', label: 'SCOREBOARD' },
            { value: 'resources', label: 'Utilisation of Resources' },
            { value: 'pattern', label: 'Pattern of Usage' },
            { value: 'doubts', label: 'Status of Doubts' },
            { value: 'topicwise-english', label: 'Topic Progress - English' },
            { value: 'topicwise-math', label: 'Topic Progress - Math' }
          ]}
          activeTab={activeReportTab}
          onChange={setActiveReportTab}
          variant="pills"
          className="report-tabs"
        />
      </div>


      {activeReportTab === "score-analysis" && (
        testType === "practiceTest" ? (
          <ScoreAnalysis_PracticeTest
            student_id={studentId}
            course_id={selectedCourse}
            courseName={selectedCourseName}
          />
        ) : (
          <ScoreAnalysis_FullLengthTest
            student_id={studentId}
            course_id={selectedCourse}
            courseName={selectedCourseName}
          />
        )
      )}

      {activeReportTab === "subject" && (
        <div className="grid grid-cols-2 gap-[25px] max-[1200px]:grid-cols-1">
          <PracticeDonut practice={practice} />
          <AccuracyChart accuracy={accuracy} />
          <TimeCompact timeMetrics={timeMetrics} />
          <Heatmap dateWise={heatmapData} />
        </div>
      )}


      {activeReportTab === "english" && (
        <>
          {topicDataLoading ? (
            <div className="py-20 text-center text-gray-500 text-lg">Loading...</div>
          ) : !hasEnglishData ? (
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-slate-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Data Available</h3>
              <p className="text-gray-500 text-sm max-w-md leading-relaxed">
                Start practicing English topics to see your topic-wise practice, accuracy, and sub-topic distribution here!
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-[25px] max-[1300px]:grid-cols-1">
                <Topic_Wise_Practice
                  student_id={studentId}
                  course_id={selectedCourse}
                  test_type={testType}
                  subject="English"
                />

                <TopicAccuracy
                  student_id={studentId}
                  course_id={selectedCourse}
                  test_type={testType}
                  subject="English"
                />
              </div>

              <div style={{ marginTop: "25px" }}>
                <SubTopicPracticeStyled
                  student_id={studentId}
                  course_id={selectedCourse}
                  test_type={testType}
                  subject="English"
                />
              </div>
            </>
          )}
        </>
      )}


      {activeReportTab === "math" && (
        <>
          {topicDataLoading ? (
            <div className="py-20 text-center text-gray-500 text-lg">Loading...</div>
          ) : !hasMathData ? (
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-slate-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Data Available</h3>
              <p className="text-gray-500 text-sm max-w-md leading-relaxed">
                Start practicing Math topics to see your topic-wise practice, accuracy, and sub-topic distribution here!
              </p>
            </div>
          ) : (
            <>
              {/* TOP ROW (2 COLUMNS) */}
              <div className="data-grid-v1">
                <Math_Topic_Wise_Practice
                  student_id={studentId}
                  course_id={selectedCourse}
                  test_type={testType}
                />
                <Math_TopicAccuracy
                  student_id={studentId}
                  course_id={selectedCourse}
                  test_type={testType}
                />
              </div>

              {/* FULL WIDTH BELOW */}
              <div style={{ marginTop: "25px" }}>
                <Math_SubTopicPracticeStyled
                  student_id={studentId}
                  course_id={selectedCourse}
                  test_type={testType}
                />
              </div>
            </>
          )}
        </>
      )}

      {activeReportTab === "scoreboard" && (
        testType === "practiceTest" ? <SelfPractice
          student_id={studentId}
          course_id={selectedCourse}
          test_type={testType}
        /> : <Scoreboard
          student_id={studentId}
          course_id={selectedCourse}
          test_type={testType}
        />
      )}

      {activeReportTab === "doubts" && (
        <StatusOfDoubts
          student_id={studentId}
          course_id={selectedCourse}
          test_type={testType}
        />
      )}

      {activeReportTab === "resources" && (
        <UtilisationOfResources
          student_id={studentId}
          course_id={selectedCourse}
          test_type={testType}
        />
      )}

      {activeReportTab === "pattern" && (
        <PatternOfUsage
          student_id={studentId}
          course_id={selectedCourse}
          test_type={testType}
        />
      )}

      {/* {activeReportTab === "datewise" && (
        <DateWiseReport />
      )} */}

      {activeReportTab === "topicwise-english" && (
        <TopicWiseProgress
          student_id={studentId}
          course_id={selectedCourse}
          subject="ENGLISH"
          test_type={testType}
        />

      )}

      {activeReportTab === "topicwise-math" && (
        <TopicWiseProgress
          student_id={studentId}
          course_id={selectedCourse}
          subject="MATH"
          test_type={testType}
        />
      )}

    </div>
  );
}

export default StudentReportDashboard;
