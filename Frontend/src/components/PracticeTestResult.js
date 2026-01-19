"use client";

import { getPracticeResults, getQuestionDetails } from "@/app/services/authService";
import useFullScreen from "@/utils/useFullScreen";
import {
  CaretRightOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  LeftOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  QuestionCircleOutlined,
  PieChartOutlined
} from "@ant-design/icons";
import { Collapse, Skeleton, Card, Tag, Divider, Row, Col, Modal, Button } from "antd";
import { useParams, useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import MathContent from "./MathContent";
import GridInOptions from "./question-list/gridin-options";
import Loading from "@/app/loading";
import RaiseDoubtModal from "./RaiseDoubtModal_qutions_review_model";

import { alphatbetArray, timeInMMSS } from "@/utils/utils";

const QuestionItem = ({ question, onClick }) => {
  const isCorrect = question.result === true;
  const hasMarked = Array.isArray(question.selected_options) && question.selected_options.length > 0;

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
                {question.selected_options.length > 0
                  ? question.selected_options.join(", ")
                  : <span className="text-gray-400 italic">None</span>
                }
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
  const role = pathname.split("/")[1];

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
      router.push(`/${role}/${id}/test/practice`);
    } else {
      router.push(`/${role}/${id}/practice`);
    }
  };

  const handleQuestionClick = (question, index) => {
    setSelectedListQuestion(question);
    setCurrentQuestionId(question.question_id);
    setCurrentQuestionIndex(index);
    setIsModalOpen(true);
  };

  const handleNavigation = (direction) => {
    const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < questionsList.length) {
      const nextQ = questionsList[newIndex];
      setSelectedListQuestion(nextQ);
      setCurrentQuestionId(nextQ.question_id);
      setCurrentQuestionIndex(newIndex);
    }
  };

  return (
    <div className="min-h-screen pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              Practice Test Result
            </h1>
          </div>
          <button
            onClick={handleBack}
            className="w-fit px-4 py-2 flex items-center justify-center gap-2 rounded-full bg-white hover:bg-white border border-gray-200 text-gray-700 font-medium shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 text-sm"
          >
            <LeftOutlined /> Back to Practice
          </button>
        </div>

        <Skeleton active loading={skeletonLoading}>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-3">
            {/* Correct */}
            <Card className="border-0 shadow-sm rounded-xl overflow-hidden relative" bodyStyle={{ padding: '16px' }}>
              <div className="absolute right-0 top-0 p-3 opacity-20">
                <CheckCircleFilled className="text-5xl text-gray-300" />
              </div>
              <div className="relative z-10">
                <div className="text-2xl font-bold text-green-600 mb-0.5">{correctCount}</div>
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Correct</div>
              </div>
              <div className="h-1 w-full bg-green-100 absolute bottom-0 left-0">
                <div className="h-full bg-green-500" style={{ width: `${(correctCount / totalQuestions) * 100}%` }}></div>
              </div>
            </Card>

            {/* Incorrect */}
            <Card className="border-0 shadow-sm rounded-xl overflow-hidden relative" bodyStyle={{ padding: '16px' }}>
              <div className="absolute right-0 top-0 p-3 opacity-20">
                <CloseCircleFilled className="text-5xl text-gray-300" />
              </div>
              <div className="relative z-10">
                <div className="text-2xl font-bold text-red-600 mb-0.5">{incorrectCount}</div>
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Incorrect</div>
              </div>
              <div className="h-1 w-full bg-red-100 absolute bottom-0 left-0">
                <div className="h-full bg-red-500" style={{ width: `${(incorrectCount / totalQuestions) * 100}%` }}></div>
              </div>
            </Card>

            {/* Unanswered */}
            <Card className="border-0 shadow-sm rounded-xl overflow-hidden relative" bodyStyle={{ padding: '16px' }}>
              <div className="absolute right-0 top-0 p-3 opacity-20">
                <QuestionCircleOutlined className="text-5xl text-gray-300" />
              </div>
              <div className="relative z-10">
                <div className="text-2xl font-bold text-blue-600 mb-0.5">{unansweredCount}</div>
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Unanswered</div>
              </div>
              <div className="h-1 w-full bg-blue-100 absolute bottom-0 left-0">
                <div className="h-full bg-blue-500" style={{ width: `${(unansweredCount / totalQuestions) * 100}%` }}></div>
              </div>
            </Card>

            {/* Total Questions */}
            <Card className="border-0 shadow-sm rounded-xl overflow-hidden relative" bodyStyle={{ padding: '16px' }}>
              <div className="absolute right-0 top-0 p-3 opacity-20">
                <PieChartOutlined className="text-5xl text-gray-300" />
              </div>
              <div className="relative z-10">
                <div className="text-2xl font-bold text-purple-600 mb-0.5">{totalQuestions}</div>
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total Questions</div>
              </div>
              <div className="h-1 w-full bg-purple-100 absolute bottom-0 left-0">
                <div className="h-full bg-purple-500" style={{ width: '100%' }}></div>
              </div>
            </Card>
          </div>

          {/* Detailed Question List */}
          <Card
            title={<span className="font-bold text-gray-800 text-base">Question Analysis</span>}
            className="shadow-sm border-gray-100 rounded-xl"
            bodyStyle={{ padding: '16px' }}
          >
            <div className="space-y-3">
              {resultDetails?.questions_data?.map((question, index) => (
                <QuestionItem
                  key={question.question_id || index}
                  question={question}
                  onClick={() => handleQuestionClick(question, index)}
                />
              ))}
            </div>
          </Card>
        </Skeleton>

        {/* Question Review Modal */}
        <Modal
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
              <Button
                icon={<LeftOutlined />}
                disabled={currentQuestionIndex === 0}
                onClick={() => handleNavigation(-1)}
              >
                Previous
              </Button>

              <Button
                type="primary"
                icon={<CaretRightOutlined />}
                iconPosition="end"
                className="bg-black hover:!bg-gray-800"
                disabled={currentQuestionIndex === questionsList.length - 1}
                onClick={() => handleNavigation(1)}
              >
                Next
              </Button>
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
              <div className="flex items-center flex-wrap gap-10 my-2 text-xs md:text-sm text-gray-800">
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
                  <span className="font-bold">Total Time:</span>
                  {modalData.time_taken ? timeInMMSS(modalData.time_taken) : "0s"}
                </span>
              </div>
              <div className="w-full h-[2px] bg-gray-300 mt-2"></div>

              <div className="w-full flex gap-8">
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
                <div className="flex-1 my-4 pl-1">
                  <span className="block text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-2">Question</span>
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
                  <span className="border-2 border-r-4 rounded-lg px-2 py-1">
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
              {role === "student" && (
                <div className="w-full flex justify-center my-8">
                  <button
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                    onClick={() => setShowDoubt(true)}
                  >
                    Raise a doubt
                  </button>
                </div>
              )}
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
