import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import React from "react";

function CurrentTab({ selectedSubject, data }) {
  const currentSubject = data.subjects[selectedSubject];
  const { sections } = currentSubject;

  // Calculate total counts for setting widths
  const getTotalCount = (section) =>
    section.section_correct_count +
    section.section_incorrect_count +
    section.section_blank_count;

  return (
    <div className="w-full flex gap-2 my-4">
      <div className="border-black border p-1 flex flex-col text-center justify-between gap-5 w-56">
        <div>Your {currentSubject.name} Score</div>
        <div className="text-6xl font-bold">{currentSubject.subject_score}</div>
        <div className="">OUT OF {currentSubject.subject_max_score}</div>
      </div>
      <div className="px-2 flex-1 space-y-4">
        <div className="text-3xl font-semibold">Analysis Overview</div>
        <div className="space-x-2">
          <span className="space-x-1">
            <CheckCircleTwoTone twoToneColor="#52c41a" />{" "}
            {currentSubject.subject_correct_count} Correct
          </span>
          <span className="space-x-1">
            <CloseCircleTwoTone twoToneColor="#ff0000" />{" "}
            {currentSubject.subject_incorrect_count} Incorrect
          </span>
          <span className="space-x-1">
            <span className="inline-block h-3 w-3 border border-black rounded-full mx-auto"></span>{" "}
            {currentSubject.subject_blank_count} Blank
          </span>
        </div>
        <div className="stacked-chart">
          {sections.map((section, index) => {
            const totalCount = getTotalCount(section);
            const correctPercentage =
              (section.section_correct_count / totalCount) * 100;
            const incorrectPercentage =
              (section.section_incorrect_count / totalCount) * 100;
            const blankPercentage =
              (section.section_blank_count / totalCount) * 100;

            return (
              <div key={index} className="flex gap-2 items-center my-2">
                <div className="font-semibold">{section.name}</div>
                <div className="flex w-4/6 h-4 text-xs">
                  {section.section_correct_count != 0 && (
                    <div
                      title={`${section.section_correct_count} Correct`}
                      className="bg-lime-400 relative"
                      style={{ width: `${correctPercentage}%` }}
                    >
                      <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-black font-bold">
                        {section.section_correct_count}
                      </span>
                    </div>
                  )}
                  {section.section_incorrect_count != 0 && (
                    <div
                      title={`${section.section_incorrect_count} Incorrect`}
                      className="bg-red-500 relative"
                      style={{ width: `${incorrectPercentage}%` }}
                    >
                      <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-black font-bold">
                        {section.section_incorrect_count}
                      </span>
                    </div>
                  )}
                  {section.section_blank_count != 0 && (
                    <div
                      title={`${section.section_blank_count}`}
                      className="bg-gray-300 relative"
                      style={{ width: `${blankPercentage}%` }}
                    >
                      <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-black font-bold">
                        {section.section_blank_count}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CurrentTab;
