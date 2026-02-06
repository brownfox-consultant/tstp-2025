'use client';
import './ReportNew.css';
import { getTestResult } from "@/app/services/authService";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams, usePathname } from "next/navigation";
import { Spin, Progress } from "antd";
import CurrentTab_New from "./CurrentTab_New";
import ReportTable from "./report-table";
import {
  TrophyIcon,
  BookIcon,
  CalculatorIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowLeftIcon,
  UserIcon,
  FileTextIcon,
  CalendarIcon,
  SparklesIcon
} from "./icons";

const ReportNew = ({ testSubmissionId, onClose }) => {
  const [activeTab, setActiveTab] = useState("english");
  const [questionMainTab, setQuestionMainTab] = useState("english");
  const [englishSubTab, setEnglishSubTab] = useState("sectionA");
  const [resultData, setResultData] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'correct', 'incorrect', 'marked'
  const searchParams = useSearchParams();
  const test_submission_id = searchParams.get("test_submission_id");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const availableSubjects = resultData?.subjects?.map(s => s.name.toLowerCase()) || [];
  const tabs = [...availableSubjects, "questions"];

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
    if (resultData?.subjects?.length > 0) {
      const subjectNames = resultData.subjects.map(s => s.name.toLowerCase());
      if (activeTab === "english" && !subjectNames.some(n => n.includes("english"))) {
         setActiveTab(subjectNames[0]);
      }
    }
    if (activeTab === "questions" && resultData?.subjects?.length > 0) {
      const defaultSubject = resultData.subjects[0];
      setQuestionMainTab(defaultSubject.name);
      const defaultSection = defaultSubject.sections?.[0]?.name || "";
      setEnglishSubTab(defaultSection);
    }
  }, [activeTab, resultData]);

  const getSubjectIndex = (subjectName) => {
    return resultData?.subjects?.findIndex(s => s.name.toLowerCase().includes(subjectName));
  };

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
  };

  const renderFocusAreas = (subject) => {
    const topics = mergeAreasOfFocus(subject);
    const strong = topics.filter((t) => t.badge === "green");
    const weak = topics.filter((t) => t.badge === "red");

    return (
      <div className="focus-card">
      </div>
    );
  };

  const getSubjectIcon = (subjectName) => {
    const name = subjectName?.toLowerCase();
    if (name?.includes("english") || name?.includes("reading") || name?.includes("writing")) {
      return <BookIcon size={20} className="text-genz-dark" />;
    } else if (name?.includes("math") || name?.includes("calculator")) {
      return <CalculatorIcon size={20} className="text-genz-dark" />;
    }
    return <ChartBarIcon size={20} className="text-genz-dark" />;
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  const totalScore = resultData?.subjects?.reduce((acc, s) => acc + (s.subject_score || 0), 0);
  const totalMaxScore = resultData?.subjects?.reduce((acc, s) => acc + (s.subject_max_score || 0), 0);
  const totalPercent = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

  return (
    <div>
      {/* Back Button */}
      <button
        className="absolute top-2 right-6 inline-flex items-center gap-2 px-5 py-3 bg-white/90 backdrop-blur-lg border border-gray-100 rounded-full text-sm font-semibold text-gray-800 cursor-pointer transition-all duration-300 shadow-sm hover:bg-primary-color hover:text-white hover:-translate-x-1 hover:shadow-lg hover:shadow-orange-200"
        onClick={() => {
          if (onClose) {
            onClose();
          } else {
            const role = pathname?.split('/')[1];
            if (role === 'student') {
              router.push(`/student/${params.id}/test/full`);
            } else {
              router.back();
            }
          }
        }}
      >
        <ArrowLeftIcon size={18} />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="bg-slate-200 rounded-xl p-4 md:p-6 shadow-card mb-6 animate-fade-in shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Header Card - Left Aligned */}
          <div className="lg:col-span-1 flex flex-col justify-center">
            <div className="">
              {/* Date Badge */}
              {resultData?.testDate && (
                <div className="inline-flex items-center gap-1.5 text-sm text-black mb-2">
                  <CalendarIcon size={16} />
                  <span className="font-medium">{new Date(resultData.testDate).toDateString()}</span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl font-bold text-[#F59403] mb-3">
                Test Results
              </h1>

              {/* Badges - Stacked */}
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-900 text-white w-fit">
                  <UserIcon size={14} />
                  <span>{resultData?.studentName}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 w-fit">
                  <FileTextIcon size={14} />
                  <span>{resultData?.testName}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden bg-gradient-to-br bg-sky-400 text-white shadow-lg p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wide opacity-90">
                Total Score
              </span>
              <span className="text-xs font-bold">{totalPercent}%</span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black">
                {totalScore}
              </span>
              <span className="text-md font-medium opacity-70">
                OUT OF {totalMaxScore}
              </span>
            </div>

            <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/70 rounded-full transition-all duration-500"
                style={{ width: `${totalPercent}%` }}
              />
            </div>
          </div>

          {/* 3. Subject Score Cards - Same UI as Total Score */}
          {resultData?.subjects?.map((subject, idx) => {
            const percent = Math.round((subject.subject_score / subject.subject_max_score) * 100);

            return (
              <div key={idx} className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                {/* Header Row: Icon + Name + Percent */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    {getSubjectIcon(subject.name)}
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
                <Progress
                  percent={percent}
                  showInfo={false}
                  strokeWidth={6}
                  size="small"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Tabs Section */}
      <div className="my-5 bg-white/90 backdrop-blur-lg p-2 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:min-w-[120px] min-w-[80px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer ${activeTab === tab
                ? 'bg-gradient-to-r from-primary-color to-orange-500 text-white shadow-lg shadow-orange-200'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
            >
              {tab === "questions" ? (
                <>
                  <ChartBarIcon size={18} />
                  <span className="hidden sm:inline">Question Breakdown</span>
                </>
              ) : (
                <>
                  {getSubjectIcon(tab)}
                  <span className="hidden sm:inline">{tab.charAt(0).toUpperCase() + tab.slice(1)} Analysis</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex justify-center">
        {/* English Analysis */}
        {activeTab === "english" && (
          <>
            <CurrentTab_New selectedSubject={getSubjectIndex("english")} data={resultData} testSubmissionId={testSubmissionId} />
            {renderFocusAreas("English")}
          </>
        )}

        {/* Math Analysis */}
        {activeTab === "math" && (
          <>
            <CurrentTab_New selectedSubject={getSubjectIndex("math")} data={resultData} testSubmissionId={testSubmissionId} />
            {renderFocusAreas("Math")}
          </>
        )}

        {/* Question Breakdown */}
        {activeTab === "questions" && (
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 w-full">
            <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-3">
                <ChartBarIcon size={24} className="text-primary-color" />
                <h2 className="text-lg md:text-xl font-bold text-gray-800 m-0">
                  Question By Question Analysis
                </h2>
              </div>
              
              {/* Filter Buttons */}
              {/* Filter Buttons - Compact */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                {/* All */}
                <button 
                  onClick={() => setFilterStatus('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
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

            <div className="flex flex-wrap gap-3 mb-3">
              {(resultData?.subjects || []).map((subject) => (
                <button
                  key={subject.name}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 ${questionMainTab === subject.name
                    ? 'bg-gradient-to-r from-primary-color to-orange-500 text-white shadow-md shadow-orange-200 border-transparent'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-orange-200 hover:text-orange-600'
                    }`}
                  onClick={() => {
                    setQuestionMainTab(subject.name);
                    const firstSection = subject.sections?.[0]?.name;
                    if (firstSection) setEnglishSubTab(firstSection);
                  }}
                >
                  {getSubjectIcon(subject.name)}
                  <span>{subject.name} Score</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {resultData?.subjects
                ?.find((s) => s.name === questionMainTab)
                ?.sections?.map((section) => (
                  <button
                    key={section.name}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${englishSubTab === section.name
                      ? 'bg-gray-800 text-white shadow-md'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    onClick={() => setEnglishSubTab(section.name)}
                  >
                    {section.name}
                  </button>
                ))}
            </div>

            <div className="mt-6">
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
    </div>
  );
};

export default ReportNew;
