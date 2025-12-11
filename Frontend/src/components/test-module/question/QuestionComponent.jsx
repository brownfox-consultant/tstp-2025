"use client";

import {
  BookFilled,
  BookOutlined,
  StrikethroughOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import React, { useEffect, useState } from "react";
import MathContent from "../../MathContent";
import TestOptions from "../options/test-options";
import { useSelector, useDispatch } from "react-redux";
import {
  toggleStrikeThrough,
  toggleMarkedForReview,
  createAnswerObject,
} from "@/lib/features/test/testSlice";
import GridInInput from "../options/gridin-input";
import { useHotkeys } from "react-hotkeys-hook";

function QuestionComponent() {
  const dispatch = useDispatch();
  const showStrikeThrough = useSelector(
    (state) => state.test.showStrikeThrough
  );
  const questions = useSelector((state) => state.test.questions);
  const currentQuestionIndex = useSelector(
    (state) => state.test.currentQuestionIndex
  );
  const question = questions[currentQuestionIndex];
  const { question_type, question_subtype } = question;
  const answerObject =
    useSelector((state) => state.test?.answerMap[question.id]) || null;

  if (answerObject == null) {
    dispatch(createAnswerObject(question.id));
  }

  useHotkeys("alt+m", () =>
    dispatch(
      toggleMarkedForReview({
        questionId: question.id,
        newValue: !is_marked_for_review,
      })
    )
  );

  useHotkeys("alt+e", () => dispatch(toggleStrikeThrough(!showStrikeThrough)));

  const { is_marked_for_review } = answerObject || false;
  return (
    <div className="grid grid-cols-1 w-full">
      <div className="question-header flex flex-row bg-neutral-100 px-2 py-1">
        <div className="flex-1">
          <span className="aspect-square bg-black text-white w-max px-3 py-1">
            {currentQuestionIndex + 1}
          </span>
          <Button
            type="text"
            onClick={() =>
              dispatch(
                toggleMarkedForReview({
                  questionId: question.id,
                  newValue: !is_marked_for_review,
                })
              )
            }
            icon={
              answerObject?.is_marked_for_review ? (
                <BookFilled />
              ) : (
                <BookOutlined />
              )
            }
          >
            <span
              className={
                answerObject?.is_marked_for_review ? `font-bold` : "font-normal"
              }
            >
              Mark for Review
            </span>
          </Button>
        </div>
        <Button
          onClick={() => {
            dispatch(toggleStrikeThrough(!showStrikeThrough));
          }}
          icon={<StrikethroughOutlined />}
          type={showStrikeThrough ? "primary" : "default"}
        ></Button>
      </div>
      <div className="question-desc my-4 ">
        <MathContent content={question.description} />
      </div>
      <div className="question-options grid grid-cols-1 h-full">
        {question_type == "MCQ" && (
          <TestOptions
            questionId={question.id}
            questionType={question.question_type}
            // selected_options={answerObject.selected_options}
            // striked_options={answerObject.striked_options}
            options={question.options}
            showStrikeThrough={showStrikeThrough}
          />
        )}
        {question_type == "GRIDIN" && (
          <GridInInput
            questionId={question.id}
            questionType={question.question_type}
            questionSubtype={question_subtype}
          />
        )}
      </div>
    </div>
  );
}

export default QuestionComponent;
