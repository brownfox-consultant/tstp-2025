"use client";

import { getPracticeResults, getQuestionDetails } from "@/app/services/authService";
// import useFullScreen from "@/utils/useFullScreen";
import {
  CaretRightOutlined,
  // CheckCircleFilled,
  // CloseCircleFilled,
  LeftOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  // QuestionCircleOutlined,
  // PieChartOutlined
} from "@ant-design/icons";
import { Collapse, Skeleton, Card, Tag, Divider, Row, Col, Modal, Button } from "antd";
import { useParams, useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import MathContent from "./MathContent";
import GridInOptions from "./question-list/gridin-options";
import Loading from "@/app/loading";
import RaiseDoubtModal from "./RaiseDoubtModal_qutions_review_model";

import { alphatbetArray, timeInMMSS } from "@/utils/utils";
import { 
  ReportCalendarIcon as CalendarIcon, 
  UserProfileIcon, 
  DocumentIcon, 
  ClockIcon 
} from "@/components/icons/report-icons";



const renderSelectedOptions = (selectedOptions) => {
  if (!selectedOptions) {
    return <span className="text-gray-400 italic">None</span>;
  }

  // MCQ → array
  if (Array.isArray(selectedOptions)) {
    return selectedOptions.length > 0
      ? selectedOptions.join(", ")
      : <span className="text-gray-400 italic">None</span>;
  }

  // GRIDIN → string / number
  if (typeof selectedOptions === "string" || typeof selectedOptions === "number") {
    return selectedOptions;
  }

  return <span className="text-gray-400 italic">None</span>;
};


const QuestionItem = ({ question, onClick }) => {
  const isCorrect = question.result === true;
  const hasMarked = Array.isArray(question.selected_options)
  ? question.selected_options.length > 0
  : Boolean(question.selected_options);


  // Determine Status Color and Icon
  let statusIcon = <div className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-semibold uppercase tracking-wide">Skipped</div>;
  let borderColorClass = "bg-gray-300";

  if (hasMarked) {
    if (isCorrect) {
      statusIcon = <div className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-semibold flex items-center gap-1"><CheckOutlined /> Correct</div>;
      borderColorClass = "bg-green-500";
    } else {
      statusIcon = <div className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-[10px] font-semibold flex items-center gap-1"><CloseOutlined /> Incorrect</div>;
      borderColorClass = "bg-red-500";
    }
  }

  return (
    <div className="relative bg-white rounded-lg p-3 shadow-sm transition-shadow duration-200 border border-gray-50 cursor-pointer hover:shadow-md" onClick={onClick}>
      {/* Colored Border Left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${borderColorClass}`}></div>

      <div className="pl-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-700 w-6 text-sm">#{question?.sr_no}</span>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900 text-sm">
                {question?.topic || "Question"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mr-1 justify-end">
            {/* Selections */}
            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Selections:</span>
              <span className="font-medium text-gray-700">
  {renderSelectedOptions(question.selected_options)}
</span>

            </div>

            {/* Marked */}
            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Marked:</span>
              <span className="font-medium text-gray-700">{question.marked ? "Yes" : "No"}</span>
            </div>

            <div className="flex items-center gap-1 text-gray-400 text-xs pl-2 border-l border-gray-100">
              <ClockCircleOutlined />
              <span>{question.total_time}s</span>
            </div>
            {statusIcon}
          </div>
        </div>
      </div>
    </div>
  );
};

function PracticeTestResult() {
  const { practice_test_id, id } = useParams();
  const router = useRouter();
  const [resultDetails, setResultDetails] = useState();
  const [skeletonLoading, setSkeletonLoading] = useState(false);
  const pathname = usePathname();
  const role = pathname.split("/")[2];

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null); // Full details fetched from API
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedListQuestion, setSelectedListQuestion] = useState(null); // Keep summary for navigation context
  const [showDoubt, setShowDoubt] = useState(false);

  useEffect(() => {
    setSkeletonLoading(true);
    getPracticeResults(practice_test_id)
      .then(({ data }) => {
        setResultDetails(data);
      })
      .finally(() => setSkeletonLoading(false));
  }, []);

  // Fetch details of the selected question
  useEffect(() => {
    if (currentQuestionId) {
      setModalData(null); // Clear previous data to show loading
      let params = {
        practice_test_result_id: practice_test_id
      };

      getQuestionDetails(currentQuestionId, params).then((res) => {
        setModalData(res.data.detail);
      }).catch(err => {
        console.error("Failed to fetch question details", err);
      });
    }
  }, [currentQuestionId, practice_test_id]);


  // Calculate stats
  const correctCount = resultDetails?.section_correct_count ?? 0;
  const incorrectCount = resultDetails?.section_incorrect_count ?? 0;
  const totalQuestions = resultDetails?.questions_data?.length ?? 0;
  const unansweredCount = totalQuestions - correctCount - incorrectCount;
  const questionsList = resultDetails?.questions_data || [];

  const handleBack = () => {
    if (role === "student") {
      router.push(`/tstp/${role}/${id}/test/practice`);
    } else {
      router.push(`/tstp/${role}/${id}/practice`);
    }
  };

  const handleQuestionClick = (question, index) => {
    setSelectedListQuestion(question);
    setCurrentQuestionId(question.question_id);
    setCurrentQuestionIndex(index);
    setIsModalOpen(true);
  };


  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, CORRECT, INCORRECT, UNANSWERED

  const handleNavigation = (direction) => {
    const newIndex = currentQuestionIndex + direction;
    // Note: This logic might need adjustment if using filtered list for navigation index
    // Currently re-using original list for global index safety but filtered list in view
    if (newIndex >= 0 && newIndex < questionsList.length) {
      const nextQ = questionsList[newIndex];
      setSelectedListQuestion(nextQ);
      setCurrentQuestionId(nextQ.question_id);
      setCurrentQuestionIndex(newIndex);
    }
  };

  const filteredQuestions = questionsList.filter(q => {
    if (filterStatus === "ALL") return true;
    
    const isCorrect = q.result === true;
    const hasSelected = Array.isArray(q.selected_options) && q.selected_options.length > 0;
    
    if (filterStatus === "CORRECT") return isCorrect;
    if (filterStatus === "INCORRECT") return !isCorrect && hasSelected;
    if (filterStatus === "UNANSWERED") return !hasSelected;
    
    return true;
  });

  return (
    <div className="min-h-screen pb-6 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 mb-2">
          <button
            onClick={handleBack}
            className="w-fit px-3 py-2 flex items-center justify-center gap-2 rounded bg-white hover:bg-white border border-gray-200 text-gray-700 font-medium shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 text-sm"
          >
            <LeftOutlined /> Back
          </button>
        </div>

        <Skeleton active loading={skeletonLoading}>
          {/* ======================================================
              HEADER / SCORE SECTION
          ====================================================== */}
          <div className="bg-gray-200 rounded-xl p-4 md:p-6 shadow-md mb-6 mt-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Header Card */}
              <div className="lg:col-span-1 flex flex-col justify-center py-2">
                {/* Date */}
                {resultDetails?.testDate && (
                  <div className="inline-flex items-center gap-1.5 text-sm text-black mb-2">
                    <CalendarIcon />
                    <span className="font-medium">
                      {new Date(resultDetails.testDate).toDateString()}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h1 className="text-xl lg:text-2xl font-bold text-[#F59403] mb-4">
                  Practice Test Results
                </h1>

                {/* Student / Test */}
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-900 text-white w-fit">
                    <UserProfileIcon className="w-3 h-3 text-white" />
                    <span className="truncate max-w-[120px]">{resultDetails?.student_name || "Student"}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 w-fit">
                    <DocumentIcon className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{resultDetails?.name || "Practice Test"}</span>
                  </div>
                </div>
              </div>

              {/* Topics Card */}
              {(() => {
                const uniqueTopics = Array.from(new Set(resultDetails?.questions_data?.map(q => q.topic).filter(Boolean)));
                if (uniqueTopics.length === 0) return null;
                return (
                  <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col hover:shadow-md transition-shadow lg:col-span-1">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                        Topics
                      </span>
                    </div>
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
                      const total = resultDetails?.section_correct_count || 0;
                      const max = resultDetails?.questions_data?.length || 0;
                      return max > 0 ? Math.round((total / max) * 100) : 0;
                    })()}
                    %
                  </span>
                </div>

                <div className="mb-2">
                  {(() => {
                    const total = resultDetails?.section_correct_count || 0;
                    const max = resultDetails?.questions_data?.length || 0;
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
                        const total = resultDetails?.section_correct_count || 0;
                        const max = resultDetails?.questions_data?.length || 0;
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
                        const total = resultDetails?.section_correct_count || 0;
                        const max = resultDetails?.questions_data?.length || 0;
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
                    <span className="text-sm font-bold text-gray-800">{timeInMMSS(resultDetails?.time_on_section || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-sm text-gray-600 font-medium">On Correct:</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{timeInMMSS(resultDetails?.section_correct_time_taken || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="text-sm text-gray-600 font-medium">On Incorrect:</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">{timeInMMSS(resultDetails?.section_incorrect_time_taken || 0)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ======================================================
              ANALYSIS OVERVIEW
          ====================================================== */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 w-full mb-6">
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
                  onClick={() => setFilterStatus("ALL")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    filterStatus === "ALL"
                      ? "bg-white text-gray-800 shadow-sm border border-gray-200"
                      : "text-gray-500 hover:text-gray-800 border border-transparent"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === "ALL" ? "bg-gray-800" : "bg-gray-400"}`} />
                  <span>All</span>
                  <span className={`opacity-70 ${filterStatus === "ALL" ? "opacity-100 font-bold" : ""}`}>
                    {totalQuestions}
                  </span>
                </button>

                {/* Correct */}
                <button
                  onClick={() => setFilterStatus("CORRECT")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    filterStatus === "CORRECT"
                      ? "bg-white text-gray-800 shadow-sm border border-gray-200"
                      : "text-gray-500 hover:text-gray-800 border border-transparent"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === "CORRECT" ? "bg-green-500" : "bg-gray-400"}`} />
                  <span>Correct</span>
                  <span className={`opacity-70 ${filterStatus === "CORRECT" ? "opacity-100 font-bold" : ""}`}>
                    {correctCount}
                  </span>
                </button>

                {/* Incorrect */}
                <button
                  onClick={() => setFilterStatus("INCORRECT")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    filterStatus === "INCORRECT"
                      ? "bg-white text-gray-800 shadow-sm border border-gray-200"
                      : "text-gray-500 hover:text-gray-800 border border-transparent"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === "INCORRECT" ? "bg-red-500" : "bg-gray-400"}`} />
                  <span>Incorrect</span>
                  <span className={`opacity-70 ${filterStatus === "INCORRECT" ? "opacity-100 font-bold" : ""}`}>
                    {incorrectCount}
                  </span>
                </button>

                {/* Unanswered */}
                <button
                  onClick={() => setFilterStatus("UNANSWERED")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    filterStatus === "UNANSWERED"
                      ? "bg-white text-gray-800 shadow-sm border border-gray-200"
                      : "text-gray-500 hover:text-gray-800 border border-transparent"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === "UNANSWERED" ? "bg-blue-500" : "bg-gray-400"}`} />
                  <span>Unanswered</span>
                  <span className={`opacity-70 ${filterStatus === "UNANSWERED" ? "opacity-100 font-bold" : ""}`}>
                    {unansweredCount}
                  </span>
                </button>
              </div>
            </div>

            {/* Question List */}
            <div className="space-y-3 mt-4">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((question, index) => (
                  <QuestionItem
                    key={question.question_id || index}
                    question={question}
                    onClick={() => handleQuestionClick(question, index)}
                  />
                ))
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                   <p className="text-gray-400 italic text-sm">No questions found for the filter "{filterStatus.toLowerCase()}".</p>
                   <button 
                      onClick={() => setFilterStatus('ALL')}
                      className="mt-2 text-indigo-600 font-semibold text-xs hover:underline"
                   >
                      Clear Filter
                   </button>
                </div>
              )}
            </div>
          </div>
        </Skeleton>

        {/* Question Review Modal */}
        <Modal
          centered
          width={(selectedListQuestion?.question_type === "MCQ" || modalData?.question_type === "MCQ") ? "70rem" : "64rem"}
          open={isModalOpen}
          title={
            `Reviewing Question ${currentQuestionIndex + 1}`
          }
          onCancel={() => {
            setIsModalOpen(false);
            setModalData(null);
            setCurrentQuestionId(null);
          }}
          footer={
            <div className="flex justify-between w-full">
              <button
                icon={<LeftOutlined />}
                disabled={currentQuestionIndex === 0}
                onClick={() => handleNavigation(-1)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Previous
              </button>
              {role === "student" && (
                // <div className="w-full flex justify-center my-8">
                <button
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                  onClick={() => setShowDoubt(true)}
                >
                  Raise a doubt
                </button>
                // </div>
              )}
              <button
                type="primary"
                icon={<CaretRightOutlined />}
                iconPosition="end"
                disabled={currentQuestionIndex === questionsList.length - 1}
                onClick={() => handleNavigation(1)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Next
              </button>
            </div>
          }
        >
          {!modalData ? (
            <div className="flex justify-center items-center min-h-[60vh]">
              <Loading />
            </div>
          ) : (
            <>
              {/* ===== Question Meta Info (Compact Inline) ===== */}
              <div className="w-full h-[2px] bg-gray-300 mt-2"></div>
              <div className="flex items-center flex-wrap gap-2 my-2 text-xs md:text-sm text-gray-800">
                <span className="flex items-center gap-1">
                  <span className="font-bold">Difficulty:</span> {modalData.difficulty || "N/A"}
                </span>
                <span className="text-gray-400">|</span>
                <span className="flex items-center gap-1">
                  <span className="font-bold">Question Type:</span> {modalData.question_type || "N/A"}
                </span>
                <span className="text-gray-400">|</span>
                <span className="flex items-center gap-1">
                  <span className="font-bold">Topic:</span> {modalData.topic || "N/A"}
                </span>
                <span className="text-gray-400">|</span>
                <span className="flex items-center gap-1">
                  <span className="font-bold">Sub Topic:</span> {modalData.sub_topic || "N/A"}
                </span>
                <span className="text-gray-400">|</span>
                <span className="flex items-center gap-1">
                  <span className="font-bold">Time Taken:</span>
                  {modalData.time_taken ? timeInMMSS(modalData.time_taken) : "0s"}
                </span>
                {modalData.fastest_solve_time !== undefined && (
                  <>
                    <span className="text-gray-400">|</span>
                    <span className="flex items-center gap-1">
                      <span className="font-bold">Fastest Solve Time:</span>
                      <span className={modalData.fastest_solve_time ? "text-emerald-600 font-bold" : ""}>
                        {modalData.fastest_solve_time ? timeInMMSS(modalData.fastest_solve_time) : "-"}
                      </span>
                    </span>
                  </>
                )}
              </div>
              <div className="w-full h-[2px] bg-gray-300 mt-2"></div>

              <div className="w-full flex md:flex-row flex-col gap-4 mt-4">
                {/* Reading Comprehension Passage */}
                {modalData.question_subtype === "READING_COMPREHENSION" && (
                  <div className="flex-1 mx-auto border overflow-y-scroll overflow-x-hidden max-h-full p-3 rounded-md bg-gray-50 border-gray-200">
                    <span className="block text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-2">Passage</span>
                    <MathContent
                      cls="p-1"
                      content={modalData?.reading_comprehension_passage}
                    />
                  </div>
                )}

                {/* Question Description */}
                <div className="flex-1 pl-1 border border-gray-200 max-h-full p-3 rounded-md bg-gray-50">
                  <span className="block text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-2 ">Question</span>
                  <MathContent content={modalData.description} />
                </div>
              </div>

              {/* MCQ Options */}
              {modalData.question_type === "MCQ" && (
                <div>
                  <div className="font-bold my-3">Options:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modalData.options?.map(({ description, is_correct }, index) => {
                      const isSelected = (selectedListQuestion?.selected_options ?? []).includes(index);
                      const isCorrect = is_correct;

                      let boxClass = "bg-white border border-gray-200";
                      // Logic for colors
                      if (isSelected && isCorrect) {
                        boxClass = "font-medium bg-green-100 border-green-300";
                      } else if (isSelected) {
                        boxClass = "font-medium bg-red-50 border-red-200";
                      } else if (isCorrect) {
                        boxClass = "font-medium bg-green-100 border-green-300";
                      }

                      return (
                        <div key={index} className="flex items-center gap-3">
                          <span className="font-medium text-gray-700 w-5 flex-shrink-0">{alphatbetArray[index]}.</span>
                          <div className={`flex-1 p-3 rounded-lg min-h-[48px] flex items-center transition-all duration-200 ${boxClass}`}>
                            <MathContent content={description} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grid-In Type Question */}
              {modalData.question_type === "GRIDIN" && (
                <div>
                  <div className="font-bold my-3">Your Answer:</div>
                  <span className="border-2 rounded-md px-2 py-1">
                    {selectedListQuestion?.selected_options}
                  </span>
                  <GridInOptions question={modalData} />
                </div>
              )}

              {/* Explanation */}
              {modalData.explanation && (
                <>
                  <div className="font-bold mt-4 mb-2">Explanation:</div>
                  <div className="bg-white border-2 p-2 rounded-md max-h-80 overflow-auto mb-3">
                    <MathContent cls="p-2" content={modalData.explanation} />
                  </div>
                </>
              )}

              {/* Raise doubt button */}

            </>
          )}
        </Modal>

        {showDoubt && role === "student" && (
          <RaiseDoubtModal
            open={showDoubt}
            onClose={() => setShowDoubt(false)}
            question={currentQuestionId}
            section={modalData?.section?.id || modalData?.section || modalData?.section_id}
            course_subject={modalData?.course_subject?.id || modalData?.course_subject || modalData?.course_subject_id}
            test={Number(resultDetails?.practice_test?.id || resultDetails?.practice_test || resultDetails?.test?.id || resultDetails?.test)}
          />
        )}

      </div>
    </div>
  );
}

export default PracticeTestResult;
