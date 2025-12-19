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
import Math_SubTopicPractice from "@/components/student_report/Math_SubTopicPractice"
import Scoreboard from "@/components/student_report/Scoreboard";
import SelfPractice from "@/components/student_report/SelfPractice";
import StatusOfDoubts from "@/components/student_report/StatusOfDoubts";

import UtilisationOfResources from "@/components/student_report/UtilisationOfResources";
import PatternOfUsage from "@/components/student_report/PatternOfUsage";
// import DateWiseReport from "@/components/student_report/DateWiseReport";
import TopicWiseProgress from "@/components/student_report/TopicWiseProgress";
import ScoreAnalysis from "@/components/student_report/ScoreAnalysis";




function Dashboard() {
  const [testType, setTestType] = useState("fullLength");
  const [activeReportTab, setActiveReportTab] = useState("score-analysis");

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [coursesList, setCoursesList] = useState([]);

  const [practiceData, setPracticeData] = useState([]);
  const [accuracyData, setAccuracyData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [dateWiseData, setDateWiseData] = useState([]);

  const params = useParams();
  const studentId = params.id;

  // ============================
  // LOAD COURSES
  // ============================
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await axios.get(`${BASE_URL}/api/course/list/`, {
          withCredentials: true,
        });
        setCoursesList(res.data);
        if (res.data.length > 0) {
          setSelectedCourse(res.data[0].id);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    }
    loadCourses();
  }, []);

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
      <Header />

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
        <ScoreAnalysis
          student_id={studentId}
              course_id={selectedCourse}
              test_type={testType}
        courseName={selectedCourseName} />
      )}

      {activeReportTab === "subject" && (
        <div className="grid grid-cols-2 gap-[25px] max-[1200px]:grid-cols-1">
          <PracticeDonut practice={practice} />
          <AccuracyChart accuracy={accuracy} />
          <TimeCompact timeMetrics={timeMetrics} />
          <Heatmap dateWise={heatmapData} />
        </div>
      )}

      {/* {activeReportTab === "english" && (
        <>
          <TopicWiseReport
            practice={practice}
            accuracy={accuracy}
            timeMetrics={timeMetrics}
            heatmapData={heatmapData}
          />
          <div className="data-grid-v1">
            <Topic_Wise_Practice />
            <TopicAccuracyDummy />
          </div>

          <div style={{ marginTop: "25px" }}>
            <SubTopicPracticeStyled />
          </div>
        </>
      )} */}

      {activeReportTab === "english" && (
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


      {activeReportTab === "math" && (
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
            <Math_SubTopicPractice
              student_id={studentId}
              course_id={selectedCourse}
              test_type={testType}
            />

          </div>
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

      {activeReportTab === "datewise" && (
        <DateWiseReport />
      )}

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

export default Dashboard;
