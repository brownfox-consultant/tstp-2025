"use client";

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { saveAndMove, setIsReviewPage } from "@/lib/features/test/testSlice";
import BookmarkIcon from "./../../../public/bookmark2.svg";
import Image from "next/image";

function ReviewComponent() {
  const currentQuestionIndex = useSelector(
    (state) => state.test.currentQuestionIndex
  );
  const router = useRouter();
  const questions = useSelector((state) => state.test.questions);
  const name = useSelector((state) => state.test.name);
  const answerMap = useSelector((state) => state.test.answerMap);
  const questionId = questions[currentQuestionIndex].id;

  const testId = useSelector((state) => state.test.testId);
  const testSubmissionId = useSelector((state) => state.test.testSubmissionId);
  const testType = useSelector((state) => state.test.testType);
  const courseSubject = useSelector((state) => state.test.courseSubject);
  const sectionId = useSelector((state) => state.test.sectionId);
  const lastRecordedTime = useSelector((state) => state.test.lastRecordedTime);
  const dispatch = useDispatch();
  const questionItems = questions.map((question) => {
    const { is_marked_for_review } = answerMap[question.id] || false;
    const { selected_options, gridinAnswer } = answerMap[question.id] || {};
    let isAnswered = false;
    if (question.question_type === "MCQ") {
  const hasSelected = Object.values(selected_options || {}).some(
    (val) => val === 1
  );
  isAnswered = hasSelected;
} else {
  isAnswered = Boolean(gridinAnswer);
}

    return {
      id: question.id,
      isAnswered,
      is_marked_for_review,
    };
  });
  function handleQuestionItemClick(toIndex) {
    dispatch(
      saveAndMove({
        operation: "GOTO",
        questionIndex: toIndex,
      })
    );
    dispatch(setIsReviewPage(false));
  }

  return (
    <div className=" max-w-3xl my-6 mx-auto rounded-md h-96">
      <p className="review-title text-3xl text-center">Review your work</p>
      <p className="review-instructions text-center my-3">
        Confirm Your Answers Before Completion
      </p>
      <div className=" rounded-lg px-4 py-4 bg-white shadow-2xl space-y-4">
        <div className="review-card-title border-black py-4 border-b flex flex-row justify-between">
          <div className=" text-lg font-semibold">{name}</div>
          <div className=" flex flex-row space-x-4">
            <span className="flex place-items-center">
              <EnvironmentOutlined className="mr-2" /> Current
            </span>
            <span className="flex place-items-center">
              <div className=" h-5 w-5 aspect-square border-2 border-dashed mx-2 inline-block"></div>
              Unanswered
            </span>
            <span className="flex gap-1 place-items-center">
              <Image className="" src={BookmarkIcon} height={25} width={25} />
              For Review
            </span>
          </div>
        </div>
        <div className="section-map-content grid grid-cols-12 gap-y-7 gap-x-2 flex-wrap w-full my-5 py-5 max-h-96 overflow-y-scroll">
          {questionItems.map((questionItem, index) => {
            const { is_marked_for_review, isAnswered } = questionItem;

            return (
              <div
                onClick={() => handleQuestionItemClick(index)}
                className={`relative w-10 h-10 leading-9 font-semibold text-lg text-center border border-dashed 
            cursor-pointer ${
              isAnswered
                ? "bg-blue-700 text-white hover:bg-blue-800 hover:text-white"
                : "hover:bg-neutral-100 hover:text-black"
            }`}
                key={questionItem.id}
              >
                {currentQuestionIndex == index && (
                  <EnvironmentOutlined
                    style={{ color: "black" }}
                    className="text-black absolute -top-5 left-1/2 -translate-x-1/2"
                  />
                )}
                {is_marked_for_review && (
                  <Image
                    className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 "
                    src={BookmarkIcon}
                    height={15}
                    width={15}
                  />
                )}
                <span>{index + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ReviewComponent;
