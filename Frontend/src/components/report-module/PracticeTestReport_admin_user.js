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
      <div className="bg-gray-200 rounded-2xl shadow-sm border border-gray-100 p-6 mb-2">
        {/* Top Row - Title and Student Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          {/* Left Side - Back + Title */}
          <div className="flex items-start gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
            >
              <BackIcon />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-[#F59403]">{resultData.name}</span>
              </h1>
              <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                <CalendarIcon />
                <span>Student took this test on:</span>
                <span className="font-medium text-gray-700">
                  {new Date(resultData.testDate).toDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Student Info */}
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full flex items-center justify-center text-white font-bold">
              {resultData.student_name?.charAt(0).toUpperCase()}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Student Name</p>
              <p className="font-semibold text-gray-800">{resultData.student_name}</p>
            </div>
          </div>
        </div>

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
          <div className="flex flex-wrap gap-6">
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
