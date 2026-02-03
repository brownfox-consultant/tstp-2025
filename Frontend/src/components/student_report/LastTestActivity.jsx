import React from "react";
import { ClockCircleOutlined, TrophyOutlined, CalendarOutlined, BarChartOutlined, ArrowRightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Button } from "antd";

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

  return (
    <div className="card-layout">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ClockCircleOutlined className="text-orange-500" />
          Recent Activity
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
        {/* Full Length Test Section */}
        {activeTab === "fullLength" && (
          fullLengthData && fullLengthData.length > 0 ? (
            fullLengthData.map((test, index) => (
              <div 
                key={index} 
                className="group relative overflow-hidden bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-300 cursor-pointer"
                onClick={() => onTestClick && onTestClick(test, 'fullLength')}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 rounded-l-md"></div>
                
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-2">
                    <h4 className="mt-1 font-bold text-gray-800 text-base group-hover:text-orange-600 transition-colors line-clamp-1" title={test.name}>
                      {test.name}
                    </h4>
                  </div>
                  {/* Score/Status Badge */}
                  {/* Score */}
                  <div className="flex flex-col items-end">
                    {test.score !== undefined ? (
                      <div className="text-lg font-bold text-gray-800">
                        {test.score}
                        {test.total_marks && <span className="text-[10px] text-gray-400 font-normal ml-1">/ {test.total_marks}</span>}
                      </div>
                    ) : (
                      <div className="text-lg font-bold text-gray-400"> -- </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                          <CalendarOutlined className="text-gray-400" /> 
                          {formatDate(test.completion_date || test.assigned_date)}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                          <BarChartOutlined className="text-gray-400" /> 
                          {test.course_name || "SAT"}
                      </div>
                   </div>
                   <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${getStatusColor(test.status)}`}>
                      {formatStatus(test.status)}
                   </span>
                </div>
              </div>
            ))
          ) : (
             <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No recent full length test activity found.
             </div>
          )
        )}

        {/* Practice Test Section */}
        {activeTab === "practiceTest" && (
           practiceData && practiceData.length > 0 ? (
            practiceData.map((test, index) => (
              <div 
                key={index} 
                className="group relative overflow-hidden bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-300 cursor-pointer"
                onClick={() => onTestClick && onTestClick(test, 'practiceTest')}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-md"></div>
                
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-2">
                    <h4 className="mt-1 font-bold text-gray-800 text-base group-hover:text-blue-600 transition-colors line-clamp-1" title={test.test_name}>
                      {test.test_name}
                    </h4>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-800 text-right">
                      {test.correct_count}/{test.total_questions}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                          <CalendarOutlined className="text-gray-400" /> 
                          {formatDate(test.created_at)}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                          <TrophyOutlined className="text-gray-400" /> 
                          {test.course ? `${test.course} - ${test.subject}` : (test.subject || "General")}
                      </div>
                   </div>
                   <span className="text-[9px] text-green-500 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                      Completed
                   </span>
                </div>
              </div>
            ))
           ) : (
             <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No recent practice test activity found.
             </div>
           )
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center flex-shrink-0">
        <Button 
          onClick={onViewAll}
          className="text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-2 transition-all hover:gap-3"
        >
          View All Activity <ArrowRightOutlined />
        </Button>
      </div>
    </div>
  );
}
