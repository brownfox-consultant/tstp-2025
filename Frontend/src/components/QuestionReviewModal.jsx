


import React, { useCallback, useEffect, useState } from "react";
import { Modal, Button, Tooltip } from "antd";
import { CommentOutlined } from "@ant-design/icons";

import Loading from "@/app/loading";
import {
  getQuestionDetails,
} from "@/app/services/authService";

import MathContent from "./MathContent";
import GridInOptions from "./question-list/gridin-options";
import RaiseDoubtModal from "./RaiseDoubtModal_qutions_review_model";
import Comment from "./Comment";

import { alphatbetArray, timeInMMSS } from "@/utils/utils";


function QuestionReviewModal({
  open,
  onClose,
  questionId,
  questionsList = [],
  sectionId,
  courseSubjectId,
  testId,
  selectedOptions = [],
  role,
  testType,
  testSubmissionId,
}) {
  const [data, setData] = useState(null);
  const [showDoubt, setShowDoubt] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestionId, setCurrentQuestionId] = useState(questionId);
  const [currentSelectedOptions, setCurrentSelectedOptions] =
    useState(selectedOptions);
  const [currentSrno, setCurrentSrno] = useState(null);

  // Build the same parameters used by the existing question-details API.
  const getQuestionParams = useCallback(() => {
    if (testType === "FULL_LENGTH_TEST") {
      return {
        test_submission_id: testSubmissionId,
      };
    }

    return {
      practice_test_result_id: testSubmissionId,
    };
  }, [testType, testSubmissionId]);

  // Fetch question details, including doubt information.
  const fetchQuestionDetails = useCallback(async () => {
    if (!currentQuestionId) {
      setData(null);
      return;
    }

    try {
      setData(null);

      const response = await getQuestionDetails(
        currentQuestionId,
        getQuestionParams()
      );

      const responseData = response?.data || {};

      setData({
        ...(responseData.detail || {}),
        doubt_created: Boolean(responseData.doubt_created),
        doubt: responseData.doubt ?? null,

        // Keep an ID if the API supplies one.
        doubt_id:
          responseData.doubt_id ??
          responseData.doubt?.id ??
          responseData.doubt?.pk ??
          responseData.doubt?.doubt_id ??
          responseData.detail?.doubt_id ??
          null,
      });
    } catch (error) {
      console.error("Failed to load question details:", error);
      setData(null);
    }
  }, [currentQuestionId, getQuestionParams]);

  // Set the initial question when the review modal opens.
  useEffect(() => {
    if (!open) return;

    const idx = questionsList.findIndex(
      (question) => question.question_id === questionId
    );

    const initialIndex = idx >= 0 ? idx : 0;
    const initialQuestion = questionsList[initialIndex];

    setCurrentIndex(initialIndex);
    setCurrentQuestionId(questionId);
    setCurrentSelectedOptions(
      initialQuestion?.selected_options || selectedOptions || []
    );
    setCurrentSrno(
      initialQuestion?.db_Srno || initialIndex + 1
    );
    setCommentOpen(false);
  }, [open, questionId, questionsList, selectedOptions]);

  // Reload the selected question whenever its ID or API parameters change.
  useEffect(() => {
    if (open && currentQuestionId) {
      fetchQuestionDetails();
    }
  }, [open, currentQuestionId, fetchQuestionDetails]);

  // Resolve the doubt ID from the question-details response.
  // Comment.jsx requires the actual doubt record ID.
  const doubtId =
    data?.doubt_id ??
    (typeof data?.doubt === "object"
      ? data.doubt?.id ?? data.doubt?.pk ?? data.doubt?.doubt_id
      : null);

  const hasDoubt = Boolean(data?.doubt_created && doubtId);

  // Navigate between questions.
  const handleNavigation = (direction) => {
    const newIndex = currentIndex + direction;

    if (newIndex < 0 || newIndex >= questionsList.length) {
      return;
    }

    const newQuestion = questionsList[newIndex];

    setCommentOpen(false);
    setCurrentIndex(newIndex);
    setCurrentQuestionId(newQuestion.question_id);
    setCurrentSelectedOptions(newQuestion.selected_options || []);
    setCurrentSrno(newQuestion.db_Srno || newIndex + 1);
  };

  // Open the existing doubt-creation modal.
  const handleRaiseDoubt = () => {
    setShowDoubt(true);
  };

  // Called when the doubt modal closes.
  // Refresh question details so the Comment button can become enabled.
  const handleDoubtModalClose = async () => {
    setShowDoubt(false);
    setCommentOpen(false);
    await fetchQuestionDetails();
  };

  const handleReviewClose = () => {
    setShowDoubt(false);
    setCommentOpen(false);
    onClose();
  };

  return (
    <>
      <Modal
        width={data?.question_type === "MCQ" ? "80rem" : "64rem"}
        open={open}
        style={{ top: 20 }}
        title={
          role === "student"
            ? `Reviewing Question ${currentIndex + 1}`
            : `Reviewing Question ${currentIndex + 1} (Question Id: ${currentSrno})`
        }
        onCancel={handleReviewClose}
        footer={
          <div className="flex justify-between">
            <Button
              disabled={currentIndex === 0}
              onClick={() => handleNavigation(-1)}
            >
              Previous
            </Button>

            <Button
              disabled={currentIndex >= questionsList.length - 1}
              onClick={() => handleNavigation(1)}
            >
              Next
            </Button>
          </div>
        }
      >
        {/* Question bubble navigation */}
        {questionsList.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4 justify-center">
            {questionsList.map((question, index) => {
              let type = "blank";

              if (!question.is_skipped && question.result === true) {
                type = "correct";
              } else if (
                !question.is_skipped &&
                question.result === false
              ) {
                type = "incorrect";
              }

              let bgColor =
                "bg-gray-300 border border-gray-500 text-black";

              if (type === "correct") {
                bgColor = "bg-green-500 text-white";
              } else if (type === "incorrect") {
                bgColor = "bg-red-500 text-white";
              }

              const isActive = index === currentIndex;

              return (
                <button
                  key={question.question_id}
                  type="button"
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center
                    ${bgColor}
                    ${
                      isActive
                        ? "ring-4 ring-yellow-400 shadow-lg scale-110"
                        : ""
                    }`}
                  title={`Q${index + 1} - ${type}`}
                  onClick={() => {
                    setCommentOpen(false);
                    setCurrentIndex(index);
                    setCurrentQuestionId(question.question_id);
                    setCurrentSelectedOptions(
                      question.selected_options || []
                    );
                    setCurrentSrno(question.db_Srno || index + 1);
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        )}

        {!data ? (
          <Loading />
        ) : (
          <>
            {/* Question metadata */}
            <div className="w-full h-[2px] bg-gray-300 mt-2" />

            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 my-2 text-xs md:text-sm text-gray-800">
              <span className="flex items-center gap-1">
                <strong>Difficulty:</strong> {data.difficulty || "N/A"}
              </span>

              <span className="text-gray-400">|</span>

              <span className="flex items-center gap-1">
                <strong>Question Type:</strong>{" "}
                {data.question_type || "N/A"}
              </span>

              <span className="text-gray-400">|</span>

              <span className="flex items-center gap-1">
                <strong>Topic:</strong> {data.topic || "N/A"}
              </span>

              <span className="text-gray-400">|</span>

              <span className="flex items-center gap-1">
                <strong>Sub Topic:</strong> {data.sub_topic || "N/A"}
              </span>

              <span className="text-gray-400">|</span>

              <span className="flex items-center gap-1">
                <strong>Time Taken:</strong>{" "}
                {data.time_taken ? timeInMMSS(data.time_taken) : "0s"}
              </span>

              {(testType === "FULL_LENGTH_TEST" ||
                testType === "PRACTICE_TEST" ||
                data.fastest_solve_time !== undefined) && (
                <>
                  <span className="text-gray-400">|</span>

                  <span className="flex items-center gap-1">
                    <strong>Fastest Solve Time:</strong>
                    <span
                      className={
                        data.fastest_solve_time
                          ? "text-emerald-600 font-bold"
                          : ""
                      }
                    >
                      {data.fastest_solve_time
                        ? timeInMMSS(data.fastest_solve_time)
                        : "-"}
                    </span>
                  </span>
                </>
              )}
            </div>

            <div className="w-full h-[2px] bg-gray-300 mt-2" />

            {/* Passage and question */}
            <div className="w-full flex gap-8">
              {data.question_subtype === "READING_COMPREHENSION" && (
                <div className="overflow-y-auto max-h-[500px] flex-1 border">
                  <MathContent
                    cls="p-4"
                    content={data.reading_comprehension_passage}
                  />
                </div>
              )}

              <div className="question-desc my-4 flex-1 min-w-0">
                <MathContent
                  cls="px-2"
                  content={data.description}
                />
              </div>
            </div>

            {/* MCQ options */}
            {data.question_type === "MCQ" && (
              <>
                <div className="font-bold my-3">Options:</div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {data.options?.map(
                    ({ description, is_correct }, index) => {
                      const chosen =
                        currentSelectedOptions.includes(index);

                      const className =
                        chosen && is_correct
                          ? "font-bold bg-green-200 border-2 rounded-lg p-2"
                          : chosen
                          ? "font-bold bg-red-200 border-2 rounded-lg p-2"
                          : is_correct
                          ? "font-bold bg-green-200 border-2 rounded-lg p-2"
                          : "bg-white border-2 rounded-lg p-2";

                      return (
                        <div
                          key={index}
                          className="flex gap-1 items-start"
                        >
                          <span>{alphatbetArray[index]}.</span>
                          <MathContent
                            cls={className}
                            content={description}
                          />
                        </div>
                      );
                    }
                  )}
                </div>
              </>
            )}

            {/* GRID-IN answer */}
            {data.question_type === "GRIDIN" && (
              <>
                <div className="font-bold my-3">Your Answer:</div>

                <span className="border px-2 py-1 rounded">
                  {currentSelectedOptions}
                </span>

                <GridInOptions question={data} />
              </>
            )}

            {/* Explanation */}
            {data.explanation && (
              <>
                <div className="font-bold mt-4 mb-2">Explanation:</div>

                <div className="border p-2 rounded max-h-80 overflow-auto">
                  <MathContent
                    cls="p-2"
                    content={data.explanation}
                  />
                </div>
              </>
            )}

            {/* Raise a doubt and Comment buttons */}
            
{/* Raise a doubt message and Comment button */}
{role === "student" &&
  testType === "FULL_LENGTH_TEST" && (
    <div className="w-full flex flex-wrap justify-center items-center gap-3 my-8">
      {/* Show Raise a doubt only if no doubt has been raised */}
      {!data.doubt_created && (
        <Button
          type="primary"
          className="!bg-orange-500 hover:!bg-orange-600"
          onClick={handleRaiseDoubt}
        >
          Raise a doubt
        </Button>
      )}

      {/* Show the backend message after a doubt is raised */}
      {data.doubt_created && (
        <span className="text-red-600 text-sm font-medium">
          {typeof data.doubt === "string"
            ? data.doubt
            : "You have already created a doubt about this question."}
        </span>
      )}

      {/* Comment button */}
      <Tooltip
        title={
          !hasDoubt
            ? "Raise a doubt first to enable comments"
            : "Open doubt discussion"
        }
      >
        <Button
          icon={<CommentOutlined />}
          disabled={!hasDoubt}
          onClick={() => setCommentOpen(true)}
        >
          Comment
        </Button>
      </Tooltip>
    </div>
  )}

          </>
        )}
      </Modal>

      {/* Existing Raise Doubt modal */}
      {showDoubt &&
        role === "student" &&
        testType === "FULL_LENGTH_TEST" && (
          <RaiseDoubtModal
            open={showDoubt}
            onClose={handleDoubtModalClose}
            question={currentQuestionId}
            section={sectionId}
            course_subject={courseSubjectId}
            test={testId}
          />
        )}

      {/* Existing Comment component and API integration */}
      {role === "student" &&
        testType === "FULL_LENGTH_TEST" &&
        hasDoubt && (
          <Comment
            open={commentOpen}
            setOpen={setCommentOpen}
            doubtId={doubtId}
            data={
              typeof data.doubt === "object"
                ? data.doubt
                : {
                    description:
                      typeof data.doubt === "string"
                        ? data.doubt
                        : "Doubt discussion",
                  }
            }
            role={role}
          />
        )}
    </>
  );
}

export default QuestionReviewModal;
