"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { BASE_URL } from "@/app/constants/apiConstants";

const GET_Subjects = (courseId) => `${BASE_URL}/api/course/${courseId}/subjects/`;

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const generateChartData = (labels, scores, marks, times) => {
  // Add times dataset
  return {
    labels,
    datasets: [
      {
        label: "Total Score",
        data: scores,
        backgroundColor: "rgba(125, 234, 9, 0.64)",
        borderRadius: 4,
        barThickness: 24,
      },
      {
        label: "Total Marks",
        data: marks,
        backgroundColor: "rgba(234, 179, 8, 0.7)",
        borderRadius: 4,
        barThickness: 24,
      },
      {
        label: "Total Time (min)",
        data: times,
        backgroundColor: "rgba(59, 130, 246, 0.7)", // blue
        borderRadius: 4,
        barThickness: 24,
      }
    ],
  };
};



const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 } },
    },
    y: {
      max: 1600,
      ticks: { stepSize: 300, font: { size: 10 } },
      grid: { color: "#E5E7EB" },
    },
  },
};

const ChartBlock = ({
  title,
  courses,
  selectedFilter,
  customStartDate,
  customEndDate,
  apiPath,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [subtopics, setSubtopics] = useState([]);
  const [selectedSubtopicId, setSelectedSubtopicId] = useState("");

  const [labels, setLabels] = useState([]);
  const [scores, setScores] = useState([]);
  const [marks, setMarks] = useState([]);
  const [times, setTimes] = useState([]);

 const fixExcelScore = (val) => {
  return val ? `\`${val}\`` : "";
};



  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      if (selectedCourseId) {
        try {
          const response = await axios.get(GET_Subjects(selectedCourseId), { withCredentials: true });
          setSubjects(response.data);
        } catch (error) {
          console.error("Error fetching subjects:", error);
          setSubjects([]);
        }
      } else {
        setSubjects([]);
      }
    };
    fetchSubjects();
  }, [selectedCourseId]);

  // Fetch topics
  useEffect(() => {
    const fetchTopics = async () => {
      if (selectedCourseId && selectedSubjectId) {
        try {
          const response = await axios.get(
            `${BASE_URL}/api/test/course/${selectedCourseId}/subjects/${selectedSubjectId}/topics/`,
            { withCredentials: true }
          );
          setTopics(response.data);
        } catch (error) {
          console.error("Error fetching topics:", error);
          setTopics([]);
        }
      } else {
        setTopics([]);
      }
      setSelectedTopicId("");
      setSelectedSubtopicId("");
      setSubtopics([]);
    };

    fetchTopics();
  }, [selectedSubjectId]);

  // Fetch subtopics
  useEffect(() => {
    const fetchSubtopics = async () => {
      if (selectedTopicId) {
        try {
          const response = await axios.get(
            `${BASE_URL}/api/test/topics/${selectedTopicId}/subtopics/`,
            { withCredentials: true }
          );
          setSubtopics(response.data);
        } catch (error) {
          console.error("Error fetching subtopics:", error);
          setSubtopics([]);
        }
      } else {
        setSubtopics([]);
      }
      setSelectedSubtopicId("");
    };

    fetchSubtopics();
  }, [selectedTopicId]);

  // Fetch scores
  useEffect(() => {
    const fetchScores = async () => {
      if (!selectedCourseId) return;

      let url = `${BASE_URL}${apiPath}?course_id=${selectedCourseId}`;
      if (selectedSubjectId) url += `&subject_id=${selectedSubjectId}`;
      if (selectedTopicId) url += `&topic_id=${selectedTopicId}`;
      if (selectedSubtopicId) url += `&subtopic_id=${selectedSubtopicId}`;
      if (selectedFilter) {
        url += `&date_range=${selectedFilter}`;
      } else if (customStartDate && customEndDate) {
        url += `&date_range=custom&start_date=${customStartDate}&end_date=${customEndDate}`;
      }

      try {
        const res = await axios.get(url, { withCredentials: true });
        const data = res.data || [];
        setLabels(data.map((item) => item.student));
        setScores(data.map((item) => item.total_score));
        setMarks(data.map((item) => item.total_marks));
        setTimes(data.map((item) => item.total_time)); // Add this

      } catch (error) {
        console.error(`Failed to fetch scores from ${apiPath}`, error);
      }
    };

    fetchScores();
  }, [
    selectedCourseId,
    selectedSubjectId,
    selectedTopicId,
    selectedSubtopicId,
    selectedFilter,
    customStartDate,
    customEndDate,
  ]);

