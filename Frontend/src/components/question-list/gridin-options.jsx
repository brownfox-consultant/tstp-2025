import {
  convertOptionToExpression,
  convertOptionToFormState,
} from "@/utils/utils";
import React from "react";

function GridInOptions({ question }) {
  const isRangeAnswer = question.question_subtype == "RANGE_BASED_ANSWER";
  const isClosedRange = Object.keys(question.options[0]).length == 2;

  const expressions =
    isRangeAnswer && !isClosedRange
      ? convertOptionToExpression(question.options)
      : [];

  const formState =
    isRangeAnswer && isClosedRange
      ? convertOptionToFormState(question.options[0])
      : [];

  console.log({ expressions, formState });
  return (
    <>
      <div className="font-bold my-3">
        {question.question_subtype == "SINGLE_ANSWER"
          ? "Correct Answer"
          : "Acceptable Answers"}
        :
      </div>
      {/* <div className="border-2 p-2 rounded-md"> */}
      <div>
        {["SINGLE_ANSWER", "MULTI_ANSWER"].includes(
          question.question_subtype
        ) && (
          <div className="flex gap-x-4 gap-y-2">
            {question.options.map((value) => {
              return (
                <div className="border-2 border-r-4 rounded-lg px-2 py-1 h-full">
                  {value}
                </div>
              );
            })}
          </div>
        )}
        {isRangeAnswer && (
          <div className="flex gap-x-4 gap-y-2">
            {isClosedRange ? (
              <div className="border-2 border-r-4 rounded-lg px-2 py-1 h-full">
                {/* <div> */}
                {formState.value1} {formState.operator1}{" "}
                <span className="font-semibold">ANS</span> {formState.operator1}{" "}
                {formState.value2}
              </div>
            ) : (
              <div className="border-2 border-r-4 rounded-lg px-2 py-1 h-full">
                {/* <div> */}
                {expressions.map((exp, index) => {
                  return (
                    <span className="space-x-1" key={index}>
                      {index == 1 && (
                        <span className="font-extrabold px-3">OR</span>
                      )}
                      <span className="font-semibold">{exp.variable}</span>{" "}
                      <span> {exp.operator} </span> <span> {exp.value}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default GridInOptions;
