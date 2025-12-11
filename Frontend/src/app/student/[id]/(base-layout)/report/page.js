"use client";

import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";

import Header from "@/components/student_report/Header";
import Tabs from "@/components/student_report/Tabs";
import PracticeDonut from "@/components/student_report/PracticeDonut";
import AccuracyChart from "@/components/student_report/AccuracyChart";
import TimeCompact from "@/components/student_report/TimeCompact";
import Heatmap from "@/components/student_report/Heatmap";
import TabsCourses from "@/components/student_report/TabsCourses";
import TopicWiseReport from "@/components/student_report/TopicWiseReport";

import { BASE_URL } from "@/app/constants/apiConstants";
import { useParams } from "next/navigation";
import { subjectColors } from "./data";
import Topic_Wise_Practice from "@/components/student_report/Topic_Wise_Practice";
import TopicAccuracyDummy from "@/components/student_report/TopicAccuracyDummy";
import SubTopicPracticeStyled from "@/components/student_report/SubTopicPracticeStyled"




function Dashboard() {
  const [testType, setTestType] = useState("fullLength");
  const [activeReportTab, setActiveReportTab] = useState("subject");

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

  // ============================
  // RENDER
  // ============================
  return (
    <div className="dashboard-container">
      <Header />

      <TabsCourses
        courses={coursesList}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
      />

      <Tabs
        testType={testType}
        setTestType={setTestType}
        activeReportTab={activeReportTab}
        setActiveReportTab={setActiveReportTab}
      />

      {activeReportTab === "subject" && (
        <div className="data-grid-v2">
          <PracticeDonut practice={practice} />
          <AccuracyChart accuracy={accuracy} />
          <TimeCompact timeMetrics={timeMetrics} />
          <Heatmap dateWise={heatmapData} />
        </div>
      )}

      {/* {activeReportTab === "english" && (
        // <TopicWiseReport
        //   practice={practice}
        //   accuracy={accuracy}
        //   timeMetrics={timeMetrics}
        //   heatmapData={heatmapData}
        // />
        <div className="data-grid-v1">
  <Topic_Wise_Practice/>
  <TopicAccuracyDummy />
</div>

<div style={{ marginTop: "25px" }}>
  <SubTopicPracticeStyled/>
</div>

           
           
        
      )} */}

      {activeReportTab === "english" && (
  <>
    {/* TOP ROW (2 COLUMNS) */}
    <div className="data-grid-v1">
      <Topic_Wise_Practice />
      <TopicAccuracyDummy />
    </div>

    {/* FULL WIDTH BELOW */}
    <div style={{ marginTop: "25px" }}>
      <SubTopicPracticeStyled />
    </div>
  </>
)}

    </div>
  );
}

export default Dashboard;
