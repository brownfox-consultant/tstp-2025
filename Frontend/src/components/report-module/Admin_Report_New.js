"use client";
import './ReportNew.css';
import { getTestResult } from "@/app/services/authService";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CurrentTab_New from "./CurrentTab_New";
import ReportTable from "./report-table";
import StudentActivityLog from "./StudentActivityLog";
import { Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
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

const Admin_Report_New = ({ testSubmissionId, onClose }) => {
  const [activeTab, setActiveTab] = useState("english");
  const [questionMainTab, setQuestionMainTab] = useState("english");
  const [englishSubTab, setEnglishSubTab] = useState("sectionA");
  const [resultData, setResultData] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const searchParams = useSearchParams();
  const test_submission_id = searchParams.get("test_submission_id");
  const [selectedFlowSection, setSelectedFlowSection] = useState(null);
  const router = useRouter();
  const availableSubjects = resultData?.subjects?.map(s => s.name.toLowerCase()) || [];
  const tabs = [...availableSubjects, "questions", "insights"];

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

      const defaultSection = defaultSubject.sections?.[0]?.name || "";
      setEnglishSubTab(defaultSection);
    }

    // ⭐ Add this
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
  
  const getSubjectIcon = (subjectName) => {
    const name = subjectName?.toLowerCase();
    if (name?.includes("english") || name?.includes("reading") || name?.includes("writing")) {
      return <BookIcon className="w-4 h-4" />;
    } else if (name?.includes("math") || name?.includes("calculator")) {
      return <CalculatorIcon className="w-4 h-4" />;
    }
    return <ChartBarIcon size={20} className="w-4 h-4" />;
  };




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


// ✅ Get all sections for flow selector
  const getAllSections = () => {
    const sections = [];
    resultData?.subjects?.forEach(subject => {
      subject.sections?.forEach(section => {
        sections.push({
          subject: subject.name,
          section: section.name
        });
      });
    });
    return sections;
  };

  // ✅ Build Navigation Flow Timeline - WITH DEDUPLICATION
  const buildNavigationFlow = (subjectName, sectionName) => {

    console.log("subjectName", subjectName);
console.log("sectionName", sectionName);
    const subject = resultData?.subjects?.find(s => s.name === subjectName);
    if (!subject) return [];

    const section = subject.sections?.find(sec => sec.name === sectionName);
    if (!section || !section.questions_data) return [];

    const questions = section.questions_data;
    const flow = [];
    const questionMap = {};

    
    
    // Build map of question_id to sr_no and status
    questions.forEach(q => {
      questionMap[q.question_id] = {
        sr_no: q.sr_no,
        is_correct: q.result,
        is_skipped: q.is_skipped,
        marked: q.marked
      };
    });

    // Get all navigation actions from all questions
    const allActions = [];
    questions.forEach(q => {
      if (q.navigation_actions && q.navigation_actions.length > 0) {
        q.navigation_actions.forEach(action => {
          const qInfo = questionMap[q.question_id];
          if (qInfo) {
            allActions.push({
              ...action,
              sr_no: qInfo.sr_no,
              question_id: q.question_id,
              is_correct: qInfo.is_correct,
              is_skipped: qInfo.is_skipped,
              marked: qInfo.marked
            });
          }
        });
      }
    });

    // Sort by timestamp
    allActions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // ✅ DEDUPLICATE: Only add when question changes or action type changes
    let lastSrNo = null;
    let lastActionType = null;
    
    allActions.forEach(action => {
      // Skip if same question and same action type (prevents duplicate NEXT actions on same question)
      if (action.sr_no === lastSrNo && action.action_type === lastActionType) {
        return;
      }
      
      // Also skip if it's a SUBMIT action that doesn't change the question
      if (action.action_type === 'SUBMIT' && action.sr_no === lastSrNo) {
        return;
      }
      
      const last = flow[flow.length - 1];

if (!last || last.sr_no !== action.sr_no) {
    flow.push({
        sr_no: action.sr_no,
        question_id: action.question_id,
        action_type: action.action_type,
        time_spent: action.time_spent || 0,
        is_correct: action.is_correct,
        is_skipped: action.is_skipped,
        marked: action.marked,
        timestamp: action.timestamp
    });
}
      
      lastSrNo = action.sr_no;
      lastActionType = action.action_type;
    });

    return flow;
  };

  console.log("selectedFlowSection", selectedFlowSection);

console.log("subjects", resultData.subjects);

console.log(
  resultData.subjects?.[0]?.sections?.[0]?.questions_data?.[0]
);

  // ✅ Render Navigation Flow Timeline - SINGLE DEFINITION
    const renderNavigationFlow = () => {
      const flow = buildNavigationFlow(
        selectedFlowSection?.subject,
        selectedFlowSection?.section
      );
      
      const allSections = getAllSections();
  
      if (flow.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <ActivityIcon size={48} className="mx-auto mb-3 opacity-30" />
            <p>No navigation data available for this section.</p>
            <p className="text-sm">Complete the test with navigation tracking enabled to see insights.</p>
          </div>
        );
      }
  
      // Group by action type for statistics
      const nextCount = flow.filter(f => f.action_type === 'NEXT').length;
      const prevCount = flow.filter(f => f.action_type === 'PREVIOUS').length;
      const jumpCount = flow.filter(f => f.action_type === 'JUMP').length;
  
      // Get unique questions visited in order of first visit
      const uniqueQuestions = [];
      const seen = new Set();
      flow.forEach(f => {
        if (!seen.has(f.sr_no)) {
          seen.add(f.sr_no);
          uniqueQuestions.push(f.sr_no);
        }
      });
  
      // Count revisits (questions that appear more than once)
      const visitCounts = {};
      flow.forEach(f => {
        visitCounts[f.sr_no] = (visitCounts[f.sr_no] || 0) + 1;
      });
      const revisits = Object.values(visitCounts).filter(v => v > 1).length;
  
      // Build sequence string - clean version with unique transitions
      const sequenceString = flow.map(f => `Q${f.sr_no}`).join(' → ');
  
      // ✅ Get color for question status
      const getQuestionColor = (item) => {
        if (item.is_correct && !item.is_skipped) return 'bg-green-500 text-white border-green-600';
        if (item.is_skipped) return 'bg-gray-400 text-white border-gray-500';
        if (!item.is_correct && !item.is_skipped) return 'bg-red-500 text-white border-red-600';
        return 'bg-gray-200 text-gray-600 border-gray-300';
      };
  
      // ✅ Get action icon
      const getActionIcon = (actionType) => {
        switch(actionType) {
          case 'PREVIOUS': return { icon: '←', color: 'text-blue-500' };
          case 'JUMP': return { icon: '↕', color: 'text-purple-500' };
          default: return { icon: '→', color: 'text-green-500' };
        }
      };
  
      return (
        <div className="space-y-4">
          {/* Section Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Navigation Sections:</span>
            <div className="flex flex-wrap gap-2">
              {allSections.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedFlowSection(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedFlowSection?.subject === s.subject && selectedFlowSection?.section === s.section
                      ? 'bg-primary-color text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s.subject} - {s.section}
                </button>
              ))}
            </div>
          </div>
  
          {/* Flow Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-gray-50 rounded-xl p-4">
            <div className="text-center">
              <div className="text-xs text-gray-400">Total Steps</div>
              <div className="text-xl font-bold text-gray-800">{flow.length}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Unique Questions</div>
              <div className="text-xl font-bold text-gray-800">{uniqueQuestions.length}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Revisits</div>
              <div className="text-xl font-bold text-orange-500">{revisits}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Total Time</div>
              <div className="text-xl font-bold text-gray-800">
                {flow.reduce((sum, f) => sum + f.time_spent, 0)}s
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Avg Time/Step</div>
              <div className="text-xl font-bold text-gray-800">
                {flow.length > 0 ? Math.round(flow.reduce((sum, f) => sum + f.time_spent, 0) / flow.length) : 0}s
              </div>
            </div>
          </div>
  
          {/* Navigation Actions Breakdown */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-gray-500 font-medium">Navigation Actions:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-green-500 font-bold">→</span>
              <span className="text-gray-600">{nextCount} Next</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-blue-500 font-bold">←</span>
              <span className="text-gray-600">{prevCount} Previous</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-purple-500 font-bold">↕</span>
              <span className="text-gray-600">{jumpCount} Jump</span>
            </div>
          </div>
  
          {/* Flow Visualization - Clean Timeline */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Navigation Timeline</h4>
            <div className="relative overflow-x-auto pb-4">
              <div className="flex items-center gap-1 min-w-max px-2">
                {flow.map((item, index) => {
                  const colorClass = getQuestionColor(item);
                  const action = getActionIcon(item.action_type);
  
                  return (
                    <div key={index} className="flex items-center">
                      {/* Question Box */}
                      <div
                        className={`relative flex-shrink-0 w-9 h-9 rounded-lg ${colorClass} font-bold text-sm flex items-center justify-center border-2 shadow-sm transition-all hover:scale-110 hover:shadow-md cursor-pointer group`}
                        title={`Q${item.sr_no} - ${item.action_type} (${item.time_spent}s)${item.marked ? ' 📌' : ''}${item.is_correct ? ' ✅' : item.is_skipped ? ' ⏭' : ' ❌'}`}
                      >
                        <span className="relative z-10">{item.sr_no}</span>
                        {item.marked && (
                          <span className="absolute -top-1 -right-1 text-[8px]">📌</span>
                        )}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {item.time_spent}s
                        </div>
                      </div>
  
                      {/* Arrow between questions */}
                      {index < flow.length - 1 && (
                        <div className="flex-shrink-0 mx-0.5">
                          <span className={`text-lg font-bold ${action.color}`}>{action.icon}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
  
            {/* Complete Sequence */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Complete Sequence:</div>
              <div className="text-sm font-mono text-gray-700 break-all max-h-24 overflow-y-auto">
                {sequenceString}
              </div>
            </div>
          </div>
  
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-gray-500 font-medium">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-green-500"></span>
              <span className="text-gray-600">Correct</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-red-500"></span>
              <span className="text-gray-600">Incorrect</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-gray-400"></span>
              <span className="text-gray-600">Skipped</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-green-500 font-bold">→</span>
              <span className="text-gray-600">Next</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-blue-500 font-bold">←</span>
              <span className="text-gray-600">Previous</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-purple-500 font-bold">↕</span>
              <span className="text-gray-600">Jump</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-blue-500">📌</span>
              <span className="text-gray-600">Marked</span>
            </div>
          </div>
        </div>
      );
    };

    // ✅ Render Navigation Pattern Insights (Main Insights tab)
      const renderPatternInsights = () => {
        const pattern = resultData?.navigation_pattern;
        const behavior = resultData?.test_taking_behavior;
        
        if (!pattern && !behavior) {
          return (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ActivityIcon size={40} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600">No Navigation Data Available</h3>
              <p className="text-sm text-gray-400 mt-1">Complete the test with navigation tracking enabled to see insights.</p>
            </div>
          );
        }
    
        // Pattern labels and colors
        const patternConfig = {
          'SEQUENTIAL': {
            label: '📊 Sequential Explorer',
            description: 'You follow the test in order, one question at a time. This systematic approach helps maintain focus and manage time effectively.',
            color: '#22C55E',
            bgGradient: 'from-green-50 to-emerald-50',
            borderColor: 'border-green-200',
            iconBg: 'bg-green-100',
            textColor: 'text-green-700',
            recommendation: 'Great systematic approach! Continue following the test in order for optimal time management. Consider occasionally jumping to difficult questions to maximize your score.'
          },
          'JUMPING': {
            label: '🎯 Strategic Navigator',
            description: 'You strategically skip difficult questions and return to them later. This shows excellent time management and test-taking strategy.',
            color: '#F59E0B',
            bgGradient: 'from-amber-50 to-orange-50',
            borderColor: 'border-amber-200',
            iconBg: 'bg-amber-100',
            textColor: 'text-amber-700',
            recommendation: 'Excellent strategy! Jumping between questions shows good time management. Focus on returning to skipped questions with remaining time. Practice identifying which questions to skip quickly.'
          },
          'BACK_AND_FORTH': {
            label: '🔄 Thorough Reviewer',
            description: 'You frequently revisit questions, indicating a thorough review process. This shows attention to detail but may impact time management.',
            color: '#3B82F6',
            bgGradient: 'from-blue-50 to-indigo-50',
            borderColor: 'border-blue-200',
            iconBg: 'bg-blue-100',
            textColor: 'text-blue-700',
            recommendation: 'Consider building more confidence in your initial answers to reduce back-and-forth movement. Practice similar questions to improve accuracy. Trust your instincts more often.'
          },
          'MIXED': {
            label: '🎨 Adaptive Thinker',
            description: 'You use a combination of navigation strategies, adapting to different question types and difficulty levels.',
            color: '#8B5CF6',
            bgGradient: 'from-purple-50 to-violet-50',
            borderColor: 'border-purple-200',
            iconBg: 'bg-purple-100',
            textColor: 'text-purple-700',
            recommendation: 'Flexible approach detected! Identify which strategy works best for different question types. Consider being more consistent in your approach to save time.'
          }
        };
    
        const config = pattern?.primary_pattern ? patternConfig[pattern.primary_pattern] : patternConfig['MIXED'];

         const getTotalRevisits = () => {
  let totalRevisits = 0;

  resultData?.subjects?.forEach(subject => {
    subject.sections?.forEach(section => {
      const flow = buildNavigationFlow(subject.name, section.name);

      const visitCounts = {};

      flow.forEach(item => {
        visitCounts[item.sr_no] = (visitCounts[item.sr_no] || 0) + 1;
      });

      // Count questions that were revisited in this section
      totalRevisits += Object.values(visitCounts).filter(v => v > 1).length;
    });
  });

  return totalRevisits;
};
    
        return (
          <div className="space-y-6">
            {/* Pattern Summary Card - Hero Card */}
            <div className={`bg-gradient-to-r ${config.bgGradient} rounded-2xl p-6 border ${config.borderColor} shadow-sm`}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center text-2xl`}>
                      {pattern?.primary_pattern === 'SEQUENTIAL' && '📊'}
                      {pattern?.primary_pattern === 'JUMPING' && '🎯'}
                      {pattern?.primary_pattern === 'BACK_AND_FORTH' && '🔄'}
                      {pattern?.primary_pattern === 'MIXED' && '🎨'}
                      {!pattern?.primary_pattern && '✦'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {config.label}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span 
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <span className="text-xs text-gray-500">Primary Test-Taking Pattern</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mt-1">
                    {config.description}
                  </p>
                </div>
                {pattern && (
                  <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-gray-100 shadow-sm">
                    <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Efficiency Score</div>
                    <div className="text-3xl font-bold" style={{ color: config.color }}>
                      {pattern.navigation_efficiency}%
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${pattern.navigation_efficiency}%`,
                          backgroundColor: config.color 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
    
            {/* Stats Grid - 4 Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <ActivityIcon size={20} className="text-blue-500" />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{pattern?.total_navigations || 0}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 font-medium">Total Navigations</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <TrendingUpIcon size={20} className="text-green-500" />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{pattern?.sequential_moves || 0}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 font-medium">Sequential Moves</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <TrendingDownIcon size={20} className="text-orange-500" />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{pattern?.jump_moves || 0}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 font-medium">Jump Moves</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <TargetIcon size={20} className="text-purple-500" />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{getTotalRevisits()}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 font-medium">Total Revisits</p>
              </div>
            </div>
    
            {/* Detailed Behavior Stats */}
            {behavior && (
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <ChartBarIcon size={16} className="text-gray-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-700">Detailed Behavior Analysis</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Unique Questions</p>
                    <p className="text-lg font-bold text-gray-800">{behavior.unique_questions_visited || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Avg Visits/Question</p>
                    <p className="text-lg font-bold text-gray-800">{behavior.avg_visits_per_question || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Avg Time/Question</p>
                    <p className="text-lg font-bold text-gray-800">{behavior.avg_time_per_question || 0}s</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Time Management</p>
                    <p className="text-lg font-bold" style={{ color: pattern?.time_management_score > 70 ? '#22C55E' : '#F59E0B' }}>
                      {pattern?.time_management_score || 0}%
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Marked for Review</p>
                    <p className="text-lg font-bold text-gray-800">{pattern?.questions_marked_for_review || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Sections Skipped</p>
                    <p className="text-lg font-bold text-gray-800">{pattern?.sections_skipped || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Total Time Spent</p>
                    <p className="text-lg font-bold text-gray-800">
                      {Math.floor((behavior.total_time_spent || 0) / 60)}m {Math.round((behavior.total_time_spent || 0) % 60)}s
                    </p>
                  </div>
                </div>
              </div>
            )}
    
            {/* ⭐ NAVIGATION FLOW TIMELINE */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <ClockIcon size={16} className="text-indigo-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-700">Navigation Flow Timeline</h4>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Live Sequence</span>
                </div>
                <span className="text-[10px] text-gray-400">Shows exact question order</span>
              </div>
              {renderNavigationFlow()}
            </div>
    
            {/* Recommendation Card */}
            {pattern && (
              <div className={`bg-gradient-to-r ${config.bgGradient} rounded-xl p-5 border ${config.borderColor}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <SparklesIcon size={20} className="text-gray-700" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-800">💡 Personalized Recommendation</h5>
                    <p className="text-sm text-gray-600 leading-relaxed mt-0.5">
                      {config.recommendation}
                    </p>
                    {pattern.questions_marked_for_review > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 bg-white/60 rounded-lg px-3 py-1.5">
                        <span>📌</span>
                        <span>You marked <strong>{pattern.questions_marked_for_review}</strong> question(s) for review</span>
                        {pattern.total_revisits > 0 && (
                          <span className="text-gray-400">• Revisited <strong>{pattern.total_revisits}</strong> question(s)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
    
            {/* Quick Stats Footer */}
            <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-xl p-3">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Pattern Type</p>
                <p className="text-xs font-semibold text-gray-700">{pattern?.primary_pattern || 'N/A'}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Efficiency</p>
                <p className="text-xs font-semibold" style={{ color: config.color }}>
                  {pattern?.navigation_efficiency || 0}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Time Management</p>
                <p className="text-xs font-semibold" style={{ color: pattern?.time_management_score > 70 ? '#22C55E' : '#F59E0B' }}>
                  {pattern?.time_management_score || 0}%
                </p>
              </div>
            </div>
          </div>
        );
      };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
      <Spin size="large" />
      </div>
    );
  }

  const getSubjectIndex = (subjectName) => {
    return resultData?.subjects?.findIndex(s => s.name.toLowerCase().includes(subjectName));
  };

  return (
    <div className="report-container">
      {/* <button
        className="h-10 px-5 flex items-center justify-center gap-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium shadow-sm transition-all duration-300 hover:shadow-md mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeftOutlined className="text-sm" /> Back
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

          {/* 2. Total Score Card - White Background */}
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Total Score
              </span>
              <span className="text-md font-bold text-gray-800">
                {(() => {
                  const total = resultData?.subjects?.reduce((acc, s) => acc + (s.subject_score || 0), 0);
                  const max = resultData?.subjects?.reduce((acc, s) => acc + (s.subject_max_score || 0), 0);
                  return max > 0 ? Math.round((total / max) * 100) : 0;
                })()}%
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              {(() => {
                const totalScore = resultData?.subjects?.reduce((acc, s) => acc + (s.subject_score || 0), 0) || 0;
                const maxScore = resultData?.subjects?.reduce((acc, s) => acc + (s.subject_max_score || 0), 0) || 0;
                const colorClass = totalScore > 1200 ? 'text-green-500' : totalScore >= 800 ? 'text-orange-500' : 'text-red-500';
                return (
                  <div>
                    <span className={`text-4xl font-black ${colorClass}`}>
                      {totalScore}
                    </span>
                    <span className="text-[14px] text-black font-bold uppercase ml-1">
                      OUT OF {maxScore}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (() => {
                    const total = resultData?.subjects?.reduce((acc, s) => acc + (s.subject_score || 0), 0) || 0;
                    return total > 1200 ? 'bg-gradient-to-r from-green-400 to-green-500' : total >= 800 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gradient-to-r from-red-400 to-red-500';
                  })()
                }`}
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
            const subScore = subject.subject_score || 0;
            const scoreColor = subScore >= 600 ? 'text-green-500' : subScore >= 400 ? 'text-orange-500' : 'text-red-500';
            const progressBg = subScore >= 600 ? 'from-green-400 to-green-500' : subScore >= 400 ? 'from-orange-400 to-orange-500' : 'from-red-400 to-red-500';

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
                <div className="mb-2">
                  <span className={`text-3xl font-black ${scoreColor}`}>
                    {subScore} 
                  </span>
                  <span className="text-[14px] text-black font-bold uppercase ml-1">
                    Out of {subject.subject_max_score}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${progressBg} rounded-full transition-all duration-500`}
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
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:min-w-[120px] min-w-[80px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer ${activeTab === tab
                  ? 'bg-gradient-to-r from-[#F59403] to-orange-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
            >
              {tab === "questions" ? (
                <>
                  <ChartBarIcon />
                  <span className="hidden sm:inline">Question Breakdown</span>
                </>
              ) : tab === "insights" ? (
  <>
    <span>✨</span>
    <span className="hidden sm:inline">Test Insights</span>
  </>
)
              
              : (
                <>
                  {getSubjectIcon(tab)}
                  <span className="hidden sm:inline">{tab.charAt(0).toUpperCase() + tab.slice(1)} Analysis</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* English Analysis */}
      {activeTab === "english" && (
        <>
          <CurrentTab_New selectedSubject={getSubjectIndex("english")} data={resultData} testSubmissionId={testSubmissionId} />
          {/* {renderFocusAreas("English")} */}
        </>
      )}

      {/* Math Analysis */}
      {activeTab === "math" && (
        <>
          <CurrentTab_New selectedSubject={getSubjectIndex("math")} data={resultData} testSubmissionId={testSubmissionId} />
          {/* {renderFocusAreas("Math")} */}
        </>
      )}

      {/* Question Breakdown */}
      {activeTab === "questions" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mx-auto">
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
