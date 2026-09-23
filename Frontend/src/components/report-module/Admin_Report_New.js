"use client";

import './ReportNew.css';
import { getTestResult, downloadTestReport } from "@/app/services/authService";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CurrentTab_New from "./CurrentTab_New";
import ReportTable from "./report-table";
import StudentActivityLog from "./StudentActivityLog";
import axios from "axios";
import { BASE_URL } from "@/app/constants/apiConstants";
import { Spin } from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

import {
  CalendarIcon,
  UserProfileIcon,
  DocumentIcon,
  BookIcon,
  CalculatorIcon,
  ChartBarIcon
} from "@/components/icons/report-icons";

import {
  ClockIcon,
  ArrowLeftIcon,
  UserIcon,
  FileTextIcon,
  SparklesIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ActivityIcon,
  TargetIcon
} from "./icons";

const Admin_Report_New = ({  testSubmissionId,
  onClose, }) => {
  const [activeTab, setActiveTab] = useState("english");
  const [questionMainTab, setQuestionMainTab] = useState("english");
  const [englishSubTab, setEnglishSubTab] = useState("sectionA");
  const [resultData, setResultData] = useState({});
  const [loading, setLoading] = useState(true);
  const [improvementData, setImprovementData] = useState(null);
const [loadingImprovement, setLoadingImprovement] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const searchParams = useSearchParams();
  const test_submission_id = searchParams.get("test_submission_id");

  const [selectedFlowSection, setSelectedFlowSection] = useState(null);
  const router = useRouter();

  const availableSubjects =
    resultData?.subjects?.map((s) => s.name.toLowerCase()) || [];

  const tabs = [...availableSubjects, "questions", "insights"];

  const [downloadingReport, setDownloadingReport] = useState(false);

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
      const subjectNames = resultData.subjects.map((s) =>
        s.name.toLowerCase()
      );

      if (
        activeTab !== "questions" &&
        activeTab !== "insights" &&
        !subjectNames.includes(activeTab)
      ) {
        setActiveTab(subjectNames[0]);
      }

      if (activeTab === "questions") {
        const defaultSubject = resultData.subjects[0];

        setQuestionMainTab(defaultSubject.name);

        const defaultSection =
          defaultSubject.sections?.[0]?.name || "";

        setEnglishSubTab(defaultSection);
      }

      if (!selectedFlowSection) {
        const firstSubject = resultData.subjects[0];
        const firstSection = firstSubject.sections?.[0];

        if (firstSection) {
          setSelectedFlowSection({
            subject: firstSubject.name,
            section: firstSection.name,
          });
        }
      }
    }
  }, [activeTab, resultData, selectedFlowSection]);

  useEffect(() => {
  const loadImprovementData = async () => {
    const studentId = resultData?.student_id;
    const selectedCourseId = resultData?.course_id;

    if (!studentId || !selectedCourseId) {
      return;
    }

    try {
      setLoadingImprovement(true);

      const response = await axios.get(
        `${BASE_URL}/api/result/student-improvement/`,
        {
          params: {
            student_id: studentId,
            course_id: selectedCourseId,
            test_type: "fullLength",
          },
          withCredentials: true,
        }
      );

      console.log("Student Improvement API:", response.data);

      setImprovementData(response.data);
    } catch (error) {
      console.error(
        "Error loading improvement data:",
        error
      );

      setImprovementData(null);
    } finally {
      setLoadingImprovement(false);
    }
  };

  loadImprovementData();
}, [resultData]);

  const getSubjectIcon = (subjectName) => {
    const name = subjectName?.toLowerCase();

    if (
      name?.includes("english") ||
      name?.includes("reading") ||
      name?.includes("writing")
    ) {
      return <BookIcon className="w-4 h-4" />;
    }

    if (
      name?.includes("math") ||
      name?.includes("calculator")
    ) {
      return <CalculatorIcon className="w-4 h-4" />;
    }

    return <ChartBarIcon size={20} className="w-4 h-4" />;
  };

  // ============================================================
  // GET ALL SECTIONS
  // ============================================================

  const getAllSections = () => {
    const sections = [];

    resultData?.subjects?.forEach((subject) => {
      subject.sections?.forEach((section) => {
        sections.push({
          subject: subject.name,
          section: section.name,
        });
      });
    });

    return sections;
  };

  // ============================================================
  // BUILD NAVIGATION FLOW
  // ============================================================

  const buildNavigationFlow = (subjectName, sectionName) => {
    const subject = resultData?.subjects?.find(
      (s) => s.name === subjectName
    );

    if (!subject) return [];

    const section = subject.sections?.find(
      (sec) => sec.name === sectionName
    );

    if (!section || !section.questions_data) return [];

    const questions = section.questions_data;
    const flow = [];
    const questionMap = {};

    // Build question map
    questions.forEach((q) => {
      questionMap[q.question_id] = {
        sr_no: q.sr_no,
        is_correct: q.result,
        is_skipped: q.is_skipped,
        marked: q.marked,
      };
    });

    // Get navigation actions
    const allActions = [];

    questions.forEach((q) => {
      if (
        q.navigation_actions &&
        q.navigation_actions.length > 0
      ) {
        q.navigation_actions.forEach((action) => {
          const qInfo = questionMap[q.question_id];

          if (qInfo) {
            allActions.push({
              ...action,
              sr_no: qInfo.sr_no,
              question_id: q.question_id,
              is_correct: qInfo.is_correct,
              is_skipped: qInfo.is_skipped,
              marked: qInfo.marked,
            });
          }
        });
      }
    });

    // Sort by timestamp
    allActions.sort(
      (a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
    );

    allActions.forEach((action) => {
      flow.push({
        sr_no: action.sr_no,
        question_id: action.question_id,
        action_type: action.action_type,
        time_spent: action.time_spent || 0,
        is_correct: action.is_correct,
        is_skipped: action.is_skipped,
        marked: action.marked,
        timestamp: action.timestamp,
      });
    });

    return flow;
  };

  // ============================================================
  // TOTAL TIME
  // ============================================================

  const getTotalTimeSpent = () => {
    let totalTime = 0;

    resultData?.subjects?.forEach((subject) => {
      subject.sections?.forEach((section) => {
        totalTime +=
          (section?.section_correct_time_taken || 0) +
          (section?.section_incorrect_time_taken || 0);
      });
    });

    return totalTime;
  };

  // ============================================================
  // TOTAL NAVIGATION STEPS
  // ============================================================

  const getTotalNavigationSteps = () => {
    let totalSteps = 0;

    resultData?.subjects?.forEach((subject) => {
      subject.sections?.forEach((section) => {
        const flow = buildNavigationFlow(
          subject.name,
          section.name
        );

        totalSteps += flow.filter(
          (f) =>
            f.action_type !== "TIMEUP" &&
            f.action_type !== "Review_Time"
        ).length;
      });
    });

    return totalSteps;
  };

  // ============================================================
  // QUESTION TIME GRAPH
  // ============================================================

  // Question Time Graph
const renderQuestionTimeGraph = (flow) => {
  const graphItems = (flow || []).filter(
    (item) =>
      item.action_type !== "Review_Time" &&
      item.action_type !== "TIMEUP"
  );

  if (graphItems.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        No question time data available.
      </div>
    );
  }

  const maxTime = Math.max(
    1,
    ...graphItems.map((item) => Number(item.time_spent) || 0)
  );

  const maxBarHeight = 150;
  const barWidth = 38;
  const gap = 18;

  const chartWidth = Math.max(
    graphItems.length * (barWidth + gap) + 40,
    520
  );

  const getBarColor = (item) => {
    if (item.is_correct && !item.is_skipped) {
      return "bg-green-500";
    }

    if (item.is_skipped) {
      return "bg-gray-400";
    }

    if (!item.is_correct && !item.is_skipped) {
      return "bg-red-500";
    }

    return "bg-gray-300";
  };

  const getQuestionLabel = (item) =>
    item.sr_no !== undefined && item.sr_no !== null
      ? `Q${item.sr_no}`
      : "Q";

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700">
            Question Time Graph
          </h4>

          <p className="text-[10px] text-gray-400 mt-0.5">
            Time spent on each question
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500" />
            <span className="text-gray-500">Correct</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500" />
            <span className="text-gray-500">Incorrect</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-400" />
            <span className="text-gray-500">Skipped</span>
          </div>
        </div>
      </div>

      {/* overflow-y-visible prevents the time labels from being clipped */}
      <div className="overflow-x-auto overflow-y-visible pb-3">
        <div
          className="relative px-5 pt-10"
          style={{
            width: `${chartWidth}px`,
            height: "220px",
          }}
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="absolute left-5 right-0 border-t border-dashed border-gray-200"
              style={{
                bottom: `${35 + (maxBarHeight * percent) / 100}px`,
              }}
            >
              <span className="absolute -left-5 -top-2 text-[8px] text-gray-400">
                {Math.round((maxTime * percent) / 100)}s
              </span>
            </div>
          ))}

          {/* Common baseline */}
          <div className="absolute left-5 right-0 bottom-[35px] border-t-2 border-gray-300" />

          {/* Bars */}
          <div className="absolute left-5 right-0 bottom-[35px] flex items-end gap-[18px]">
            {graphItems.map((item, index) => {
              const seconds = Number(item.time_spent) || 0;

              const barHeight =
                seconds > 0
                  ? Math.max(
                      5,
                      (seconds / maxTime) * maxBarHeight
                    )
                  : 3;

              return (
                <div
                  key={`${item.question_id || item.sr_no}-${index}`}
                  className="relative flex-shrink-0 flex flex-col items-center justify-end"
                  style={{
                    width: `${barWidth}px`,
                    height: `${maxBarHeight}px`,
                  }}
                  title={`${getQuestionLabel(item)}: ${seconds}s`}
                >
                  {/* Time value */}
                  <span
                    className="absolute text-[10px] font-bold text-gray-700 whitespace-nowrap"
                    style={{
                      bottom: `${Math.min(
                        barHeight + 5,
                        maxBarHeight + 4
                      )}px`,
                    }}
                  >
                    {seconds}s
                  </span>

                  {/* Higher bar = more time spent */}
                  <div
                    className={`w-full rounded-t-md transition-all duration-200 hover:opacity-80 ${getBarColor(
                      item
                    )}`}
                    style={{
                      height: `${barHeight}px`,
                    }}
                  />

                  {/* Question number */}
                  <span className="absolute top-full mt-2 text-[10px] font-semibold text-gray-600 whitespace-nowrap">
                    {getQuestionLabel(item)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

  // ============================================================
  // NAVIGATION FLOW
  // ============================================================

  const renderNavigationFlow = () => {
    const flow = buildNavigationFlow(
      selectedFlowSection?.subject,
      selectedFlowSection?.section
    );

    const navigationFlow = flow.filter(
      (f) => f.action_type !== "Review_Time"
    );

    const allSections = getAllSections();

    const subject = resultData?.subjects?.find(
      (s) =>
        s.name === selectedFlowSection?.subject
    );

    const section = subject?.sections?.find(
      (s) =>
        s.name === selectedFlowSection?.section
    );

    const questions =
      section?.questions_data || [];

    if (flow.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <ActivityIcon
            size={48}
            className="mx-auto mb-3 opacity-30"
          />

          <p>
            No navigation data available for this
            section.
          </p>

          <p className="text-sm">
            Complete the test with navigation
            tracking enabled to see insights.
          </p>
        </div>
      );
    }

    // Navigation statistics
    const nextCount = flow.filter(
      (f) => f.action_type === "NEXT"
    ).length;

    const prevCount = flow.filter(
      (f) => f.action_type === "PREVIOUS"
    ).length;

    const jumpCount = flow.filter(
      (f) => f.action_type === "JUMP"
    ).length;

    // Unique questions
    const uniqueQuestions = [];
    const seen = new Set();

    flow.forEach((f) => {
      if (!seen.has(f.sr_no)) {
        seen.add(f.sr_no);
        uniqueQuestions.push(f.sr_no);
      }
    });

    // Revisits
    const revisits = questions.reduce(
      (total, q) => {
        return (
          total +
          Math.max(
            0,
            (q.times_visited || 1) - 1
          )
        );
      },
      0
    );

    const timeupVisits = flow.filter(
      (f) => f.action_type === "TIMEUP"
    ).length;

    const reviewVisits = flow.filter(
      (f) =>
        f.action_type === "Review_Time"
    ).length;

    const totalVisits = revisits;

    const sectionTime =
      section?.time_on_section || 0;

    const actualQuestionTime =
      (section?.section_correct_time_taken ||
        0) +
      (section?.section_incorrect_time_taken ||
        0) +
      (section?.section_blank_time_taken ||
        0);

    const idleTime = Math.max(
      0,
      sectionTime - actualQuestionTime
    );

    // Question status color
    const getQuestionColor = (item) => {
      if (
        item.is_correct &&
        !item.is_skipped
      ) {
        return "bg-green-500 text-white border-green-600";
      }

      if (item.is_skipped) {
        return "bg-gray-400 text-white border-gray-500";
      }

      if (
        !item.is_correct &&
        !item.is_skipped
      ) {
        return "bg-red-500 text-white border-red-600";
      }

      return "bg-gray-200 text-gray-600 border-gray-300";
    };

    // Action icon
    const getActionIcon = (actionType) => {
      switch (actionType) {
        case "PREVIOUS":
          return {
            icon: "←",
            color: "text-blue-500",
          };

        case "JUMP":
        case "Review_Time":
          return {
            icon: "↕",
            color: "text-purple-500",
          };

        case "TIMEUP":
          return {
            icon: "→",
            color: "text-red-500",
          };

        default:
          return {
            icon: "→",
            color: "text-green-500",
          };
      }
    };

    // Complete sequence
    const sequenceString = flow
      .map((f, index) => {
        const question =
          f.action_type === "Review_Time"
            ? "R"
            : `Q${f.sr_no}`;

        if (index === 0) {
          return question;
        }

        const previousAction =
          getActionIcon(
            flow[index - 1].action_type
          );

        return `${previousAction.icon} ${question}`;
      })
      .join(" ");

    return (
      <div className="space-y-4">
        {/* Section Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            Navigation Sections:
          </span>

          <div className="flex flex-wrap gap-2">
            {allSections.map((s, idx) => (
              <button
                key={idx}
                onClick={() =>
                  setSelectedFlowSection(s)
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedFlowSection?.subject ===
                    s.subject &&
                  selectedFlowSection?.section ===
                    s.section
                    ? "bg-primary-color text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s.subject} - {s.section}
              </button>
            ))}
          </div>
        </div>

        {/* Flow Stats */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 bg-gray-50 rounded-xl p-4">
          <div className="text-center">
            <div className="text-xs text-gray-400">
              Total Steps
            </div>

            <div className="text-xl font-bold text-gray-800">
              {navigationFlow.length}
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-gray-400">
              Unique Questions
            </div>

            <div className="text-xl font-bold text-gray-800">
              {uniqueQuestions.length}
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-gray-400">
              Revisits
            </div>

            <div className="text-xl font-bold text-orange-500">
              {totalVisits}
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-gray-400">
              Review Page Visits
            </div>

            <div className="text-xl font-bold text-orange-500">
              {reviewVisits}
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-gray-400">
              Total Time
            </div>

            <div className="text-xl font-bold text-gray-800">
              {(() => {
                const totalSeconds =
                  (section?.section_correct_time_taken ||
                    0) +
                  (section?.section_incorrect_time_taken ||
                    0) +
                  (section?.section_blank_time_taken ||
                    0);

                const minutes =
                  Math.floor(
                    totalSeconds / 60
                  );

                const seconds =
                  totalSeconds % 60;

                return `${minutes}m ${seconds}s`;
              })()}
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-gray-400">
              Idle Time
            </div>

            <div className="text-xl font-bold text-orange-500">
              {Math.floor(
                idleTime / 60
              )}
              m {idleTime % 60}s
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-gray-400">
              Avg Time/Step
            </div>

            <div className="text-xl font-bold text-gray-800">
              {navigationFlow.length > 0
                ? (
                    (
                      (section?.section_correct_time_taken ||
                        0) +
                      (section?.section_incorrect_time_taken ||
                        0) +
                      (section?.section_blank_time_taken ||
                        0)
                    ) /
                    navigationFlow.length
                  ).toFixed(2)
                : "0.00"}
              s
            </div>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-500 font-medium">
            Navigation Actions:
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-green-500 font-bold">
              →
            </span>

            <span className="text-gray-600">
              {nextCount} Next
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-blue-500 font-bold">
              ←
            </span>

            <span className="text-gray-600">
              {prevCount} Previous
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-purple-500 font-bold">
              ↕
            </span>

            <span className="text-gray-600">
              {jumpCount} Jump
            </span>
          </div>
        </div>

        {/* Navigation Timeline */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Navigation Timeline
          </h4>

          <div className="relative overflow-x-auto pb-4">
            <div className="flex items-center gap-1 min-w-max px-2">
              {flow.map((item, index) => {
                const colorClass =
                  getQuestionColor(item);

                const action =
                  getActionIcon(
                    item.action_type
                  );

                return (
                  <div
                    key={index}
                    className="flex items-center"
                  >
                    {/* Question Box */}
                    <div
                      className={`relative flex-shrink-0 w-9 h-9 rounded-lg ${colorClass} font-bold text-sm flex items-center justify-center border-2 shadow-sm transition-all hover:scale-110 hover:shadow-md cursor-pointer group`}
                      title={`Q${item.sr_no} - ${item.action_type} (${item.time_spent}s)${
                        item.marked
                          ? " 📌"
                          : ""
                      }${
                        item.is_correct
                          ? " ✅"
                          : item.is_skipped
                          ? " ⏭"
                          : " ❌"
                      }`}
                    >
                      <span className="relative z-10">
                        {item.action_type ===
                        "Review_Time"
                          ? "R"
                          : item.sr_no}
                      </span>

                      {item.marked && (
                        <span className="absolute -top-1 -right-1 text-[8px]">
                          📌
                        </span>
                      )}
                    </div>

                    {/* Arrow */}
                    {index <
                      flow.length - 1 && (
                      <div className="flex-shrink-0 mx-0.5">
                        <span
                          className={`text-lg font-bold ${action.color}`}
                        >
                          {action.icon}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Complete Sequence */}
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">
              Complete Sequence:
            </div>

            <div className="text-sm font-mono text-gray-700 break-all max-h-24 overflow-y-auto">
              {sequenceString}
            </div>
          </div>
        </div>

        {/* Question Time Graph */}
        {renderQuestionTimeGraph(flow)}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-gray-500 font-medium">
            Legend:
          </span>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-green-500" />
            <span className="text-gray-600">
              Correct
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-red-500" />
            <span className="text-gray-600">
              Incorrect
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-gray-400" />
            <span className="text-gray-600">
              Skipped
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-green-500 font-bold">
              →
            </span>

            <span className="text-gray-600">
              Next
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-blue-500 font-bold">
              ←
            </span>

            <span className="text-gray-600">
              Previous
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-purple-500 font-bold">
              ↕
            </span>

            <span className="text-gray-600">
              Jump
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-blue-500">
              📌
            </span>

            <span className="text-gray-600">
              Marked
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // NAVIGATION PATTERN INSIGHTS
  // ============================================================

  const renderPatternInsights = () => {
    const pattern =
      resultData?.navigation_pattern;

    const behavior =
      resultData?.test_taking_behavior;

    const getTotalNavigationSteps = () => {
      let totalSteps = 0;

      resultData?.subjects?.forEach(
        (subject) => {
          subject.sections?.forEach(
            (section) => {
              const flow =
                buildNavigationFlow(
                  subject.name,
                  section.name
                );

              const navigationSteps =
                flow.filter(
                  (f) =>
                    f.action_type !==
                    "Review_Time"
                );

              totalSteps +=
                navigationSteps.length;
            }
          );
        }
      );

      return totalSteps;
    };

    if (!pattern && !behavior) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <ActivityIcon
              size={40}
              className="text-gray-400"
            />
          </div>

          <h3 className="text-lg font-semibold text-gray-600">
            No Navigation Data Available
          </h3>

          <p className="text-sm text-gray-400 mt-1">
            Complete the test with navigation
            tracking enabled to see insights.
          </p>
        </div>
      );
    }

    const patternConfig = {
      SEQUENTIAL: {
        label:
          "📊 Sequential Explorer",

        description:
          "You follow the test in order, one question at a time. This systematic approach helps maintain focus and manage time effectively.",

        color: "#22C55E",

        bgGradient:
          "from-green-50 to-emerald-50",

        borderColor:
          "border-green-200",

        iconBg: "bg-green-100",

        textColor:
          "text-green-700",

        recommendation:
          "Great systematic approach! Continue following the test in order for optimal time management. Consider occasionally jumping to difficult questions to maximize your score.",
      },

      JUMPING: {
        label:
          "🎯 Strategic Navigator",

        description:
          "You strategically skip difficult questions and return to them later. This shows excellent time management and test-taking strategy.",

        color: "#F59E0B",

        bgGradient:
          "from-amber-50 to-orange-50",

        borderColor:
          "border-amber-200",

        iconBg: "bg-amber-100",

        textColor:
          "text-amber-700",

        recommendation:
          "Excellent strategy! Jumping between questions shows good time management. Focus on returning to skipped questions with remaining time. Practice identifying which questions to skip quickly.",
      },

      BACK_AND_FORTH: {
        label:
          "🔄 Thorough Reviewer",

        description:
          "You frequently revisit questions, indicating a thorough review process. This shows attention to detail but may impact time management.",

        color: "#3B82F6",

        bgGradient:
          "from-blue-50 to-indigo-50",

        borderColor:
          "border-blue-200",

        iconBg: "bg-blue-100",

        textColor:
          "text-blue-700",

        recommendation:
          "Consider building more confidence in your initial answers to reduce back-and-forth movement. Practice similar questions to improve accuracy. Trust your instincts more often.",
      },

      MIXED: {
        label:
          "🎨 Adaptive Thinker",

        description:
          "You use a combination of navigation strategies, adapting to different question types and difficulty levels.",

        color: "#8B5CF6",

        bgGradient:
          "from-purple-50 to-violet-50",

        borderColor:
          "border-purple-200",

        iconBg: "bg-purple-100",

        textColor:
          "text-purple-700",

        recommendation:
          "Flexible approach detected! Identify which strategy works best for different question types. Consider being more consistent in your approach to save time.",
      },
    };

    const config =
      pattern?.primary_pattern
        ? patternConfig[
            pattern.primary_pattern
          ]
        : patternConfig.MIXED;

    const getTotalRevisits = () => {
      let totalRevisits = 0;

      resultData?.subjects?.forEach(
        (subject) => {
          subject.sections?.forEach(
            (section) => {
              section.questions_data?.forEach(
                (question) => {
                  totalRevisits +=
                    Math.max(
                      0,
                      (question.times_visited ||
                        1) - 1
                    );
                }
              );
            }
          );
        }
      );

      return totalRevisits;
    };

    const getTotalMarkedQuestions = () => {
      let totalMarked = 0;

      resultData?.subjects?.forEach(
        (subject) => {
          subject.sections?.forEach(
            (section) => {
              section.questions_data?.forEach(
                (question) => {
                  if (question.marked) {
                    totalMarked += 1;
                  }
                }
              );
            }
          );
        }
      );

      return totalMarked;
    };

    const getTotalSkippedQuestions = () => {
      let totalSkipped = 0;

      resultData?.subjects?.forEach(
        (subject) => {
          subject.sections?.forEach(
            (section) => {
              section.questions_data?.forEach(
                (question) => {
                  if (
                    question.is_skipped
                  ) {
                    totalSkipped += 1;
                  }
                }
              );
            }
          );
        }
      );

      return totalSkipped;
    };

    const totalMarkedQuestions =
      getTotalMarkedQuestions();

    const totalSkippedQuestions =
      getTotalSkippedQuestions();

    const getTotalTimeSpent = () => {
      let totalTime = 0;

      resultData?.subjects?.forEach(
        (subject) => {
          subject.sections?.forEach(
            (section) => {
              const sectionTotalTime =
                (section?.section_correct_time_taken ||
                  0) +
                (section?.section_incorrect_time_taken ||
                  0) +
                (section?.section_blank_time_taken ||
                  0);

              totalTime +=
                sectionTotalTime;
            }
          );
        }
      );

      return totalTime;
    };

    const getTotalIdleTime = () => {
      let totalIdleTime = 0;

      resultData?.subjects?.forEach(
        (subject) => {
          subject.sections?.forEach(
            (section) => {
              const sectionTotalTime =
                (section?.section_correct_time_taken ||
                  0) +
                (section?.section_incorrect_time_taken ||
                  0) +
                (section?.section_blank_time_taken ||
                  0);

              const sectionTime =
                section?.time_on_section ||
                0;

              totalIdleTime += Math.max(
                0,
                sectionTime -
                  sectionTotalTime
              );
            }
          );
        }
      );

      return totalIdleTime;
    };

    const totalTimeSpent =
      getTotalTimeSpent();

    const totalIdleTime =
      getTotalIdleTime();

    return (
      <div className="space-y-6">
        {/* Pattern Summary */}
        <div
          className={`bg-gradient-to-r ${config.bgGradient} rounded-2xl p-6 border ${config.borderColor} shadow-sm`}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center text-2xl`}
                >
                  {pattern?.primary_pattern ===
                    "SEQUENTIAL" && "📊"}

                  {pattern?.primary_pattern ===
                    "JUMPING" && "🎯"}

                  {pattern?.primary_pattern ===
                    "BACK_AND_FORTH" && "🔄"}

                  {pattern?.primary_pattern ===
                    "MIXED" && "🎨"}

                  {!pattern?.primary_pattern &&
                    "✦"}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {config.label}
                  </h3>

                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          config.color,
                      }}
                    />

                    <span className="text-xs text-gray-500">
                      Primary Test-Taking
                      Pattern
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mt-1">
                {config.description}
              </p>
            </div>

            {pattern && (
              <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Efficiency Score
                </div>

                <div
                  className="text-3xl font-bold"
                  style={{
                    color: config.color,
                  }}
                >
                  {pattern.navigation_efficiency}%
                </div>

                <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pattern.navigation_efficiency}%`,
                      backgroundColor:
                        config.color,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <ActivityIcon
                  size={20}
                  className="text-blue-500"
                />
              </div>

              <span className="text-2xl font-bold text-gray-800">
                {getTotalNavigationSteps()}
              </span>
            </div>

            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Total Navigations
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <TrendingUpIcon
                  size={20}
                  className="text-green-500"
                />
              </div>

              <span className="text-2xl font-bold text-gray-800">
                {pattern?.sequential_moves ||
                  0}
              </span>
            </div>

            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Sequential Moves
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <TrendingDownIcon
                  size={20}
                  className="text-orange-500"
                />
              </div>

              <span className="text-2xl font-bold text-gray-800">
                {pattern?.jump_moves || 0}
              </span>
            </div>

            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Jump Moves
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <TargetIcon
                  size={20}
                  className="text-purple-500"
                />
              </div>

              <span className="text-2xl font-bold text-gray-800">
                {getTotalRevisits()}
              </span>
            </div>

            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Total Revisits
            </p>
          </div>
        </div>

        {/* Detailed Behavior */}
        {behavior && (
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <ChartBarIcon
                  size={16}
                  className="text-gray-600"
                />
              </div>

              <h4 className="text-sm font-semibold text-gray-700">
                Detailed Behavior Analysis
              </h4>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-8 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">
                  Unique Questions
                </p>

                <p className="text-lg font-bold text-gray-800">
                  {behavior.unique_questions_visited ||
                    0}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">
                  Avg Visits/Question
                </p>

                <p className="text-lg font-bold text-gray-800">
                  {behavior.avg_visits_per_question ||
                    0}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">
                  Avg Time/Question
                </p>

                <p className="text-lg font-bold text-gray-800">
                  {behavior.avg_time_per_question ||
                    0}
                  s
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">
                  Time Management
                </p>

                <p
                  className="text-lg font-bold"
                  style={{
                    color:
                      pattern?.time_management_score >
                      70
                        ? "#22C55E"
                        : "#F59E0B",
                  }}
                >
                  {pattern?.time_management_score ||
                    0}
                  %
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">
                  Total Time Spent
                </p>

                <p className="text-lg font-bold text-gray-800">
                  {Math.floor(
                    totalTimeSpent / 60
                  )}
                  m {totalTimeSpent % 60}s
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">
                  Total Idle Time
                </p>

                <p className="text-lg font-bold text-orange-500">
                  {Math.floor(
                    totalIdleTime / 60
                  )}
                  m {totalIdleTime % 60}s
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">
                  Marked Questions
                </p>

                <p className="text-lg font-bold text-blue-500">
                  {totalMarkedQuestions}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">
                  Skipped Questions
                </p>

                <p className="text-lg font-bold text-gray-500">
                  {totalSkippedQuestions}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Flow */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <ClockIcon
                  size={16}
                  className="text-indigo-500"
                />
              </div>

              <h4 className="text-sm font-semibold text-gray-700">
                Navigation Flow Timeline
              </h4>

              <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Live Sequence
              </span>
            </div>

            <span className="text-[10px] text-gray-400">
              Shows exact question order
            </span>
          </div>

          {renderNavigationFlow()}
        </div>

        {/* Recommendation */}
        {pattern && (
          <div
            className={`bg-gradient-to-r ${config.bgGradient} rounded-xl p-5 border ${config.borderColor}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                <SparklesIcon
                  size={20}
                  className="text-gray-700"
                />
              </div>

              <div>
                <h5 className="text-sm font-semibold text-gray-800">
                  💡 Personalized Recommendation
                </h5>

                <p className="text-sm text-gray-600 leading-relaxed mt-0.5">
                  {config.recommendation}
                </p>

                {pattern.questions_marked_for_review >
                  0 && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 bg-white/60 rounded-lg px-3 py-1.5">
                    <span>📌</span>

                    <span>
                      You marked{" "}
                      <strong>
                        {
                          pattern.questions_marked_for_review
                        }
                      </strong>{" "}
                      question(s) for review
                    </span>

                    {pattern.total_revisits >
                      0 && (
                      <span className="text-gray-400">
                        • Revisited{" "}
                        <strong>
                          {
                            pattern.total_revisits
                          }
                        </strong>{" "}
                        question(s)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-xl p-3">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              Pattern Type
            </p>

            <p className="text-xs font-semibold text-gray-700">
              {pattern?.primary_pattern ||
                "N/A"}
            </p>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              Efficiency
            </p>

            <p
              className="text-xs font-semibold"
              style={{
                color: config.color,
              }}
            >
              {pattern?.navigation_efficiency ||
                0}
              %
            </p>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              Time Management
            </p>

            <p
              className="text-xs font-semibold"
              style={{
                color:
                  pattern?.time_management_score >
                  70
                    ? "#22C55E"
                    : "#F59E0B",
              }}
            >
              {pattern?.time_management_score ||
                0}
              %
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // DOWNLOAD REPORT
  // ============================================================

  const handleDownloadReport = async () => {
    const submissionId =
      testSubmissionId || test_submission_id;

    if (!submissionId) {
      return;
    }

    try {
      setDownloadingReport(true);

      await downloadTestReport(
        submissionId
      );
    } catch (error) {
      console.error(
        "Failed to download report:",
        error
      );
    } finally {
      setDownloadingReport(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // ============================================================
  // SUBJECT INDEX
  // ============================================================

  const getSubjectIndex = (
    subjectName
  ) => {
    return resultData?.subjects?.findIndex(
      (s) =>
        s.name
          .toLowerCase()
          .includes(subjectName)
    );
  };

  // ============================================================
  // MAIN RETURN
  // ============================================================

  return (
    <div className="report-container">

      {/* ======================================================
          HEADER / SCORE SECTION
      ====================================================== */}

      <div className="bg-gray-100 rounded-2xl p-4 md:p-6 shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Header Card */}
          <div className="lg:col-span-1 flex flex-col justify-center">
            <div>

              {/* Date */}
              {resultData?.testDate && (
                <div className="inline-flex items-center gap-1.5 text-sm text-black mb-2">
                  <CalendarIcon />

                  <span className="font-medium">
                    {new Date(
                      resultData.testDate
                    ).toDateString()}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl font-bold text-[#F59403] mb-3">
                Test Results
              </h1>

              {/* Download */}
              <button
                type="button"
                onClick={
                  handleDownloadReport
                }
                disabled={
                  downloadingReport
                }
                className="inline-flex items-center mb-3 gap-2 px-4 py-2 rounded-lg bg-[#F59403] hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm transition-all"
              >
                <DownloadOutlined />

                {downloadingReport
                  ? "Generating..."
                  : "Download Report"}
              </button>

              {/* Student / Test */}
              <div className="flex flex-wrap gap-2">

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-900 text-white w-fit">
                  <UserProfileIcon />

                  <span>
                    {resultData?.studentName}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 w-fit">
                  <DocumentIcon />

                  <span>
                    {resultData?.testName}
                  </span>
                </div>

              </div>
            </div>
          </div>

          {/* Total Score */}
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Total Score
              </span>

              <span className="text-md font-bold text-gray-800">
                {(() => {
                  const total =
                    resultData?.subjects?.reduce(
                      (acc, s) =>
                        acc +
                        (s.subject_score ||
                          0),
                      0
                    );

                  const max =
                    resultData?.subjects?.reduce(
                      (acc, s) =>
                        acc +
                        (s.subject_max_score ||
                          0),
                      0
                    );

                  return max > 0
                    ? Math.round(
                        (total / max) *
                          100
                      )
                    : 0;
                })()}
                %
              </span>
            </div>

            <div className="mb-2">
              {(() => {
                const totalScore =
                  resultData?.subjects?.reduce(
                    (acc, s) =>
                      acc +
                      (s.subject_score ||
                        0),
                    0
                  ) || 0;

                const maxScore =
                  resultData?.subjects?.reduce(
                    (acc, s) =>
                      acc +
                      (s.subject_max_score ||
                        0),
                    0
                  ) || 0;

                const colorClass =
                  totalScore > 1200
                    ? "text-green-500"
                    : totalScore >= 800
                    ? "text-orange-500"
                    : "text-red-500";

                return (
                  <>
                    <span
                      className={`text-4xl font-black ${colorClass}`}
                    >
                      {totalScore}
                    </span>

                    <span className="text-[14px] text-black font-bold uppercase ml-1">
                      OUT OF {maxScore}
                    </span>
                  </>
                );
              })()}
            </div>

            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (() => {
                    const total =
                      resultData?.subjects?.reduce(
                        (acc, s) =>
                          acc +
                          (s.subject_score ||
                            0),
                        0
                      ) || 0;

                    return total > 1200
                      ? "bg-gradient-to-r from-green-400 to-green-500"
                      : total >= 800
                      ? "bg-gradient-to-r from-orange-400 to-orange-500"
                      : "bg-gradient-to-r from-red-400 to-red-500";
                  })()
                }`}
                style={{
                  width: `${(() => {
                    const total =
                      resultData?.subjects?.reduce(
                        (acc, s) =>
                          acc +
                          (s.subject_score ||
                            0),
                        0
                      );

                    const max =
                      resultData?.subjects?.reduce(
                        (acc, s) =>
                          acc +
                          (s.subject_max_score ||
                            0),
                        0
                      );

                    return max > 0
                      ? Math.round(
                          (total / max) *
                            100
                        )
                      : 0;
                  })()}%`,
                }}
              />
            </div>
          </div>

          {/* Subject Cards */}
          {resultData?.subjects?.map(
            (subject, idx) => {
              const percent =
                subject.subject_max_score
                  ? Math.round(
                      (subject.subject_score /
                        subject.subject_max_score) *
                        100
                    )
                  : 0;

              const subScore =
                subject.subject_score || 0;

              const scoreColor =
                subScore >= 600
                  ? "text-green-500"
                  : subScore >= 400
                  ? "text-orange-500"
                  : "text-red-500";

              const progressBg =
                subScore >= 600
                  ? "from-green-400 to-green-500"
                  : subScore >= 400
                  ? "from-orange-400 to-orange-500"
                  : "from-red-400 to-red-500";

              return (
                <div
                  key={idx}
                  className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      {subject.name ===
                      "English" ? (
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

                  <div className="mb-2">
                    <span
                      className={`text-3xl font-black ${scoreColor}`}
                    >
                      {subScore}
                    </span>

                    <span className="text-[14px] text-black font-bold uppercase ml-1">
                      Out of{" "}
                      {
                        subject.subject_max_score
                      }
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${progressBg} rounded-full transition-all duration-500`}
                      style={{
                        width: `${percent}%`,
                      }}
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* ======================================================
          MAIN TABS
      ====================================================== */}

      <div className="my-5 bg-white/90 backdrop-blur-lg p-2 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-2">

          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() =>
                setActiveTab(tab)
              }
              className={`flex-1 md:min-w-[120px] min-w-[80px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer ${
                activeTab === tab
                  ? "bg-gradient-to-r from-[#F59403] to-orange-500 text-white shadow-lg shadow-orange-200"
                  : "bg-transparent text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab === "questions" ? (
                <>
                  <ChartBarIcon />

                  <span className="hidden sm:inline">
                    Question Breakdown
                  </span>
                </>
              ) : tab === "insights" ? (
                <>
                  <span>✨</span>

                  <span className="hidden sm:inline">
                    Test Insights
                  </span>
                </>
              ) : (
                <>
                  {getSubjectIcon(tab)}

                  <span className="hidden sm:inline">
                    {tab.charAt(0).toUpperCase() +
                      tab.slice(1)}{" "}
                    Analysis
                  </span>
                </>
              )}
            </button>
          ))}

        </div>
      </div>

      {/* ======================================================
          ENGLISH ANALYSIS
      ====================================================== */}

      {activeTab === "english" && (
        <>
          <CurrentTab_New
            selectedSubject={getSubjectIndex(
              "english"
            )}
            data={resultData}
            testSubmissionId={
              testSubmissionId
            }
            improvementData={improvementData}
          />
        </>
      )}

      {/* ======================================================
          MATH ANALYSIS
      ====================================================== */}

      {activeTab === "math" && (
        <>
          <CurrentTab_New
            selectedSubject={getSubjectIndex(
              "math"
            )}
            data={resultData}
            testSubmissionId={
              testSubmissionId
            }
            improvementData={improvementData}
          />
        </>
      )}

      {/* ======================================================
          QUESTION BREAKDOWN
      ====================================================== */}

      {activeTab === "questions" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mx-auto">

          {/* Header */}
          <div className="flex flex-col gap-2 mb-4">

            <div className="flex flex-wrap items-center justify-between gap-y-4">

              <h3 className="text-lg font-bold text-gray-800">
                Question-by-Question Analysis
              </h3>

              {/* Filter Buttons */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 overflow-x-auto max-w-full">

                {/* All */}
                <button
                  onClick={() =>
                    setFilterStatus("all")
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    filterStatus === "all"
                      ? "bg-white text-gray-900 shadow-sm border border-gray-100"
                      : "text-gray-500 hover:text-gray-900 border border-transparent"
                  }`}
                >
                  <span
                    className={`${
                      filterStatus === "all"
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    All
                  </span>

                  <span
                    className={`px-1.5 rounded-md text-[10px] py-0.5 ${
                      filterStatus === "all"
                        ? "bg-gray-100 text-gray-900"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {(() => {
                      const questions =
                        resultData?.subjects
                          ?.find(
                            (s) =>
                              s.name ===
                              questionMainTab
                          )
                          ?.sections?.find(
                            (sec) =>
                              sec.name ===
                              englishSubTab
                          )
                          ?.questions_data ||
                        [];

                      return questions.length;
                    })()}
                  </span>
                </button>

                {/* Correct */}
                <button
                  onClick={() =>
                    setFilterStatus(
                      filterStatus ===
                        "correct"
                        ? "all"
                        : "correct"
                    )
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    filterStatus === "correct"
                      ? "bg-white text-green-700 shadow-sm border border-green-100"
                      : "text-gray-500 hover:text-green-600 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      filterStatus ===
                      "correct"
                        ? "bg-green-500"
                        : "bg-green-400"
                    }`}
                  />

                  <span>Correct</span>

                  <span
                    className={`opacity-70 ${
                      filterStatus ===
                      "correct"
                        ? "opacity-100 font-bold"
                        : ""
                    }`}
                  >
                    {(() => {
                      const questions =
                        resultData?.subjects
                          ?.find(
                            (s) =>
                              s.name ===
                              questionMainTab
                          )
                          ?.sections?.find(
                            (sec) =>
                              sec.name ===
                              englishSubTab
                          )
                          ?.questions_data ||
                        [];

                      return questions.filter(
                        (q) =>
                          q.result &&
                          !q.is_skipped
                      ).length;
                    })()}
                  </span>
                </button>

                {/* Incorrect */}
                <button
                  onClick={() =>
                    setFilterStatus(
                      filterStatus ===
                        "incorrect"
                        ? "all"
                        : "incorrect"
                    )
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    filterStatus ===
                    "incorrect"
                      ? "bg-white text-red-700 shadow-sm border border-red-100"
                      : "text-gray-500 hover:text-red-600 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      filterStatus ===
                      "incorrect"
                        ? "bg-red-500"
                        : "bg-red-400"
                    }`}
                  />

                  <span>Incorrect</span>

                  <span
                    className={`opacity-70 ${
                      filterStatus ===
                      "incorrect"
                        ? "opacity-100 font-bold"
                        : ""
                    }`}
                  >
                    {(() => {
                      const questions =
                        resultData?.subjects
                          ?.find(
                            (s) =>
                              s.name ===
                              questionMainTab
                          )
                          ?.sections?.find(
                            (sec) =>
                              sec.name ===
                              englishSubTab
                          )
                          ?.questions_data ||
                        [];

                      return questions.filter(
                        (q) =>
                          !q.result &&
                          !q.is_skipped
                      ).length;
                    })()}
                  </span>
                </button>

                {/* Marked */}
                <button
                  onClick={() =>
                    setFilterStatus(
                      filterStatus ===
                        "marked"
                        ? "all"
                        : "marked"
                    )
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    filterStatus === "marked"
                      ? "bg-white text-blue-700 shadow-sm border border-blue-100"
                      : "text-gray-500 hover:text-blue-600 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      filterStatus ===
                      "marked"
                        ? "bg-blue-500"
                        : "bg-blue-400"
                    }`}
                  />

                  <span>Marked</span>

                  <span
                    className={`opacity-70 ${
                      filterStatus ===
                      "marked"
                        ? "opacity-100 font-bold"
                        : ""
                    }`}
                  >
                    {(() => {
                      const questions =
                        resultData?.subjects
                          ?.find(
                            (s) =>
                              s.name ===
                              questionMainTab
                          )
                          ?.sections?.find(
                            (sec) =>
                              sec.name ===
                              englishSubTab
                          )
                          ?.questions_data ||
                        [];

                      return questions.filter(
                        (q) => q.marked
                      ).length;
                    })()}
                  </span>
                </button>

                {/* Skipped */}
                <button
                  onClick={() =>
                    setFilterStatus(
                      filterStatus ===
                        "skipped"
                        ? "all"
                        : "skipped"
                    )
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    filterStatus === "skipped"
                      ? "bg-white text-gray-800 shadow-sm border border-gray-200"
                      : "text-gray-500 hover:text-gray-800 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      filterStatus ===
                      "skipped"
                        ? "bg-gray-500"
                        : "bg-gray-400"
                    }`}
                  />

                  <span>Skipped</span>

                  <span
                    className={`opacity-70 ${
                      filterStatus ===
                      "skipped"
                        ? "opacity-100 font-bold"
                        : ""
                    }`}
                  >
                    {(() => {
                      const questions =
                        resultData?.subjects
                          ?.find(
                            (s) =>
                              s.name ===
                              questionMainTab
                          )
                          ?.sections?.find(
                            (sec) =>
                              sec.name ===
                              englishSubTab
                          )
                          ?.questions_data ||
                        [];

                      return questions.filter(
                        (q) =>
                          q.is_skipped
                      ).length;
                    })()}
                  </span>
                </button>

              </div>
            </div>

            {/* Subject Tabs */}
            <div className="flex flex-wrap gap-2">

              {(resultData?.subjects || []).map(
                (subject) => (
                  <button
                    key={subject.name}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                      questionMainTab ===
                      subject.name
                        ? "bg-[#F59403] text-white shadow-md shadow-orange-100"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                    onClick={() => {
                      setQuestionMainTab(
                        subject.name
                      );

                      const firstSection =
                        subject.sections?.[0]
                          ?.name;

                      if (firstSection) {
                        setEnglishSubTab(
                          firstSection
                        );
                      }

                      setFilterStatus("all");
                    }}
                  >
                    {subject.name ===
                    "English" ? (
                      <BookIcon className="w-4 h-4" />
                    ) : (
                      <CalculatorIcon className="w-4 h-4" />
                    )}

                    {subject.name}
                  </button>
                )
              )}

            </div>

            {/* Section Tabs */}
            <div className="flex flex-wrap gap-2 mt-2">

              {resultData?.subjects
                ?.find(
                  (s) =>
                    s.name ===
                    questionMainTab
                )
                ?.sections?.map(
                  (section) => (
                    <button
                      key={section.name}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 border ${
                        englishSubTab ===
                        section.name
                          ? "bg-white text-gray-800 border-gray-300 shadow-sm"
                          : "bg-transparent text-gray-500 border-transparent hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        setEnglishSubTab(
                          section.name
                        );
                        setFilterStatus(
                          "all"
                        );
                      }}
                    >
                      {section.name}
                    </button>
                  )
                )}

            </div>
          </div>

          {/* Report Table */}
          <div className="bg-white rounded-xl">

            <ReportTable
              sectionData={(() => {
                const section =
                  resultData?.subjects
                    ?.find(
                      (s) =>
                        s.name ===
                        questionMainTab
                    )
                    ?.sections?.find(
                      (sec) =>
                        sec.name ===
                        englishSubTab
                    );

                if (!section) {
                  return null;
                }

                let filteredQuestions =
                  section.questions_data ||
                  [];

                if (
                  filterStatus ===
                  "correct"
                ) {
                  filteredQuestions =
                    filteredQuestions.filter(
                      (q) =>
                        q.result &&
                        !q.is_skipped
                    );
                } else if (
                  filterStatus ===
                  "incorrect"
                ) {
                  filteredQuestions =
                    filteredQuestions.filter(
                      (q) =>
                        !q.result &&
                        !q.is_skipped
                    );
                } else if (
                  filterStatus ===
                  "marked"
                ) {
                  filteredQuestions =
                    filteredQuestions.filter(
                      (q) => q.marked
                    );
                } else if (
                  filterStatus ===
                  "skipped"
                ) {
                  filteredQuestions =
                    filteredQuestions.filter(
                      (q) =>
                        q.is_skipped
                    );
                }

                return {
                  ...section,
                  questions_data:
                    filteredQuestions,
                };
              })()}
              testSubmissionId={
                testSubmissionId
              }
            />

          </div>
        </div>
      )}

      {/* ======================================================
          INSIGHTS
      ====================================================== */}

      {activeTab === "insights" && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 w-full">

          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Test-Taking Pattern Insights
            </h2>
          </div>

          {renderPatternInsights()}

        </div>
      )}

    </div>
  );
};

export default Admin_Report_New;