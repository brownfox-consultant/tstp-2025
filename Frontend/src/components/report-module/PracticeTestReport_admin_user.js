import { getPracticeResults } from "@/app/services/authService";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ReportTable from "./report-table";
import Loading from "@/app/loading";
// import BookmarkIcon from "../../../public/bookmark2.svg";
// import {
//   CheckCircleTwoTone,
//   CloseCircleTwoTone,
//   LeftOutlined,
// } from "@ant-design/icons";
import { timeInMMSS } from "@/utils/utils";
// import Image from "next/image";
// import ReportStats from "./report-stats";
import { BackIcon, ReportCalendarIcon as CalendarIcon, UserIcon, ClockIcon, FlagIcon, CorrectIcon, IncorrectIcon, EmptyCircleIcon } from "@/components/icons/report-icons";

function PracticeTestReport({ practiceTestId, onClose }) {
  const [resultData, setResultData] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");
  const router = useRouter();

  useEffect(() => {
    if (practiceTestId) {
      getPracticeResults(practiceTestId).then((res) => {
        setResultData(res.data);
      });
    }
  }, [practiceTestId]);

  if (!practiceTestId) return null;

  return Object.keys(resultData).length == 0 ? (
    <Loading />
  ) : (
    <div>
      {/* Header Card */}
      <div className="bg-gray-100 rounded-2xl p-4 md:p-6 shadow-md mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          
          {/* Header Card (Left Side) */}
          <div className="lg:col-span-1 flex flex-col justify-center">
            <div>
              {/* Date */}
              {resultData?.testDate && (
                <div className="inline-flex items-center gap-1.5 text-sm text-black mb-2">
                  <CalendarIcon />
                  <span className="font-medium">
                    {new Date(resultData.testDate).toDateString()}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl font-bold text-[#F59403] mb-3">
                {resultData.name || "Practice Test Results"}
              </h1>

              {/* Student info */}
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-900 text-white w-fit">
                  <UserIcon className="w-3 h-3 text-white" />
                  <span>{resultData?.student_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Topics (Center) */}
          <div className="lg:col-span-2 md:col-span-2 col-span-2 flex flex-col justify-center">
            <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 h-full flex flex-col justify-center">
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide block mb-2">
                Topics Covered
              </span>
              <p className="text-md font-semibold text-gray-800 leading-relaxed">
                {(() => {
                  const uniqueTopics = [...new Set((resultData?.questions_data || []).map(q => q.topic).filter(Boolean))];
                  return uniqueTopics.length > 0 ? uniqueTopics.join(', ') : 'N/A';
                })()}
              </p>
            </div>
          </div>

          {/* Accuracy Score */}
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Accuracy
              </span>
              <span className="text-md font-bold text-gray-800">
                {(() => {
                  const total = resultData.questions_data?.length || 0;
                  const correct = resultData.section_correct_count || 0;
                  return total > 0 ? Math.round((correct / total) * 100) : 0;
                })()}%
              </span>
            </div>
            
            <div className="mb-2">
              {(() => {
                const total = resultData.questions_data?.length || 0;
                const correct = resultData.section_correct_count || 0;
                const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
                const colorClass = percent >= 75 ? "text-green-500" : percent >= 50 ? "text-orange-500" : "text-red-500";
                
                return (
                  <>
                    <span className={`text-4xl font-black ${colorClass}`}>
                      {correct}
                    </span>
                    <span className="text-[14px] text-black font-bold uppercase ml-1">
                      OUT OF {total}
                    </span>
                  </>
                );
              })()}
            </div>

            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (() => {
                    const total = resultData.questions_data?.length || 0;
                    const correct = resultData.section_correct_count || 0;
                    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
                    return percent >= 75 ? "bg-gradient-to-r from-green-400 to-green-500" : percent >= 50 ? "bg-gradient-to-r from-orange-400 to-orange-500" : "bg-gradient-to-r from-red-400 to-red-500";
                  })()
                }`}
                style={{
                  width: `${(() => {
                    const total = resultData.questions_data?.length || 0;
                    const correct = resultData.section_correct_count || 0;
                    return total > 0 ? Math.round((correct / total) * 100) : 0;
                  })()}%`
                }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Filter and Time Stats Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        {/* Stats Row */}
        <div className="flex flex-wrap">
          {/* Left - Score Stats */}
          <div className="flex flex-wrap items-center gap-2">
            {/* All */}
            <button 
              onClick={() => setFilterStatus('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border ${
                filterStatus === 'all' 
                  ? 'bg-slate-100 border-slate-500 shadow-sm' 
                  : 'bg-white border-transparent hover:bg-gray-50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${filterStatus === 'all' ? 'bg-slate-200' : 'bg-slate-100'}`}>
                <span className="text-[10px] font-bold text-slate-700">All</span>
              </div>
              <span className="font-bold text-slate-800">{resultData.questions_data?.length || 0}</span>
              <span className="text-xs font-medium text-slate-600">Total</span>
            </button>

            {/* Correct */}
            <button 
              onClick={() => setFilterStatus(filterStatus === 'correct' ? 'all' : 'correct')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border ${
                filterStatus === 'correct' 
                  ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                  : 'bg-white border-transparent hover:bg-gray-50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${filterStatus === 'correct' ? 'bg-emerald-500' : 'bg-emerald-100'}`}>
                <CorrectIcon className={filterStatus === 'correct' ? "text-white w-3 h-3" : "text-emerald-500 w-3 h-3"} />
              </div>
              <span className="font-bold text-emerald-700">{resultData.section_correct_count}</span>
              <span className="text-xs font-medium text-emerald-600">Correct</span>
            </button>

            {/* Incorrect */}
            <button 
              onClick={() => setFilterStatus(filterStatus === 'incorrect' ? 'all' : 'incorrect')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border ${
                filterStatus === 'incorrect' 
                  ? 'bg-red-50 border-red-500 shadow-sm' 
                  : 'bg-white border-transparent hover:bg-gray-50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${filterStatus === 'incorrect' ? 'bg-red-500' : 'bg-red-100'}`}>
                <IncorrectIcon className={filterStatus === 'incorrect' ? "text-white w-3 h-3" : "text-red-500 w-3 h-3"} />
              </div>
              <span className="font-bold text-red-700">{resultData.section_incorrect_count}</span>
              <span className="text-xs font-medium text-red-600">Incorrect</span>
            </button>

            {/* Blank */}
            <button 
              onClick={() => setFilterStatus(filterStatus === 'blank' ? 'all' : 'blank')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border ${
                filterStatus === 'blank'
                  ? 'bg-gray-100 border-gray-500 shadow-sm'
                  : 'bg-white border-transparent hover:bg-gray-50'
              }`}
            >
               <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${filterStatus === 'blank' ? 'bg-white border-gray-400' : 'bg-white border-gray-200'}`}>
                <EmptyCircleIcon className="w-3 h-3 text-gray-600" />
              </div>
              <span className="font-bold text-gray-800">{resultData.section_blank_count}</span>
              <span className="text-xs font-medium text-gray-600">Blank</span>
            </button>

            {/* Marked */}
            <button 
              onClick={() => setFilterStatus(filterStatus === 'marked' ? 'all' : 'marked')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border ${
                filterStatus === 'marked' 
                  ? 'bg-orange-50 border-orange-500 shadow-sm' 
                  : 'bg-white border-transparent hover:bg-gray-50'
              }`}
            >
              <FlagIcon className="text-orange-500 w-3 h-3" />
              <span className="font-bold text-orange-700">{resultData.marked}</span>
              <span className="text-xs font-medium text-orange-600">Marked</span>
            </button>
          </div>
        </div>

        {/* Time Stats Row */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <ClockIcon />
              <span className="text-gray-600">Time On Section:</span>
              <span className="font-semibold text-gray-800">{timeInMMSS(resultData.time_on_section)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-gray-600">Time On Correct:</span>
              <span className="font-semibold text-emerald-600">{timeInMMSS(resultData.section_correct_time_taken)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-gray-600">Time On Incorrect:</span>
              <span className="font-semibold text-red-600">{timeInMMSS(resultData.section_incorrect_time_taken)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <ReportTable 
        sectionData={(() => {
          let questions = resultData.questions_data || [];
          
          if (filterStatus === 'correct') {
            questions = questions.filter(q => q.result && !q.is_skipped);
          } else if (filterStatus === 'incorrect') {
            questions = questions.filter(q => !q.result && !q.is_skipped);
          } else if (filterStatus === 'blank') {
            questions = questions.filter(q => q.is_skipped);
          } else if (filterStatus === 'marked') {
            questions = questions.filter(q => q.marked);
          }

          return { ...resultData, questions_data: questions };
        })()} 
        testSubmissionId={practiceTestId} 
      />
      {/* <ReportStats sectionData={resultData} testSubmissionId={practiceTestId} /> */}
    </div>
  );
}


export default PracticeTestReport;
