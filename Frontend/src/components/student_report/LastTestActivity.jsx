import React from "react";
import { ClockCircleOutlined, TrophyOutlined, CalendarOutlined, BarChartOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export default function LastTestActivity({ activeTab = "fullLength", fullLengthData = [], practiceData = [], onViewAll, onTestClick }) {

  const formatDate = (date) => {
    if (!date) return "-";
    return dayjs(date).format("MMM D, YYYY");
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-500";
    const s = status.toLowerCase();
    if (s === "completed") return "bg-green-50 text-green-500";
    if (s === "in_progress") return "bg-blue-50 text-blue-500";
    if (s === "yet_to_start") return "bg-yellow-50 text-yellow-500";
    return "bg-gray-50 text-gray-500";
  };

  const formatStatus = (status) => {
    if (!status) return "-";
    return status.replace(/_/g, " ");
  };

  // Get only the most recent test
  const lastFullLengthTest = fullLengthData && fullLengthData.length > 0 ? fullLengthData[0] : null;
  const lastPracticeTest = practiceData && practiceData.length > 0 ? practiceData[0] : null;

  // Check if practice test is within last 5 days
  const isWithinLast5Days = (date) => {
    if (!date) return false;
    const testDate = dayjs(date);
    const fiveDaysAgo = dayjs().subtract(5, 'day');
    return testDate.isAfter(fiveDaysAgo);
  };

  const practiceTestRecent = lastPracticeTest && isWithinLast5Days(lastPracticeTest.created_at);

  return (
    <div className="card-layout">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ClockCircleOutlined className="text-orange-500" />
          Last Activity
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="flex flex-col gap-4">

          {/* Full Length Test Card */}
          <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
            
            <div className="p-4">
              <div className="text-xs text-orange-600 font-bold mb-3 uppercase tracking-wide">Full Length Test</div>
              
              {lastFullLengthTest ? (
                <div 
                  className="cursor-pointer hover:bg-orange-50/30 transition-colors rounded-lg p-3 -m-3"
                  onClick={() => onTestClick && onTestClick(lastFullLengthTest, 'fullLength')}
                >
                  {/* Test Name and Score */}
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-800 text-base flex-1 pr-3" title={lastFullLengthTest.name}>
                      {lastFullLengthTest.name}
                    </h4>
                    <div className="text-right">
                      {lastFullLengthTest.score !== undefined ? (
                        <>
                          <div className="text-2xl font-bold text-gray-800">
                            {lastFullLengthTest.score}
                            {lastFullLengthTest.total_marks && <span className="text-xs text-gray-400 font-normal ml-1">/ {lastFullLengthTest.total_marks}</span>}
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </>
                      ) : (
                        <div className="text-2xl font-bold text-gray-300">--</div>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <CalendarOutlined className="text-gray-400" /> 
                      <span>{formatDate(lastFullLengthTest.completion_date || lastFullLengthTest.assigned_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <BarChartOutlined className="text-gray-400" /> 
                      <span>{lastFullLengthTest.course_name || "SAT"}</span>
                    </div>
                    <div className="ml-auto">
                      <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${getStatusColor(lastFullLengthTest.status)}`}>
                        {formatStatus(lastFullLengthTest.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No recent full length test
                </div>
              )}
            </div>
          </div>

          {/* Practice Test Card */}
          <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            
            <div className="p-4">
              <div className="text-xs text-blue-600 font-bold mb-3 uppercase tracking-wide">Practice Test</div>
              
              {lastPracticeTest ? (
                <div 
                  className="cursor-pointer hover:bg-blue-50/30 transition-colors rounded-lg p-3 -m-3"
                  // onClick={() => onTestClick && onTestClick(lastPracticeTest, 'practiceTest')}
                >
                  {/* Test Name and Score */}
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-800 text-base flex-1 pr-3" title={lastPracticeTest.test_name}>
                      {lastPracticeTest.test_name}
                    </h4>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {lastPracticeTest.correct_count}
                        <span className="text-xs text-gray-400 font-normal ml-1">/ {lastPracticeTest.total_questions}</span>
                      </div>
                      <div className="text-xs text-gray-500">Correct</div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <CalendarOutlined className="text-gray-400" /> 
                      <span>{formatDate(lastPracticeTest.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <TrophyOutlined className="text-gray-400" /> 
                      <span>{lastPracticeTest.course ? `${lastPracticeTest.course} - ${lastPracticeTest.subject}` : (lastPracticeTest.subject || "General")}</span>
                    </div>
                  </div>

                  {/* Warning Message */}
                  {!practiceTestRecent && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>Not attempted in last 5 days</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No practice test found
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
