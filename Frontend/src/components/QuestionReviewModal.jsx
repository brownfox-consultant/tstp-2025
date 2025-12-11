// components/QuestionReviewModal.jsx
import React, { useEffect, useState } from "react";
import { Modal, Button } from "antd";
import Loading from "@/app/loading";
import { getQuestionDetails } from "@/app/services/authService";
import MathContent from "./MathContent";
import GridInOptions from "./question-list/gridin-options";
import RaiseDoubtModal from "./RaiseDoubtModal_qutions_review_model";
import { alphatbetArray,timeInMMSS } from "@/utils/utils";

function QuestionReviewModal({
  open,
  onClose,
  questionId,
  questionsList = [], // array of { question_id, selected_options }
  sectionId,
  courseSubjectId,
  testId,
  selectedOptions = [],
  role,
  testType,
  testSubmissionId
}) {
  const [data, setData] = useState(null);
  const [showDoubt, setShowDoubt] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestionId, setCurrentQuestionId] = useState(questionId);
  const [currentSelectedOptions, setCurrentSelectedOptions] = useState(
    selectedOptions
  );
  const [currentSrno, setCurrentSrno] = useState(null);


  // Set initial index and question id when modal opens
  useEffect(() => {
    if (open) {
      const idx = questionsList.findIndex((q) => q.question_id === questionId);
     
      setCurrentIndex(idx >= 0 ? idx : 0);
      setCurrentQuestionId(questionId);
      setCurrentSelectedOptions(
        questionsList[idx]?.selected_options || []
      );
      setCurrentSrno(questionsList[idx]?.db_Srno || idx + 1);
    }
  }, [open, questionId, questionsList]);

  // Fetch question detail when currentQuestionId changes
  useEffect(() => {
    if (currentQuestionId) {
      setData(null);
      let params = {};

if (testType === "FULL_LENGTH_TEST") {
  params.test_submission_id = testSubmissionId;
} else {
  params.practice_test_result_id = testSubmissionId;
}
console.log("testType",testType)
  console.log("testId",testId)
  console.log("params.test_submission_id",params.test_submission_id)
  console.log("params.practice_test_result_id",params.practice_test_result_id)
      getQuestionDetails(currentQuestionId,params).then((res) => {
        setData(res.data.detail);
      });
    }
  }, [currentQuestionId]);

  // Navigate between questions
  const handleNavigation = (direction) => {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < questionsList.length) {
      const newQuestion = questionsList[newIndex];
      setCurrentIndex(newIndex);
      setCurrentQuestionId(newQuestion.question_id);
      setCurrentSelectedOptions(newQuestion.selected_options || []);
      setCurrentSrno(newQuestion.db_Srno  || newIndex + 1);
    }
  };

  return (
    <>
      <Modal
        width={data?.question_type === "MCQ" ? "80rem" : "64rem"}
        open={open}
        title={
  role === "student"
    ? `Reviewing Question ${currentIndex + 1}`
    : `Reviewing Question ${currentIndex + 1} (Question Id: ${currentSrno})`
}

        onCancel={() => {
          setShowDoubt(false);
          onClose();
        }}
        footer={
          <div className="flex justify-between">
            <Button
              disabled={currentIndex === 0}
              onClick={() => handleNavigation(-1)}
            >
              Previous
            </Button>
            <Button
              disabled={currentIndex === questionsList.length - 1}
              onClick={() => handleNavigation(1)}
            >
              Next
            </Button>
          </div>
        }
      >
        {/* Bubble Navigation */}
{questionsList.length > 0 && (
  <div className="flex flex-wrap gap-1 mb-4 justify-center">
    {questionsList.map((q, i) => {
      let type = "blank";
      if (!q.is_skipped && q.result === true) type = "correct";
      else if (!q.is_skipped && q.result === false) type = "incorrect";

      let bgColor = "bg-gray-300 border border-gray-500 text-black";
      if (type === "correct") bgColor = "bg-green-500 text-white";
      else if (type === "incorrect") bgColor = "bg-red-500 text-white";

      const isActive = i === currentIndex;

      return (
        <button
  key={q.question_id}
  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center 
    ${bgColor} ${isActive ? "ring-4 ring-yellow-400 shadow-lg scale-110" : ""}`}
  title={`Q${i + 1} - ${type}`}
  onClick={() => {
    setCurrentIndex(i);
    setCurrentQuestionId(q.question_id);
    setCurrentSelectedOptions(q.selected_options || []);
    setCurrentSrno(q.db_Srno  || i + 1);
  }}
>
  {i + 1}
</button>

      );
    })}
  </div>
)}
        {!data ? (
          <Loading />
        ) : (
          <>
            {/* Question / passage */}
              {/* Meta info - single line / compact */}
            <div className="w-full h-[2px] bg-gray-300 mt-2"></div>
          <div className="flex items-center flex-wrap gap-10 my-2 text-xs md:text-sm text-gray-800">
          
            <span className="flex items-center gap-1">
              <span className="font-bold">Difficulty:</span> {data.difficulty || "N/A"}
            </span>
          
            <span className="text-gray-400">|</span>
          
            <span className="flex items-center gap-1">
              <span className="font-bold">Question Type:</span> {data.question_type || "N/A"}
            </span>
          
            <span className="text-gray-400">|</span>
          
            <span className="flex items-center gap-1">
              <span className="font-bold">Topic:</span> {data.topic || "N/A"}
            </span>
          
            <span className="text-gray-400">|</span>
          
            <span className="flex items-center gap-1">
              <span className="font-bold">Sub Topic:</span> {data.sub_topic || "N/A"}
            </span>
          
            <span className="text-gray-400">|</span>
          
            <span className="flex items-center gap-1">
              <span className="font-bold">Total Time:</span>
              {data.time_taken ? timeInMMSS(data.time_taken) : "0s"}
            </span>
          
          </div>
          
           <div className="w-full h-[2px] bg-gray-300 mt-2"></div>



            <div className="w-full flex gap-8">
              {data.question_subtype === "READING_COMPREHENSION" && (
                <div className="overflow-y-scroll flex-1 border">
                  <MathContent
                    cls="p-4"
                    content={data.reading_comprehension_passage}
                  />
                </div>
              )}
              
              <div className="question-desc my-4 flex-1">
                <MathContent cls="px-2" content={data.description} />
              </div>
            </div>

           

            {/* MCQ options */}
            {data.question_type === "MCQ" && (
              <>
                <div className="font-bold my-3">Options:</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {data.options?.map(({ description, is_correct }, idx) => {
                    const chosen = currentSelectedOptions.includes(idx);
                    const cls =
                      chosen && is_correct
                        ? "font-bold bg-green-200 border-2 rounded-lg p-2"
                        : chosen
                        ? "font-bold bg-red-200 border-2 rounded-lg p-2"
                        : is_correct
                        ? "font-bold bg-green-200 border-2 rounded-lg p-2"
                        : "bg-white border-2 rounded-lg p-2";

                    return (
                      <div key={idx} className="flex gap-1 items-start">
                        <span>{alphatbetArray[idx]}.</span>
                        <MathContent cls={cls} content={description} />
                      </div>
                    );
                  })}
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
                  <MathContent cls="p-2" content={data.explanation} />
                </div>
              </>
            )}

            {/* Raise doubt button */}
            {role === "student" && testType === "FULL_LENGTH_TEST" && (
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

      {/* Doubt modal */}
      {showDoubt && role === "student" && testType === "FULL_LENGTH_TEST" && (
        <RaiseDoubtModal
          open={showDoubt}
          onClose={() => setShowDoubt(false)}
          question={currentQuestionId}
          section={sectionId}
          course_subject={courseSubjectId}
          test={testId}
        />
      )}
    </>
  );
}

export default QuestionReviewModal;
