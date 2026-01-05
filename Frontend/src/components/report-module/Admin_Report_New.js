import './ReportNew.css';
import { getTestResult } from "@/app/services/authService";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter,useParams } from "next/navigation";
import { LeftOutlined } from "@ant-design/icons";
import CurrentTab_New from "./CurrentTab_New";
import ReportTable from "./report-table";

const Admin_Report_New = ({ testSubmissionId,onClose  }) => {
  const [activeTab, setActiveTab] = useState("english");
  const [questionMainTab, setQuestionMainTab] = useState("english");
  const [englishSubTab, setEnglishSubTab] = useState("sectionA");
  const [resultData, setResultData] = useState({});
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const test_submission_id = searchParams.get("test_submission_id");
  const router = useRouter();
  
  

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
           onClick={onClose}
        
                       />

      <div className="bg-gray-100 rounded-2xl p-4 md:p-6 shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Header Card - Left Aligned */}
          <div className="lg:col-span-1 flex flex-col justify-center">
            <div>
              {/* Date Badge */}
              {resultData?.testDate && (
                <div className="inline-flex items-center gap-1.5 text-sm text-black mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className="font-medium">{new Date(resultData.testDate).toDateString()}</span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl font-bold text-[#F59403] mb-3">
                Test Results
              </h1>

              {/* Badges - Stacked */}
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-900 text-white w-fit">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{resultData?.studentName}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 w-fit">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{resultData?.testName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Total Score Card - Blue Background */}
          <div className="rounded-xl overflow-hidden bg-gradient-to-br bg-sky-400 text-white shadow-lg p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wide opacity-90">
                Total Score
              </span>
              <span className="text-xs font-bold">
                {(() => {
                  const total = resultData?.subjects?.reduce((acc, s) => acc + (s.subject_score || 0), 0);
                  const max = resultData?.subjects?.reduce((acc, s) => acc + (s.subject_max_score || 0), 0);
                  return max > 0 ? Math.round((total / max) * 100) : 0;
                })()}%
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black">
                {resultData?.subjects?.reduce((acc, s) => acc + (s.subject_score || 0), 0)}
              </span>
              <span className="text-md font-medium opacity-70">
                OUT OF {resultData?.subjects?.reduce((acc, s) => acc + (s.subject_max_score || 0), 0)}
              </span>
            </div>

            <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/70 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(() => {
                    const total = resultData?.subjects?.reduce((acc, s) => acc + (s.subject_score || 0), 0);
                    const max = resultData?.subjects?.reduce((acc, s) => acc + (s.subject_max_score || 0), 0);
                    return max > 0 ? Math.round((total / max) * 100) : 0;
                  })()}%` 
                }}
              />
            </div>
          </div>

          {/* 3. Subject Score Cards */}
          {resultData?.subjects?.map((subject, idx) => {
            const percent = Math.round((subject.subject_score / subject.subject_max_score) * 100);

            return (
              <div key={idx} className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                {/* Header Row: Icon + Name + Percent */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    {subject.name === "English" ? (
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-bold text-gray-700 uppercase tracking-wide">
                    {subject.name}
                  </span>
                  <span className="text-md font-bold">
                    {percent}%
                  </span>
                </div>

                {/* Score Row */}
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-3xl font-black">
                    {subject.subject_score}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium uppercase">
                    Out of {subject.subject_max_score}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Tabs Section */}
      <div className="my-5 bg-white/90 backdrop-blur-lg p-2 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {["english", "math", "questions"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#F59403] to-orange-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === "english" ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="hidden sm:inline">English Analysis</span>
                </>
              ) : tab === "math" ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Math Analysis</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="hidden sm:inline">Question Breakdown</span>
                </>
              )}
            </button>
          ))}
        </div>
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
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6  mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59403] to-orange-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Question-by-Question Analysis</h3>
          </div>

          {/* Subject Tabs */}
          <div className="flex flex-wrap gap-3 mb-5">
            {(resultData?.subjects || []).map((subject) => (
              <button
                key={subject.name}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  questionMainTab === subject.name
                    ? "bg-gradient-to-r from-[#F59403] to-orange-500 text-white shadow-lg shadow-orange-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => {
                  setQuestionMainTab(subject.name);
                  const firstSection = subject.sections?.[0]?.name;
                  if (firstSection) setEnglishSubTab(firstSection);
                }}
              >
                {subject.name === "English" ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
                {subject.name}
              </button>
            ))}
          </div>

          {/* Section Sub-tabs */}
          <div className="flex flex-wrap gap-2 mb-6 p-3 bg-gray-50 rounded-xl">
            {resultData?.subjects
              ?.find((s) => s.name === questionMainTab)
              ?.sections?.map((section) => (
                <button
                  key={section.name}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    englishSubTab === section.name
                      ? "bg-white text-gray-800 shadow-md border border-gray-200"
                      : "bg-transparent text-gray-500 hover:bg-white/50"
                  }`}
                  onClick={() => setEnglishSubTab(section.name)}
                >
                  {section.name}
                </button>
              ))}
          </div>

          {/* Table Section */}
          <div className="bg-gray-50 rounded-xl p-4">
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

export default Admin_Report_New;
