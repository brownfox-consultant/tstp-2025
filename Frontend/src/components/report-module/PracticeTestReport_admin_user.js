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
          <div className="flex flex-wrap items-center gap-4">
            {/* Correct */}
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2.5 rounded-xl">
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <CorrectIcon />
              </div>
              <span className="font-bold text-emerald-700 text-lg">{resultData.section_correct_count}</span>
              <span className="text-emerald-600 font-medium">Correct</span>
            </div>

            {/* Incorrect */}
            <div className="flex items-center gap-2 bg-red-50 px-4 py-2.5 rounded-xl">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <IncorrectIcon />
              </div>
              <span className="font-bold text-red-700 text-lg">{resultData.section_incorrect_count}</span>
              <span className="text-red-600 font-medium">Incorrect</span>
            </div>

            <div className="flex items-center gap-2 bg-red-50 px-4 py-2.5 rounded-xl">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <EmptyCircleIcon />
              </div>
              <span className="font-bold text-red-700 text-lg">{resultData.section_blank_count}</span>
              <span className="text-red-600 font-medium">Blank</span>
            </div>

            <div className="flex items-center gap-2 bg-orange-50 px-4 py-2.5 rounded-xl">
              <FlagIcon />
              <span className="font-bold text-orange-700">{resultData.marked}</span>
              <span className="text-orange-600 font-medium">Marked</span>
            </div>
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
      <ReportTable sectionData={resultData} testSubmissionId={practiceTestId} />
      {/* <ReportStats sectionData={resultData} testSubmissionId={practiceTestId} /> */}
    </div>
  );
}


export default PracticeTestReport;
