import {
  difficultyTagsMap,
  questionSubTypeMap,
  questionTypeMap,
  showCalculatorOptionsMap,
} from "@/utils/utils";
import { Col, Row, Tag } from "antd";
import React from "react";
import Options from "./Options";
import MathContent from "./MathContent";
import GridInOptions from "./question-list/gridin-options";
import McqOptions from "./question-list/mcq-options";

function SuggestionComponent({ title, data }) {
  const {
    difficulty,
    sub_topic,
    topic,
    test_type,
    question_type,
    question_subtype,
    reading_comprehension_passage,
    description,
    options,
    show_calculator,
    explanation,
  } = data || "";
  console.log("data", question_type, question_subtype, data.options);

  return (
    <div className="border-2 border-r-4 p-2 rounded-sm">
      <Row className="text-lg font-semibold">{title}</Row>
      {question_subtype == "READING_COMPREHENSION" && (
        <>
          {" "}
          <div className="font-bold mb-2">Reading Passage:</div>
          <div className="bg-white border-2 p-2 rounded-md max-h-80 overflow-auto mb-3">
            <MathContent cls={"p-2"} content={reading_comprehension_passage} />
          </div>
        </>
      )}
      <div className="font-bold ">Description:</div>
      <Row className="my-2">
        <MathContent content={description} />
      </Row>
      {/* <div className="font-bold mb-2">Options:</div>
      <Options options={options} /> */}
      {question_type == "GRIDIN" ? (
        <GridInOptions question={data} />
      ) : (
        <McqOptions question={data} />
      )}

      {explanation && (
        <>
          {" "}
          <div className="font-bold mb-2">Explanation:</div>
          <div className="bg-white border-2 p-2 rounded-md max-h-80 overflow-auto mb-3">
            <MathContent cls={"p-2"} content={explanation} />
          </div>
        </>
      )}
      <Row className="mt-2" gutter={[16, 16]}>
        <Col sm={24} md={12} lg={12}>
          <Row className="flex justify-between">
            <p className="text-black font-bold">Question Type:</p>
            <p>{questionTypeMap[question_type]}</p>
          </Row>
        </Col>

        <Col sm={24} md={12} lg={12}>
          <Row className="flex justify-between">
            <p className="text-black font-bold">Question Subtype:</p>
            <p>{questionSubTypeMap?.[question_subtype] || question_subtype || "-"}</p>

          </Row>
        </Col>

        <Col sm={24} md={12} lg={12}>
          <Row className="flex justify-between">
            <p className="text-black font-bold">Question Difficulty:</p>
            <p>
              {" "}
              <Tag color={difficultyTagsMap[difficulty]?.color}>
                {difficultyTagsMap[difficulty]?.label}
              </Tag>
            </p>
          </Row>
        </Col>

        <Col sm={24} md={12} lg={12}>
          <Row className="flex justify-between">
            <p className="text-black font-bold">Topic:</p>
            <p className="mr-2">{topic}</p>
          </Row>
        </Col>

        <Col sm={24} md={12} lg={12}>
          <Row className="flex justify-between">
            <p className="text-black font-bold"> Sub Topic:</p>
            <p className="mr-2">{sub_topic ? sub_topic : "-"}</p>
          </Row>
        </Col>

        <Col sm={24} md={12} lg={12}>
          <Row className="flex justify-between">
            <p className="text-black font-bold"> Show Calculator:</p>
            <p className="mr-2">{showCalculatorOptionsMap[show_calculator]}</p>
          </Row>
        </Col>
      </Row>
    </div>
  );
}

export default SuggestionComponent;
