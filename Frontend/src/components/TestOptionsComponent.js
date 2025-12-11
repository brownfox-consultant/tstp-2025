import React from "react";
import MathContent from "./MathContent";

function TestOptionsComponent({
  currentQuestion,
  selectedOptions,
  setSelectedOptions,
}) {
  const handleOptionClick = (index) => {
    // For single choice, set the selected option directly
    if (currentQuestion.question_type !== "MULTI_CHOICE") {
      if (index == selectedOptions[0]) setSelectedOptions([]);
      else setSelectedOptions([index]);
    } else if (currentQuestion.question_type === "MULTI_CHOICE") {
      // For multiple choice, add or remove the selected option
      if (selectedOptions.includes(index)) {
        setSelectedOptions(
          selectedOptions.filter((option) => option !== index)
        );
      } else {
        setSelectedOptions([...selectedOptions, index]);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 auto-rows-fr gap-x-4 gap-y-2">
      {currentQuestion &&
        currentQuestion?.options.map(({ description }, index) => {
          return (
            <div
              key={description}
              onClick={() => handleOptionClick(index)}
              className={`cursor-pointer font-bold border-solid border-2 rounded-lg px-2 py-5 w-full hover:border-r-4 hover:border-slate-400 ${
                selectedOptions.includes(index) ? "bg-sky-200" : ""
              }`}
            >
              <MathContent content={description} />
            </div>
          );
        })}
    </div>
  );
}

export default TestOptionsComponent;
