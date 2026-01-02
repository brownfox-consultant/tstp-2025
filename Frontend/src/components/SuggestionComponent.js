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

  // Determine if this is the "Suggestion" side (to show explanation)
  const isSuggestion = title === "Suggestion";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "8px",
        padding: "16px",
        height: "100%",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid #e8e8e8",
      }}
    >
      {/* Title Header */}
      <h3
        style={{
          fontSize: "18px",
          fontWeight: 600,
          color: "#333",
          marginBottom: "16px",
          paddingBottom: "8px",
          borderBottom: "2px solid #f0f0f0",
        }}
      >
        {title}
      </h3>

      {/* Reading Passage Section */}
      {question_subtype == "READING_COMPREHENSION" && (
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontWeight: 600,
              color: "#333",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            Reading Passage:
          </div>
          <div
            style={{
              background: "#f9f9f9",
              border: "1px solid #e8e8e8",
              borderRadius: "6px",
              padding: "12px",
              maxHeight: "200px",
              overflow: "auto",
              fontSize: "13px",
              lineHeight: "1.6",
              color: "#555",
            }}
          >
            <MathContent content={reading_comprehension_passage} />
          </div>
        </div>
      )}

      {/* Description Section */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontWeight: 600,
            color: "#333",
            marginBottom: "8px",
            fontSize: "14px",
          }}
        >
          Description:
        </div>
        <div
          style={{
            fontSize: "13px",
            lineHeight: "1.6",
            color: "#555",
          }}
        >
          <MathContent content={description} />
        </div>
      </div>

      {/* Options Section */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontWeight: 600,
            color: "#333",
            marginBottom: "8px",
            fontSize: "14px",
          }}
        >
          Options:
        </div>
        {question_type == "GRIDIN" ? (
          <GridInOptions question={data} />
        ) : (
          <McqOptions question={data} />
        )}
      </div>

      {/* Explanation Section (only for Suggestion side) */}
      {explanation && (
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontWeight: 600,
              color: "#333",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            Explanation:
          </div>
          <div
            style={{
              background: "#f9f9f9",
              border: "1px solid #e8e8e8",
              borderRadius: "6px",
              padding: "12px",
              maxHeight: "120px",
              overflow: "auto",
              fontSize: "13px",
              lineHeight: "1.6",
              color: "#555",
            }}
          >
            <MathContent content={explanation} />
          </div>
        </div>
      )}

      {/* Question Metadata */}
      <div
        style={{
          borderTop: "1px solid #f0f0f0",
          paddingTop: "12px",
          marginTop: "8px",
        }}
      >
        <Row gutter={[8, 8]}>
          {/* Question Type */}
          <Col span={12}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ fontWeight: 600, color: "#333" }}>Question Type:</span>
              <span style={{ color: "#666" }}>{questionTypeMap[question_type]}</span>
            </div>
          </Col>

          {/* Question Subtype */}
          <Col span={12}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ fontWeight: 600, color: "#333" }}>Question Subtype:</span>
              <span style={{ color: "#666" }}>
                {questionSubTypeMap?.[question_subtype] || question_subtype || "-"}
              </span>
            </div>
          </Col>

          {/* Question Difficulty */}
          <Col span={12}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
              <span style={{ fontWeight: 600, color: "#333" }}>Question Difficulty:</span>
              <Tag
                color={difficultyTagsMap[difficulty]?.color}
                style={{ margin: 0, fontSize: "12px" }}
              >
                {difficultyTagsMap[difficulty]?.label}
              </Tag>
            </div>
          </Col>

          {/* Topic */}
          <Col span={12}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ fontWeight: 600, color: "#333" }}>Topic:</span>
              <span style={{ color: "#666", textAlign: "right" }}>{topic}</span>
            </div>
          </Col>

          {/* Sub Topic */}
          <Col span={12}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ fontWeight: 600, color: "#333" }}>Sub Topic:</span>
              <span style={{ color: "#666" }}>{sub_topic ? sub_topic : "-"}</span>
            </div>
          </Col>

          {/* Show Calculator */}
          <Col span={12}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ fontWeight: 600, color: "#333" }}>Show Calculator:</span>
              <span style={{ color: "#666" }}>{showCalculatorOptionsMap[show_calculator]}</span>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default SuggestionComponent;
