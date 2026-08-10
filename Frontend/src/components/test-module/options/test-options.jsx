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

const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function TestOptions({
  options = [],
  showStrikeThrough,
  questionType,
  questionId,
}) {
  const dispatch = useDispatch();

  const selected_options = useSelector(
    (state) => state.test.answerMap[questionId]?.selected_options || {}
  );

  const striked_options = useSelector(
    (state) => state.test.answerMap[questionId]?.striked_options || {}
  );

  return (
    <div className="question-options grid grid-cols-1 h-full">
      {options.map((option, index) => {
        const isSelected = Array.isArray(selected_options)
  ? selected_options.includes(index)
  : !!selected_options[index];
  console.log({
  questionId,
  selected_options,
  index,
  isArray: Array.isArray(selected_options),
  isSelected,
});

        return (
          <div key={index} className="flex flex-row items-start gap-2 my-2">
            {/* Option */}
            <div
              onClick={() => {
                dispatch(
                  isSelected
                    ? unselectOption({
                        optionIndex: index,
                        questionId,
                        questionType,
                      })
                    : selectOption({
                        optionIndex: index,
                        questionId,
                        questionType,
                      })
                );
              }}
              className={`relative cursor-pointer flex-1 flex flex-row items-start rounded-md px-3 py-2 border transition-all duration-150
                ${
                  isSelected
                    ? "border-blue-700 border-4 bg-blue-50 font-semibold"
                    : "border-black border"
                }
                ${
                  showStrikeThrough && !!striked_options[index]
                    ? "text-black/30"
                    : ""
                }
              `}
            >
              {showStrikeThrough && !!striked_options[index] && (
                <div className="absolute top-1/2 left-0 w-full border-t-2 border-black" />
              )}

              <div className="w-6 flex-shrink-0 font-bold">
                {alphabets[index]}.
              </div>

              <MathContent
                cls="flex-1"
                content={option.description}
              />
            </div>

            {/* Strike Through */}
            {showStrikeThrough &&
              (striked_options[index] ? (
                <Button
                  type="text"
                  onClick={() =>
                    dispatch(
                      unstrikeOption({
                        optionIndex: index,
                        questionId,
                      })
                    )
                  }
                >
                  Undo
                </Button>
              ) : (
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() =>
                    dispatch(
                      strikeOption({
                        optionIndex: index,
                        questionId,
                      })
                    )
                  }
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}

export default TestOptions;