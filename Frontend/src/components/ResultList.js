import {
  CaretRightOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import Options from "./Options";
import RaiseDoubtModal from "./RaiseDoubtModal";
import { Collapse } from "antd";
import React from "react";
import MathContent from "./MathContent";

function ResultList({ questions, test_id, section, course_subject, isAdmin }) {
  return (
    <Collapse
      className=" test-result-collapse mt-5"
      expandIcon={({ isActive }) => (
        <CaretRightOutlined rotate={isActive ? 90 : 0} />
      )}
      items={questions.map((question, index) => {
        const isCorrect = question.is_correct;
        const hasMarked = question.options.some(
          (option) => option.selected_by_user == true
        );
        return {
          key: question.id,
          showArrow: true,
          label: (
            <div className="py-5 flex justify-between">
              <div className="w-4/5">
                <MathContent
                  cls={"font-bold"}
                  content={question?.description}
                />
              </div>
              <span className="uppercase text-xs font-semibold">
                {hasMarked && isCorrect ? (
                  <span className="text-green-600 text-xl">
                    <CheckOutlined />
                  </span>
                ) : (
                  hasMarked && (
                    <span className="text-red-600 text-xl">
                      <CloseOutlined />
                    </span>
                  )
                )}
                {!hasMarked && (
                  <span className="text-gray-600">Unattempted</span>
                )}
              </span>
              {!isAdmin && (
                <span className="ml-2">
                  <RaiseDoubtModal
                    section={section}
                    test={test_id}
                    question={question.id}
                    course_subject={course_subject}
                  />
                </span>
              )}
            </div>
          ),
          children: (
            <>
              {question.reading_comprehension_passage && (
                <>
                  {" "}
                  <div className="font-bold mb-3">Reading Passage:</div>
                  <div className="bg-white border-2 p-2 rounded-md mb-2">
                    <MathContent
                      cls={"p-2"}
                      content={question?.reading_comprehension_passage}
                    />
                  </div>
                </>
              )}
              <Options options={question?.options} />
            </>
          ),
          style: {
            // border: "1px solid black",
            border: "none",
            borderRadius: "8px",
          },
        };
      })}
      bordered={false}
    />
  );
}

export default ResultList;