const handleDownloadCSV = async () => {
  try {
    let url = "";
    let isFullLength = apiPath.includes("full-length");

    if (isFullLength) {
      url = `${BASE_URL}/api/test/full-length-scores-export/?date_range=${selectedFilter || "last_month"}`;
      if (selectedCourseId) url += `&course_id=${selectedCourseId}`;
    } else {
      url = `${BASE_URL}/api/practice/test-performance-report/?course_id=${selectedCourseId || ""}`;
      if (selectedFilter) {
        url += `&date_range=${selectedFilter}`;
      } else if (customStartDate && customEndDate) {
        url += `&date_range=custom&start_date=${customStartDate}&end_date=${customEndDate}`;
      } else {
        url += `&date_range=last_month`;
      }
    }

    const response = await axios.get(url, { withCredentials: true });
    const data = response.data;

    let csvContent = "";

    if (isFullLength) {
      const headers = [
        "Student",
        "Test Name",
        "Course",
        "Total Score",
        "Math Score",
        "Math Topic",
        "Math Correct",
        "English Score",
        "English Topic",
        "English Correct"
      ];
      csvContent += headers.join(",") + "\n";

      data.forEach(entry => {
        const mathTopics = entry.math_topics || [];
        const englishTopics = entry.english_topics || [];
        const maxRows = Math.max(mathTopics.length, englishTopics.length);

        for (let i = 0; i < maxRows; i++) {
          const row = [
            i === 0 ? entry.student : "",
            i === 0 ? entry.test_name : "",
            i === 0 ? entry.course : "",
            i === 0 ? (entry.math_score || 0) + (entry.english_score || 0) : "",
            i === 0 ? entry.math_score : "",
            mathTopics[i]?.topic || "",
            fixExcelScore(mathTopics[i]?.score),
            i === 0 ? entry.english_score : "",
            englishTopics[i]?.topic || "",
            fixExcelScore(englishTopics[i]?.score)
          ];
          csvContent += row.join(",") + "\n";
        }
      });

    } else {
      // 📌 Practice Test Export
      // 📌 Practice Test Export
const headers = [
  "Student",
  "Test Name",
  "Course",
  "Total Score",
  "Total Questions",
  "Attempted Questions",
  "Subjects",
  "Topic",
  "Correct Questions count"
];
csvContent += headers.join(",") + "\n";

data.forEach(entry => {
  if (Number(entry.attempted_questions) === 0) return;
  console.log("DEBUG ENTRY:", entry); 
  const cleanSubjectNames = [...new Set(entry.subject || [])].sort().join(" | ");
  const topics = entry.topic || [];

  if (topics.length === 0) {
    csvContent += [
      entry.student,
      entry.test_name,
      entry.course,
      fixExcelScore(entry.total_score),
      entry.total_questions,
      entry.attempted_questions,
      cleanSubjectNames,
      "",
      ""
    ].join(",") + "\n";
  } else {
    topics.forEach((topicEntry, i) => {
      csvContent += [
        i === 0 ? entry.student : "",
        i === 0 ? entry.test_name : "",
        i === 0 ? entry.course : "",
        i === 0 ? fixExcelScore(entry.total_score) : "",
        i === 0 ? entry.total_questions : "",
        i === 0 ? entry.attempted_questions : "",
        i === 0 ? cleanSubjectNames : "",
        topicEntry.topic || "",
        fixExcelScore(topicEntry.score)
      ].join(",") + "\n";
    });
  }
});

    }

    // 📥 Trigger download
    const encodedUri = encodeURI("data:text/csv;charset=utf-8,\uFEFF" + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", isFullLength ? "full_length_scores.csv" : "practice_test_scores.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Download error:", error);
    alert("Failed to export CSV.");
  }
};








  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 w-full">
      <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
        <h2 className="text-lg font-bold text-black">{title}</h2>
        <div className="flex flex-wrap gap-2 items-center justify-end">
          <div className="flex gap-2">
            <select
              className="border border-gray-300 px-2 py-1 text-sm rounded-md text-gray-700"
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedSubjectId("");
              }}
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>

            <select
              className="border border-gray-300 px-2 py-1 text-sm rounded-md text-gray-700"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={!subjects.length}
            >
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>

            <select
              className="border border-gray-300 px-2 py-1 text-sm rounded-md text-gray-700"
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              disabled={!topics.length}
            >
              <option value="">Select Topic</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>

            <select
              className="border border-gray-300 px-2 py-1 text-sm rounded-md text-gray-700"
              value={selectedSubtopicId}
              onChange={(e) => setSelectedSubtopicId(e.target.value)}
              disabled={!subtopics.length}
            >
              <option value="">Select Subtopic</option>
              {subtopics.map((subtopic) => (
                <option key={subtopic.id} value={subtopic.id}>
                  {subtopic.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="border border-gray-300 px-3 py-1 text-sm rounded-md text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDownloadCSV}
           // disabled={!labels.length || !scores.length}
          >
            Download
          </button>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <Bar data={generateChartData(labels, scores, marks, times)} options={chartOptions} />


      </div>

      <div className="flex gap-4 mt-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-400 rounded-full inline-block"></span> &gt;1450
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-orange-300 rounded-full inline-block"></span> &gt;1250
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-400 rounded-full inline-block"></span> &lt;1250
        </div>
      </div>
    </div>
  );
};

export default ChartBlock;
