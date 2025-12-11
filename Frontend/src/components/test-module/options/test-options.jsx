import MathContent from "@/components/MathContent";
import { CloseOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useSelector, useDispatch } from "react-redux";
import React from "react";
import {
  selectOption,
  unstrikeOption,
  strikeOption,
  unselectOption,
} from "@/lib/features/test/testSlice";
import { useHotkeys } from "react-hotkeys-hook";
import { recordSelectionHistory } from "@/lib/features/test/testSlice";

let alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function TestOptions({
  options = [],
  showStrikeThrough,
  questionType,
  questionId,
}) {
  const dispatch = useDispatch();
  const testState = useSelector((state) => state.test);

  const selected_options = useSelector(
    (state) => state.test.answerMap[questionId].selected_options
  );
  const striked_options = useSelector(
    (state) => state.test.answerMap[questionId].striked_options
  );

  const isFullLengthTest = testState.testType === "test"; // ✅ only record for full-length
  
  
  return (
    <div className="question-options grid grid-cols-1 h-full">
      {options.map((option, index) => {
        const isSelected = !!selected_options[index];

        return (
          <div key={index} className="flex flex-row items-start gap-2 my-2">
            {/* Option Box */}
            <div
              onClick={() => {
                // toggle selection
                dispatch(
                  isSelected
                    ? unselectOption({ optionIndex: index, questionId, questionType })
                    : selectOption({ optionIndex: index, questionId, questionType })
                );

                // ✅ Record only in full-length test
                if (isFullLengthTest) {
                  dispatch(
                    recordSelectionHistory({
                      testId: testState.testId,
                      testSubmissionId: testState.testSubmissionId,
                      questionId,
                      selectedOptions: Object.keys(
                        testState.answerMap[questionId]?.selected_options || {}
                      )
                        .filter(
                          (k) =>
                            testState.answerMap[questionId].selected_options[k] === 1
                        )
                        .map((k) => parseInt(k)),
                      strikedOptions: Object.keys(
                        testState.answerMap[questionId]?.striked_options || {}
                      )
                        .filter(
                          (k) =>
                            testState.answerMap[questionId].striked_options[k] === 1
                        )
                        .map((k) => parseInt(k)),
                      actionType: isSelected ? "DESELECT" : "SELECT",
                    })
                  );
                }
              }}
              className={`relative cursor-pointer flex-1 flex flex-row items-start rounded-md px-3 py-2 border transition-all duration-150
                ${
                  isSelected
                    ? "border-blue-700 border-4 bg-blue-50 font-semibold"
                    : "border-black border"
                }
                ${showStrikeThrough && !!striked_options[index] ? "text-black/30" : ""}
              `}
            >
              {showStrikeThrough && !!striked_options[index] && (
                <div className="absolute top-1/2 left-0 w-full border-t-2 border-black"></div>
              )}
              <div className="w-6 flex-shrink-0 font-bold">
                {alphabets[index]}.
              </div>
              <MathContent cls="flex-1" content={option.description} />
            </div>

            {/* Strike-through buttons */}
            {showStrikeThrough &&
              (striked_options[index] ? (
                <Button
                  onClick={() => {
                    dispatch(unstrikeOption({ optionIndex: index, questionId }));

                    if (isFullLengthTest) {
                      dispatch(
                        recordSelectionHistory({
                          testId: testState.testId,
                          testSubmissionId: testState.testSubmissionId,
                          questionId,
                          selectedOptions: Object.keys(
                            testState.answerMap[questionId]?.selected_options || {}
                          )
                            .filter(
                              (k) =>
                                testState.answerMap[questionId].selected_options[k] === 1
                            )
                            .map((k) => parseInt(k)),
                          strikedOptions: Object.keys(
                            testState.answerMap[questionId]?.striked_options || {}
                          )
                            .filter(
                              (k) =>
                                testState.answerMap[questionId].striked_options[k] === 1
                            )
                            .map((k) => parseInt(k)),
                          actionType: "UNSTRIKE",
                        })
                      );
                    }
                  }}
                  type="text"
                >
                  Undo
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    dispatch(strikeOption({ optionIndex: index, questionId }));

                    if (isFullLengthTest) {
                      dispatch(
                        recordSelectionHistory({
                          testId: testState.testId,
                          testSubmissionId: testState.testSubmissionId,
                          questionId,
                          selectedOptions: Object.keys(
                            testState.answerMap[questionId]?.selected_options || {}
                          )
                            .filter(
                              (k) =>
                                testState.answerMap[questionId].selected_options[k] === 1
                            )
                            .map((k) => parseInt(k)),
                          strikedOptions: Object.keys(
                            testState.answerMap[questionId]?.striked_options || {}
                          )
                            .filter(
                              (k) =>
                                testState.answerMap[questionId].striked_options[k] === 1
                            )
                            .map((k) => parseInt(k)),
                          actionType: "STRIKE",
                        })
                      );
                    }
                  }}
                  type="text"
                  icon={<CloseOutlined />}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}

export default TestOptions;
