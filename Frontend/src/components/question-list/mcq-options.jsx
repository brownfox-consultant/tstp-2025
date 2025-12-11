import React from "react";
import MathContent from "../MathContent";

function McqOptions({ question }) {
  return (
    <>
      <div className="font-bold my-3">Options:</div>
      <div className="border-2 p-2 rounded-md">
        <div className="grid grid-cols-1 lg:grid-cols-2 auto-rows-fr gap-x-4 gap-y-2">
          {question.options.map(({ description, is_correct }) => {
            return (
              <MathContent
                cls={` font-bold ${
                  is_correct ? "bg-green-200" : "bg-white"
                }  border-2 border-r-4 rounded-lg px-2 py-5 h-full`}
                content={description}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

export default McqOptions;
