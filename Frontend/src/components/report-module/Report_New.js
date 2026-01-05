'use client';
import './ReportNew.css';
import { getTestResult } from "@/app/services/authService";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const test_submission_id = searchParams.get("test_submission_id");
  const router = useRouter();
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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-orange-50">
        <div className="text-center p-12 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl">
          <Spin size="large" />
          <p className="mt-5 text-lg font-semibold text-gray-800 animate-pulse">
            Loading test results...
          </p>
        </div>
      </div>
    );
  }

  const totalScore = resultData?.subjects?.reduce((acc, s) => acc + (s.subject_score || 0), 0);
  const totalMaxScore = resultData?.subjects?.reduce((acc, s) => acc + (s.subject_max_score || 0), 0);
  const totalPercent = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <button
        className="absolute top-2 right-6 inline-flex items-center gap-2 px-5 py-3 bg-white/90 backdrop-blur-lg border border-gray-100 rounded-full text-sm font-semibold text-gray-800 cursor-pointer transition-all duration-300 shadow-sm hover:bg-primary-color hover:text-white hover:-translate-x-1 hover:shadow-lg hover:shadow-orange-200"
        onClick={() => window.location.reload()}
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
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer ${activeTab === tab
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
            <CurrentTab_New selectedSubject={0} data={resultData} testSubmissionId={testSubmissionId} />
            {renderFocusAreas("English")}
          </>
        )}

        {/* Math Analysis */}
        {activeTab === "math" && (
          <>
            <CurrentTab_New selectedSubject={1} data={resultData} testSubmissionId={testSubmissionId} />
            {renderFocusAreas("Math")}
          </>
        )}

        {/* Question Breakdown */}
        {activeTab === "questions" && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100 w-full">
            <div className="flex items-center gap-3 mb-7">
              <ChartBarIcon size={24} className="text-primary-color" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 m-0">
                Question By Question Analysis
              </h2>
            </div>

            <div className="flex flex-wrap gap-3 mb-5">
              {(resultData?.subjects || []).map((subject) => (
                <button
                  key={subject.name}
                  className={`inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 ${questionMainTab === subject.name
                    ? 'bg-gradient-to-r from-primary-color to-orange-500 text-white shadow-lg shadow-orange-200 border-transparent'
                    : 'bg-gray-50 border-2 border-gray-200 text-gray-800 hover:bg-orange-50 hover:border-orange-200'
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

            <div className="flex flex-wrap gap-2.5 mb-6 p-4 bg-gray-50 rounded-xl">
              {resultData?.subjects
                ?.find((s) => s.name === questionMainTab)
                ?.sections?.map((section) => (
                  <button
                    key={section.name}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${englishSubTab === section.name
                      ? 'bg-gray-800 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600'
                      }`}
                    onClick={() => setEnglishSubTab(section.name)}
                  >
                    {section.name}
                  </button>
                ))}
            </div>

            <div className="mt-6">
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
    </div>
  );
};

export default ReportNew;
