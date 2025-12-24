"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "@/app/constants/apiConstants";

export default function Math_SubTopicPractice({
  student_id,
  course_id,
  test_type,
}) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH API ---------------- */
  useEffect(() => {
    if (!student_id || !course_id || !test_type) return;
    fetchData();
  }, [student_id, course_id, test_type]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/api/result/SubTopic_Wise_Practice/?student_id=${student_id}&course_id=${course_id}&test_type=${test_type}`,
        { withCredentials: true }
      );

      // Filter Math
      const mathBlock = res.data.find(
        (s) => s.subject?.toLowerCase() === "math"
      );

      setTopics(mathBlock?.topics || []);
    } catch (err) {
      console.error("Math SubTopic API Error:", err);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if no topics OR all subtopics have 0 values
  const hasNoData = !topics.length || topics.every((t) => 
    !t.subtopics?.length || t.subtopics.every((s) => 
      (s.practiced_questions || 0) === 0 && (s.accuracy_percent || 0) === 0
    )
  );

  
  if (hasNoData) {
    return (
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
        <h2 className="text-lg md:text-xl font-extrabold text-gray-800 mb-6">
          Sub – Topic Wise Practice
        </h2>
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl border border-gray-200 p-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-slate-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-gray-700 mb-2">No Data Available</h4>
          <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
            Start practicing to see your sub-topic wise practice distribution here!
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
      {/* Legend */}
      <div className="flex justify-center gap-4 md:gap-6 mb-6 flex-wrap">
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-600">
          <span className="w-3 h-3 rounded-full bg-[#F59403]"></span>
          <span>Questions</span>
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-600">
          <span className="w-3 h-3 rounded-full bg-[#FFD36A]"></span>
          <span>Time</span>
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-600">
          <span className="w-3 h-3 rounded-full bg-[#0071BC]"></span>
          <span>Accuracy</span>
        </div>
      </div>

      {topics.map((sec, i) => (
        <div key={i} className="mb-6">
          {/* Topic Title */}
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-100">
            {sec.topic}
          </h3>

          {/* Subtopics Chart */}
          <div className="relative pb-4">
            {sec.subtopics.map((item, j) => {
              const practicePercent = item.practice_percent || 0;
              const avgTime = item.avg_time_seconds || 0;
              const accuracyPercent = item.accuracy_percent || 0;
              const practicedQuestions = item.practiced_questions || 0;
              const totalQuestions = item.total_questions || 0;
              const timePercent = Math.min(avgTime, 100);

              return (
                <div key={j} className="flex flex-col md:flex-row items-start gap-1 md:gap-3 mb-3">
                  {/* Label */}
                  <div className="w-full md:w-56 md:min-w-56 text-[11px] md:text-xs font-medium text-gray-600 md:text-right leading-tight">
                    {item.subtopic}
                  </div>
                  
                  {/* Bars Container */}
                  <div className="flex-1 relative flex flex-col gap-1 min-w-0 pr-10 md:pr-14">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 right-12 md:right-16 pointer-events-none">
                      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((val) => (
                        <div 
                          key={val} 
                          className="absolute top-0 bottom-0 w-px bg-gray-100"
                          style={{ left: `${val}%` }}
                        />
                      ))}
                    </div>

                    {/* Questions Bar */}
                    <div className="relative h-2">
                      <div 
                        className="h-full bg-[#F59403]"
                        style={{ width: `${Math.max(practicePercent, 0.5)}%` }}
                      />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#F59403] border-2 border-white shadow"
                        style={{ left: `${practicePercent}%`, transform: 'translate(-50%, -50%)' }}
                      />
                      <span 
                        className="absolute top-1/2 -translate-y-1/2 text-[10px] md:text-xs font-semibold text-gray-700 whitespace-nowrap"
                        style={{ left: `calc(${practicePercent}% + 14px)` }}
                      >
                        {practicedQuestions}/{totalQuestions}
                      </span>
                    </div>

                    {/* Time Bar */}
                    <div className="relative h-2">
                      <div 
                        className="h-full bg-[#FFD36A]"
                        style={{ width: `${Math.max(timePercent, 0.5)}%` }}
                      />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#FFD36A] border-2 border-white shadow"
                        style={{ left: `${timePercent}%`, transform: 'translate(-50%, -50%)' }}
                      />
                      <span 
                        className="absolute top-1/2 -translate-y-1/2 text-[10px] md:text-xs font-semibold text-gray-700 whitespace-nowrap"
                        style={{ left: `calc(${timePercent}% + 14px)` }}
                      >
                        {avgTime > 0 ? `${avgTime.toFixed(1)}s` : '0s'}
                      </span>
                    </div>

                    {/* Accuracy Bar */}
                    <div className="relative h-2">
                      <div 
                        className="h-full bg-[#0071BC]"
                        style={{ width: `${Math.max(accuracyPercent, 0.5)}%` }}
                      />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#0071BC] border-2 border-white shadow"
                        style={{ left: `${accuracyPercent}%`, transform: 'translate(-50%, -50%)' }}
                      />
                      <span 
                        className="absolute top-1/2 -translate-y-1/2 text-[10px] md:text-xs font-semibold text-gray-700 whitespace-nowrap"
                        style={{ left: `calc(${accuracyPercent}% + 14px)` }}
                      >
                        {accuracyPercent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* X-Axis Labels */}
            <div className="relative ml-0 md:ml-60 mr-12 md:mr-16 h-5 mt-2">
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((val) => (
                <span 
                  key={val} 
                  className="absolute -translate-x-1/2 text-[9px] md:text-[10px] text-gray-400"
                  style={{ left: `${val}%` }}
                >
                  {val}%
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
