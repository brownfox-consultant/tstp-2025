import {
  difficultyTagsMap,
  questionSubTypeMap,
  questionTypeMap,
  showCalculatorOptionsMap,
} from "@/utils/utils";
import { Col, Row, Tag } from "antd";
import React from "react";
import MathContent from "./MathContent";
import GridInOptions from "./question-list/gridin-options";
import McqOptions from "./question-list/mcq-options";

function SuggestionComponent_S({ title, data, data1 }) {
  // data = suggestion
  // data1 = original question

    const renderDifference = (original, suggested) => {
     
  if ((original || "").trim() !== (suggested || "").trim()) {
    return <span style={{ color: "red" }}>{suggested || "-"}</span>;
  }
  return suggested || "-";
};

  const renderAlwaysRed = (content) => (
    <span style={{ color: "red" }}>{content || "-"}</span>
  );

  const {
    difficulty,
    sub_topic,
    topic,
    question_type,
    question_subtype,
    reading_comprehension_passage,
    description,
    options,
    show_calculator,
    explanation,
  } = data || {};

  const {
    difficulty: difficulty1,
    sub_topic: sub_topic1,
    topic: topic1,
    question_type: question_type1,
    question_subtype: question_subtype1,
    reading_comprehension_passage: reading_comprehension_passage1,
    description: description1,
    options: options1,
    show_calculator: show_calculator1,
    explanation: explanation1,
    } = data1 || {};

    console.log("data1",data1)
    

  return (
    <div className="border-2 border-r-4 p-2 rounded-sm">
      <Row className="text-lg font-semibold">{title}</Row>

      {/* Reading Passage */}
      {question_subtype &&
        question_subtype.toUpperCase() === "READING_COMPREHENSION" && (
          <>
            <div className="font-bold mb-2">Reading Passage:</div>
            <div className="bg-white border-2 p-2 rounded-md max-h-80 overflow-auto mb-3">
              <MathContent
                cls="p-2"
                content={renderAlwaysRed(reading_comprehension_passage)}
              />
            </div>
          </>
        )}

      {/* Description */}
      <div className="font-bold">Description:</div>
      <Row className="my-2">
        <MathContent
          content={renderDifference(description1, description)}
        />
      </Row>

      {/* Options */}
      {question_type === "GRIDIN" ? (
        <GridInOptions question={data} />
      ) : (
        <McqOptions question={data} />
      )}

      {/* Explanation */}
      {explanation && (
        <>
          <div className="font-bold mb-2">Explanation:</div>
          <div className="bg-white border-2 p-2 rounded-md max-h-80 overflow-auto mb-3">
            <MathContent
              content={renderDifference(explanation1, explanation)}
            />
          </div>
        </>
      )}

      {/* Metadata */}
      <Row className="mt-2" gutter={[16, 16]}>
        {/* Question Type */}
        <Col sm={24} md={12} lg={12}>
          <Row className="flex justify-between">
            <p className="text-black font-bold">Question Type:</p>
            <p>
              {question_type
                ? renderDifference(question_type1, question_type)
                  ? <span style={{ color: "red" }}>
                      {questionTypeMap?.[question_type] ?? question_type}
                    </span>
                  : questionTypeMap?.[question_type] ?? question_type
                : "-"}
            </p>
          </Row>
        </Col>

        {/* Question Subtype */}
        <Col sm={24} md={12} lg={12}>
          <Row className="flex justify-between">
            <p className="text-black font-bold">Question Subtype:</p>
            <p>
              {question_subtype
                ? renderDifference(question_subtype1, question_subtype)
                  ? <span style={{ color: "red" }}>
                      {questionSubTypeMap?.[question_subtype] ?? question_subtype}
                    </span>
                  : questionSubTypeMap?.[question_subtype] ?? question_subtype
                : "-"}
            </p>
          </Row>
        </Col>

        {/* Difficulty */}
        <Col sm={24} md={12} lg={12}>
          <Row className="flex justify-between">
            <p className="text-black font-bold">Question Difficulty:</p>
            <p>
              <Tag
                color={difficultyTagsMap?.[difficulty]?.color}
                style={{
                  color: difficulty !== difficulty1 ? "red" : undefined,
                }}
              >
                {difficultyTagsMap?.[difficulty]?.label ?? difficulty ?? "-"}
              </Tag>
            </p>
          </Row>
        </Col>

        {/* Topic */}
        <Col sm={24} md={12} lg={12}>
          <Row className="flex justify-between">
            <p className="text-black font-bold">Topic:</p>
            <p style={{ color: topic !== topic1 ? "red" : undefined }}>
              {topic ?? "-"}
            </p>
          </Row>
        </Col>

        {/* Sub Topic */}
        <Col sm={24} md={12} lg={12}>
          <Row className="flex justify-between">
            <p className="text-black font-bold">Sub Topic:</p>
            <p style={{ color: sub_topic !== sub_topic1 ? "red" : undefined }}>
              {sub_topic ?? "-"}
            </p>
          </Row>
        </Col>

        {/* Show Calculator */}
        <Col sm={24} md={12} lg={12}>
          <Row className="flex justify-between">
            <p className="text-black font-bold">Show Calculator:</p>
            <p
              style={{
                color: show_calculator !== show_calculator1 ? "red" : undefined,
              }}
            >
              {showCalculatorOptionsMap?.[show_calculator] ?? show_calculator ?? "-"}
            </p>
          </Row>
        </Col>
      </Row>
    </div>
  );
}

export default SuggestionComponent_S;
