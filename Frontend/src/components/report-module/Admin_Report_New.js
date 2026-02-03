"use client";
import './ReportNew.css';
import { getTestResult } from "@/app/services/authService";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CurrentTab_New from "./CurrentTab_New";
import ReportTable from "./report-table";
import StudentActivityLog from "./StudentActivityLog";
import { Spin } from "antd";
import { 
  CalendarIcon, 
  UserProfileIcon, 
  DocumentIcon, 
  BookIcon, 
  CalculatorIcon, 
  ChartBarIcon 
} from "@/components/icons/report-icons";

const Admin_Report_New = ({ testSubmissionId, onClose }) => {
  const [activeTab, setActiveTab] = useState("english");
  const [questionMainTab, setQuestionMainTab] = useState("english");
  const [englishSubTab, setEnglishSubTab] = useState("sectionA");
  const [resultData, setResultData] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const searchParams = useSearchParams();
  const test_submission_id = searchParams.get("test_submission_id");
  const router = useRouter();

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

  // const mergeAreasOfFocus = (subjectName) => {
  //   const subject = resultData?.subjects?.find((s) => s.name === subjectName);
  //   const combined = {};
  //   subject?.sections?.forEach((section) => {
  //     const focus = section.areas_of_focus || {};
  //     Object.entries(focus).forEach(([topic, data]) => {
  //       if (!combined[topic]) {
  //         combined[topic] = { correct: 0, incorrect: 0 };
  //       }
  //       combined[topic].correct += data.correct_count || 0;
  //       combined[topic].incorrect += data.incorrect_count || 0;
  //     });
  //   });
  //   return Object.entries(combined).map(([topic, { correct, incorrect }]) => {
  //     const total = correct + incorrect;
  //     const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  //     const badge = percentage >= 60 ? "green" : "red";
  //     const label = percentage >= 60 ? "Strong" : "Needs Improvement";
  //     return { topic, score: `${correct}/${total}`, percentage, badge, label };
  //   });
  // };

  // const renderTopicWisePerformance = (subject) => {
  //   const topics = mergeAreasOfFocus(subject);
  //   return (
  //     <div className="card-section">
  //       <h3>Topic-wise Performance</h3>
  //       {topics.length > 0 ? (
  //         topics.map((topic, idx) => (
  //           <div className="bar-item" key={idx}>
  //             <div className="label">
  //               <span>{topic.topic}</span>
  //               <span className={`badge ${topic.badge}`}>{topic.score}</span>
  //             </div>
  //             <div className="bar-bg">
  //               <div className="bar-fill" style={{ width: `${topic.percentage}%` }} />
  //             </div>
  //           </div>
  //         ))
  //       ) : (
  //         <p style={{ padding: "10px" }}>No topic data available.</p>
  //       )}
  //     </div>
  //   );
  // };

  // const renderFocusAreas = (subject) => {
  //   const topics = mergeAreasOfFocus(subject);
  //   const strong = topics.filter((t) => t.badge === "green");
  //   const weak = topics.filter((t) => t.badge === "red");

  //   return (
  //     <div className="focus-card">
  //       <h3>{subject} Focus Areas</h3>
  //       <div className="focus-areas">
  //         <div className="left">
  //           <h4 className="red">Needs Improvement</h4>
  //           <div className="tag-group">
  //             {weak.map((t, idx) => (
  //               <span key={idx} className="tag red-tag">
  //                 {t.topic} ({t.percentage}%)
  //               </span>
  //             ))}
  //           </div>
  //         </div>
  //         <div className="right">
  //           <h4 className="green">Strong Areas</h4>
  //           <div className="tag-group">
  //             {strong.map((t, idx) => (
  //               <span key={idx} className="tag green-tag">
  //                 {t.topic} ({t.percentage}%)
  //               </span>
  //             ))}
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
      <Spin size="large" />
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

      {/* <LeftOutlined
        className="text-lg cursor-pointer mr-2"
        onClick={onClose}
      /> */}

      <div className="bg-gray-100 rounded-2xl p-4 md:p-6 shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Header Card - Left Aligned */}
          <div className="lg:col-span-1 flex flex-col justify-center">
            <div>
              {/* Date Badge */}
              {resultData?.testDate && (
                <div className="inline-flex items-center gap-1.5 text-sm text-black mb-2">
                  <CalendarIcon />
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
                  <UserProfileIcon />
                  <span>{resultData?.studentName}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 w-fit">
                  <DocumentIcon />
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
                      <BookIcon className="text-gray-700" />
                    ) : (
                      <CalculatorIcon className="text-gray-700" />
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
              className={`flex-1 md:min-w-[120px] min-w-[80px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer ${activeTab === tab
                  ? 'bg-gradient-to-r from-[#F59403] to-orange-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
            >
              {tab === "english" ? (
                <>
                  <BookIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">English Analysis</span>
                </>
              ) : tab === "math" ? (
                <>
                  <CalculatorIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Math Analysis</span>
                </>
              ) : (
                <>
                  <ChartBarIcon />
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
          {/* {renderFocusAreas("English")} */}
        </>
      )}

      {/* Math Analysis */}
      {activeTab === "math" && (
        <>
          <CurrentTab_New selectedSubject={1} data={resultData} testSubmissionId={testSubmissionId} />
          {/* {renderFocusAreas("Math")} */}
        </>
      )}

      {/* Question Breakdown */}
      {activeTab === "questions" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mx-auto border">
          {/* Header */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-y-4">
              <h3 className="text-lg font-bold text-gray-800">Question-by-Question Analysis</h3>
              
              {/* Filter Buttons - Compact */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 overflow-x-auto max-w-full">
                {/* All */}
                <button 
                  onClick={() => setFilterStatus('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    filterStatus === 'all' 
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-100' 
                      : 'text-gray-500 hover:text-gray-900 border border-transparent'
                  }`}
                >
                  <span className={`${filterStatus === 'all' ? 'text-gray-900' : 'text-gray-500'}`}>All</span>
                  <span className={`px-1.5 rounded-md text-[10px] py-0.5 ${filterStatus === 'all' ? 'bg-gray-100 text-gray-900' : 'bg-gray-200 text-gray-500'}`}>
                    {(() => {
                        const questions = resultData?.subjects
                        ?.find((s) => s.name === questionMainTab)
                        ?.sections?.find((sec) => sec.name === englishSubTab)?.questions_data || [];
                        return questions.length;
                    })()}
                  </span>
                </button>

                {/* Correct */}
                <button 
                  onClick={() => setFilterStatus(filterStatus === 'correct' ? 'all' : 'correct')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    filterStatus === 'correct' 
                      ? 'bg-white text-green-700 shadow-sm border border-green-100' 
                      : 'text-gray-500 hover:text-green-600 border border-transparent'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === 'correct' ? 'bg-green-500' : 'bg-green-400'}`}></div>
                  <span>Correct</span>
                  <span className={`opacity-70 ${filterStatus === 'correct' ? 'opacity-100 font-bold' : ''}`}>
                    {(() => {
                       const questions = resultData?.subjects
                        ?.find((s) => s.name === questionMainTab)
                        ?.sections?.find((sec) => sec.name === englishSubTab)?.questions_data || [];
                       return questions.filter(q => q.result && !q.is_skipped).length;
                    })()}
                  </span>
                </button>

                 {/* Incorrect */}
                 <button 
                  onClick={() => setFilterStatus(filterStatus === 'incorrect' ? 'all' : 'incorrect')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    filterStatus === 'incorrect' 
                      ? 'bg-white text-red-700 shadow-sm border border-red-100' 
                      : 'text-gray-500 hover:text-red-600 border border-transparent'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === 'incorrect' ? 'bg-red-500' : 'bg-red-400'}`}></div>
                  <span>Incorrect</span>
                  <span className={`opacity-70 ${filterStatus === 'incorrect' ? 'opacity-100 font-bold' : ''}`}>
                     {(() => {
                       const questions = resultData?.subjects
                        ?.find((s) => s.name === questionMainTab)
                        ?.sections?.find((sec) => sec.name === englishSubTab)?.questions_data || [];
                       return questions.filter(q => !q.result && !q.is_skipped).length;
                     })()}
                  </span>
                </button>
                
                {/* Marked */}
                <button 
                  onClick={() => setFilterStatus(filterStatus === 'marked' ? 'all' : 'marked')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    filterStatus === 'marked' 
                      ? 'bg-white text-blue-700 shadow-sm border border-blue-100' 
                      : 'text-gray-500 hover:text-blue-600 border border-transparent'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === 'marked' ? 'bg-blue-500' : 'bg-blue-400'}`}></div>
                  <span>Marked</span>
                  <span className={`opacity-70 ${filterStatus === 'marked' ? 'opacity-100 font-bold' : ''}`}>
                     {(() => {
                       const questions = resultData?.subjects
                        ?.find((s) => s.name === questionMainTab)
                        ?.sections?.find((sec) => sec.name === englishSubTab)?.questions_data || [];
                       return questions.filter(q => q.marked).length;
                     })()}
                  </span>
                </button>

                 {/* Skipped */}
                <button 
                  onClick={() => setFilterStatus(filterStatus === 'skipped' ? 'all' : 'skipped')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    filterStatus === 'skipped' 
                      ? 'bg-white text-gray-800 shadow-sm border border-gray-200' 
                      : 'text-gray-500 hover:text-gray-800 border border-transparent'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === 'skipped' ? 'bg-gray-500' : 'bg-gray-400'}`}></div>
                  <span>Skipped</span>
                   <span className={`opacity-70 ${filterStatus === 'skipped' ? 'opacity-100 font-bold' : ''}`}>
                     {(() => {
                       const questions = resultData?.subjects
                        ?.find((s) => s.name === questionMainTab)
                        ?.sections?.find((sec) => sec.name === englishSubTab)?.questions_data || [];
                       return questions.filter(q => q.is_skipped).length;
                     })()}
                  </span>
                </button>
              </div>
            </div>

            {/* Subject Tabs */}
            <div className="flex flex-wrap gap-2">
              {(resultData?.subjects || []).map((subject) => (
                <button
                  key={subject.name}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${questionMainTab === subject.name
                      ? "bg-[#F59403] text-white shadow-md shadow-orange-100"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  onClick={() => {
                    setQuestionMainTab(subject.name);
                    const firstSection = subject.sections?.[0]?.name;
                    if (firstSection) setEnglishSubTab(firstSection);
                  }}
                >
                  {subject.name === "English" ? (
                    <BookIcon className="w-4 h-4" />
                  ) : (
                    <CalculatorIcon className="w-4 h-4" />
                  )}
                  {subject.name}
                </button>
              ))}
            </div>

            {/* Section Sub-tabs */}
             <div className="flex flex-wrap gap-2 mt-2">
              {resultData?.subjects
                ?.find((s) => s.name === questionMainTab)
                ?.sections?.map((section) => (
                  <button
                    key={section.name}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 border ${englishSubTab === section.name
                        ? "bg-white text-gray-800 border-gray-300 shadow-sm"
                        : "bg-transparent text-gray-500 border-transparent hover:bg-gray-50"
                      }`}
                    onClick={() => setEnglishSubTab(section.name)}
                  >
                    {section.name}
                  </button>
                ))}
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-xl">
            <ReportTable
              sectionData={(() => {
                  const section = resultData?.subjects
                    ?.find((s) => s.name === questionMainTab)
                    ?.sections?.find((sec) => sec.name === englishSubTab);
                  
                  if (!section) return null;

                  let filteredQuestions = section.questions_data || [];
                  
                  if (filterStatus === 'correct') {
                    filteredQuestions = filteredQuestions.filter(q => q.result && !q.is_skipped);
                  } else if (filterStatus === 'incorrect') {
                    filteredQuestions = filteredQuestions.filter(q => !q.result && !q.is_skipped);
                  } else if (filterStatus === 'marked') {
                    filteredQuestions = filteredQuestions.filter(q => q.marked);
                  } else if (filterStatus === 'skipped') {
                    filteredQuestions = filteredQuestions.filter(q => q.is_skipped);
                  }

                  return { ...section, questions_data: filteredQuestions };
                })()}
              testSubmissionId={testSubmissionId}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin_Report_New;
