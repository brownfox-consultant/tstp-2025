import './ReportNew.css';
import { getTestResult } from "@/app/services/authService";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter,useParams } from "next/navigation";
import { LeftOutlined } from "@ant-design/icons";
import CurrentTab_New from "./CurrentTab_New";
import ReportTable from "./report-table";

const ReportNew = ({ testSubmissionId,onClose  }) => {
  const [activeTab, setActiveTab] = useState("english");
  const [questionMainTab, setQuestionMainTab] = useState("english");
  const [englishSubTab, setEnglishSubTab] = useState("sectionA");
  const [resultData, setResultData] = useState({});
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const test_submission_id = searchParams.get("test_submission_id");
  const router = useRouter();
  const availableSubjects = resultData?.subjects?.map(s => s.name.toLowerCase()) || [];
  const tabs = [...availableSubjects, "questions"];
    

  const questionItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 15px",
    marginBottom: "10px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
  };

  useEffect(() => {
    setLoading(true);
    getTestResult({
      test_submission_id: testSubmissionId || test_submission_id,
    }).then((res) => {
      setResultData(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (activeTab === "questions" && resultData?.subjects?.length > 0) {
      const defaultSubject = resultData.subjects[0];
      setQuestionMainTab(defaultSubject.name);
      const defaultSection = defaultSubject.sections?.[0]?.name || "";
      setEnglishSubTab(defaultSection);
    }
  }, [activeTab, resultData]);

  const mergeAreasOfFocus = (subjectName) => {
    const subject = resultData?.subjects?.find((s) => s.name === subjectName);
    const combined = {};
    subject?.sections?.forEach((section) => {
      const focus = section.areas_of_focus || {};
      Object.entries(focus).forEach(([topic, data]) => {
        if (!combined[topic]) {
          combined[topic] = { correct: 0, incorrect: 0 };
        }
        combined[topic].correct += data.correct_count || 0;
        combined[topic].incorrect += data.incorrect_count || 0;
      });
    });
    return Object.entries(combined).map(([topic, { correct, incorrect }]) => {
      const total = correct + incorrect;
      const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
      const badge = percentage >= 60 ? "green" : "red";
      const label = percentage >= 60 ? "Strong" : "Needs Improvement";
      return { topic, score: `${correct}/${total}`, percentage, badge, label };
    });
  };

  const renderTopicWisePerformance = (subject) => {
    const topics = mergeAreasOfFocus(subject);
    // return (
    //   <div className="card-section">
    //     <h3>Topic-wise Performance</h3>
    //     {topics.length > 0 ? (
    //       topics.map((topic, idx) => (
    //         <div className="bar-item" key={idx}>
    //           <div className="label">
    //             <span>{topic.topic}</span>
    //             <span className={`badge ${topic.badge}`}>{topic.score}</span>
    //           </div>
    //           <div className="bar-bg">
    //             <div className="bar-fill" style={{ width: `${topic.percentage}%` }} />
    //           </div>
    //         </div>
    //       ))
    //     ) : (
    //       <p style={{ padding: "10px" }}>No topic data available.</p>
    //     )}
    //   </div>
    // );
  };

  const renderFocusAreas = (subject) => {
    const topics = mergeAreasOfFocus(subject);
    const strong = topics.filter((t) => t.badge === "green");
    const weak = topics.filter((t) => t.badge === "red");

    return (
      <div className="focus-card">
        {/* <h3>{subject} Focus Areas</h3> */}
        {/* <div className="focus-areas">
          <div className="left">
            <h4 className="red">Needs Improvement</h4>
            <div className="tag-group">
              {weak.map((t, idx) => (
                <span key={idx} className="tag red-tag">
                  {t.topic} ({t.percentage}%)
                </span>
              ))}
            </div>
          </div>
          <div className="right">
            <h4 className="green">Strong Areas</h4>
            <div className="tag-group">
              {strong.map((t, idx) => (
                <span key={idx} className="tag green-tag">
                  {t.topic} ({t.percentage}%)
                </span>
              ))}
            </div>
          </div>
        </div> */}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg font-bold blink">Loading test results...</div>
      </div>
    );
  }

  return (
    <div className="report-container">
      {/* <button
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        onClick={() => router.back()}
      >
        ← Back
      </button> */}
      
      <LeftOutlined
                         className="text-lg cursor-pointer mr-2"
                         onClick={() => {
                           /* router.push(`/${role}/${id}/test/`); */
                           /* setShowTestList(true); */
                           window.location.reload();
        }}
        
        
                       />

      <div className="header-info">
        {resultData?.testDate && (
          <p className="taken-date">
            🕒 Taken on {new Date(resultData.testDate).toDateString()}
          </p>
        )}
        <h2 className="test-title">Test Results</h2>
        <p className="student-name">{resultData?.studentName}</p>
        <p className="test-label">
          <span className="test-name"> {resultData?.testName}</span>
        </p>
      </div>

      {/* Score Summary */}
      <div className="scorecards-container">
        <div className="card total-score">
          <div className="title">🏆 Total Score</div>
          <div className="score">
            {resultData?.subjects?.reduce(
              (acc, s) => acc + (s.subject_score || 0),
              0
            )}
          </div>
          <div className="subtitle">
            out of{" "}
            {resultData?.subjects?.reduce(
              (acc, s) => acc + (s.subject_max_score || 0),
              0
            )}
          </div>
        </div>

        {resultData?.subjects?.map((subject, idx) => {
          const percent = Math.round(
            (subject.subject_score / subject.subject_max_score) * 100
          );
          return (
            <div className="card subject-card" key={idx}>
              <div className="title-row">
                {subject.name === "English" ? "📘" : "🧮"} {subject.name}
                <span className="percentage red">{percent}%</span>
              </div>
              <div className="subject-score red">{subject.subject_score}</div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="subtitle1">
                out of {subject.subject_max_score}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      {/* <div className="tabs-container">
        {["english", "math", "questions"].map((tab) => (
          <div
            key={tab}
            className={`tab-item ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "english"
              ? "English Analysis"
              : tab === "math"
              ? "Math Analysis"
              : "Question Breakdown"}
          </div>
        ))}
      </div> */}

      <div className="tabs-container">
  {tabs.map((tab) => (
    <div
      key={tab}
      className={`tab-item ${activeTab === tab ? "active" : ""}`}
      onClick={() => setActiveTab(tab)}
    >
      {tab === "questions"
        ? "Question Breakdown"
        : `${tab.charAt(0).toUpperCase() + tab.slice(1)} Analysis`}
    </div>
  ))}
</div>


      {/* English Analysis */}
      {activeTab === "english" && (
        <>
          <CurrentTab_New selectedSubject={0} data={resultData} testSubmissionId={testSubmissionId} /> 
          {/* <div className="performance-sections">
            <div className="card-section">
              <h3>📘 Reading & Writing Sections</h3>
              <div className="bar-item">
                <div className="label">
                  <span>Reading</span>
                  <span className="badge gold">60%</span>
                </div>
                <div className="bar-bg">
                  <div className="bar-fill" style={{ width: "60%" }} />
                </div>
                <p className="score-info">120 out of 200</p>
              </div>
              <div className="bar-item">
                <div className="label">
                  <span>Writing & Language</span>
                  <span className="badge red">40%</span>
                </div>
                <div className="bar-bg">
                  <div className="bar-fill" style={{ width: "40%" }} />
                </div>
                <p className="score-info">80 out of 200</p>
              </div>
            </div>
            {renderTopicWisePerformance("English")}
          </div> */}
          {renderFocusAreas("English")}
        </>
      )}

      {/* Math Analysis */}
      {activeTab === "math" && (
        <>
          <CurrentTab_New selectedSubject={1} data={resultData} testSubmissionId={testSubmissionId} />
          {/* <div className="performance-sections">
            <div className="card-section">
              <h3>🧮 Calculator vs No Calculator</h3>
              <div className="bar-item">
                <div className="label">
                  <span>Calculator Section</span>
                  <span className="badge gold">55%</span>
                </div>
                <div className="bar-bg">
                  <div className="bar-fill" style={{ width: "55%" }} />
                </div>
                <p className="score-info">110 out of 200</p>
              </div>
              <div className="bar-item">
                <div className="label">
                  <span>No Calculator Section</span>
                  <span className="badge red">45%</span>
                </div>
                <div className="bar-bg">
                  <div className="bar-fill" style={{ width: "45%" }} />
                </div>
                <p className="score-info">90 out of 200</p>
              </div>
            </div>
            {renderTopicWisePerformance("Math")}
          </div> */}
          {renderFocusAreas("Math")}
        </>
      )}

      {/* Question Breakdown */}
     {activeTab === "questions" && (
  <div className="card-section" style={{ maxWidth: "1300px", margin: "auto" }}>
    <h3>📊 Question-by-Question Analysis</h3>
    <div className="question-tabs">
      {(resultData?.subjects || []).map((subject) => (
        <div
          key={subject.name}
          className={`question-tab ${questionMainTab === subject.name ? "active" : ""}`}
          onClick={() => {
            setQuestionMainTab(subject.name);
            const firstSection = subject.sections?.[0]?.name;
            if (firstSection) setEnglishSubTab(firstSection);
          }}
        >
          {subject.name} Score
        </div>
      ))}
    </div>

    <div className="sub-tabs">
      {resultData?.subjects
        ?.find((s) => s.name === questionMainTab)
        ?.sections?.map((section) => (
          <div
            key={section.name}
            className={`sub-tab ${englishSubTab === section.name ? "active" : ""}`}
            onClick={() => setEnglishSubTab(section.name)}
          >
            {section.name}
          </div>
        ))}
    </div>

    {/* ⬇️ Replace simple list with full table */}
    <div style={{ marginTop: "20px" }}>
      <ReportTable
        sectionData={resultData?.subjects
          ?.find((s) => s.name === questionMainTab)
          ?.sections?.find((sec) => sec.name === englishSubTab)}
           testSubmissionId={testSubmissionId}
          
      />
    </div>
  </div>
)}

    </div>
  );
};

export default ReportNew;
