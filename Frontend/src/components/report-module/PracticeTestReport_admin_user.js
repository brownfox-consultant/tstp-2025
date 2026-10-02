import { getPracticeResults } from "@/app/services/authService";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ReportTable from "./report-table";
import Loading from "@/app/loading";
import { timeInMMSS } from "@/utils/utils";
import { 
  ReportCalendarIcon as CalendarIcon, 
  UserProfileIcon, 
  DocumentIcon, 
  ClockIcon 
} from "@/components/icons/report-icons";

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
    <div className="report-container">
      {/* ======================================================
          HEADER / SCORE SECTION
      ====================================================== */}
      <div className="bg-gray-300 rounded-xl p-4 md:p-6 shadow-md mb-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Header Card */}
          <div className="lg:col-span-1 flex flex-col justify-center py-2">
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
            <h1 className="text-xl lg:text-2xl font-bold text-[#F59403] mb-4">
              Test Results
            </h1>

            {/* Student / Test */}
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-900 text-white w-fit">
                <UserProfileIcon className="w-3 h-3 text-white" />
                <span className="truncate max-w-[120px]">{resultData?.student_name}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 w-fit">
                <DocumentIcon className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{resultData?.name}</span>
              </div>
            </div>
          </div>

          {/* Topics Card */}
          {(() => {
            const uniqueTopics = Array.from(new Set(resultData?.questions_data?.map(q => q.topic).filter(Boolean)));
            if (uniqueTopics.length === 0) return null;
            return (
              <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col hover:shadow-md transition-shadow lg:col-span-1">
              
                <div className="flex-1 overflow-y-auto max-h-[100px] hide-scrollbar">
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    {uniqueTopics.join(", ")}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Accuracy Card */}
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Accuracy
              </span>
              <span className="text-md font-bold text-gray-800">
                {(() => {
                  const total = resultData.section_correct_count || 0;
                  const max = resultData.questions_data?.length || 0;
                  return max > 0 ? Math.round((total / max) * 100) : 0;
                })()}
                %
              </span>
            </div>

            <div className="mb-2">
              {(() => {
                const total = resultData.section_correct_count || 0;
                const max = resultData.questions_data?.length || 0;
                const percent = max > 0 ? (total / max) * 100 : 0;
                const colorClass = percent >= 75 ? "text-green-500" : percent >= 50 ? "text-orange-500" : "text-red-500";

                return (
                  <>
                    <span className={`text-4xl font-black ${colorClass}`}>
                      {total}
                    </span>
                    <span className="text-[14px] text-black font-bold uppercase ml-1">
                      OUT OF {max}
                    </span>
                  </>
                );
              })()}
            </div>

            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (() => {
                    const total = resultData.section_correct_count || 0;
                    const max = resultData.questions_data?.length || 0;
                    const percent = max > 0 ? (total / max) * 100 : 0;
                    return percent >= 75
                      ? "bg-gradient-to-r from-green-400 to-green-500"
                      : percent >= 50
                      ? "bg-gradient-to-r from-orange-400 to-orange-500"
                      : "bg-gradient-to-r from-red-400 to-red-500";
                  })()
                }`}
                style={{
                  width: `${(() => {
                    const total = resultData.section_correct_count || 0;
                    const max = resultData.questions_data?.length || 0;
                    return max > 0 ? Math.round((total / max) * 100) : 0;
                  })()}%`,
                }}
              />
            </div>
          </div>

          {/* Time Stats Card */}
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Time Management
              </span>
            </div>
            
            <div className="flex flex-col justify-around h-full gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClockIcon className="text-gray-500" />
                  <span className="text-sm text-gray-600 font-medium">Total Time:</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{timeInMMSS(resultData.time_on_section)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-sm text-gray-600 font-medium">On Correct:</span>
                </div>
                <span className="text-sm font-bold text-emerald-600">{timeInMMSS(resultData.section_correct_time_taken)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-sm text-gray-600 font-medium">On Incorrect:</span>
                </div>
                <span className="text-sm font-bold text-red-600">{timeInMMSS(resultData.section_incorrect_time_taken)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ======================================================
          ANALYSIS OVERVIEW
      ====================================================== */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 w-full mb-2">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Analysis Overview
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {/* All */}
            <button
              onClick={() => setFilterStatus("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                filterStatus === "all"
                  ? "bg-white text-gray-800 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-800 border border-transparent"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === "all" ? "bg-gray-800" : "bg-gray-400"}`} />
              <span>All</span>
              <span className={`opacity-70 ${filterStatus === "all" ? "opacity-100 font-bold" : ""}`}>
                {resultData.questions_data?.length || 0}
              </span>
            </button>

            {/* Correct */}
            <button
              onClick={() => setFilterStatus("correct")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                filterStatus === "correct"
                  ? "bg-white text-gray-800 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-800 border border-transparent"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === "correct" ? "bg-green-500" : "bg-gray-400"}`} />
              <span>Correct</span>
              <span className={`opacity-70 ${filterStatus === "correct" ? "opacity-100 font-bold" : ""}`}>
                {resultData.section_correct_count || 0}
              </span>
            </button>

            {/* Incorrect */}
            <button
              onClick={() => setFilterStatus("incorrect")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                filterStatus === "incorrect"
                  ? "bg-white text-gray-800 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-800 border border-transparent"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === "incorrect" ? "bg-red-500" : "bg-gray-400"}`} />
              <span>Incorrect</span>
              <span className={`opacity-70 ${filterStatus === "incorrect" ? "opacity-100 font-bold" : ""}`}>
                {resultData.section_incorrect_count || 0}
              </span>
            </button>

            {/* Blank */}
            <button
              onClick={() => setFilterStatus("blank")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                filterStatus === "blank"
                  ? "bg-white text-gray-800 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-800 border border-transparent"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === "blank" ? "bg-gray-500" : "bg-gray-400"}`} />
              <span>Blank</span>
              <span className={`opacity-70 ${filterStatus === "blank" ? "opacity-100 font-bold" : ""}`}>
                {resultData.section_blank_count || 0}
              </span>
            </button>

            {/* Marked */}
            <button
              onClick={() => setFilterStatus("marked")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                filterStatus === "marked"
                  ? "bg-white text-gray-800 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-800 border border-transparent"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === "marked" ? "bg-orange-500" : "bg-gray-400"}`} />
              <span>Marked</span>
              <span className={`opacity-70 ${filterStatus === "marked" ? "opacity-100 font-bold" : ""}`}>
                {resultData.marked || 0}
              </span>
            </button>
          </div>
        </div>

        {/* Table */}
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
      </div>
    </div>
  );
}


export default PracticeTestReport;
