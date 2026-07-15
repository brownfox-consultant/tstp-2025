import {
  CloseOutlined,
  MinusCircleFilled,
  MinusCircleOutlined,
  PlusCircleFilled,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popover,
  Radio,
  Row,
  Select,
  Space,
  Tag,
} from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import RichTextEditor from "./RichTextEditor";
import PreviewQuestionModal from "./PreviewQuestionModal";
import ReactSelect, { components } from "react-select";
import { ChevronIcon } from "./icons/dashboard-icons";
import {
  convertOptionToExpression,
  convertOptionToFormState,
} from "@/utils/utils";
import MathContent from "./MathContent";

const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronIcon
        className="w-4 h-4"
        isOpen={props.selectProps.menuIsOpen}
        color="#805830"
      />
    </components.DropdownIndicator>
  );
};

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    marginBottom: "0 !important",
    minHeight: "48px",
    borderRadius: "8px",
    borderColor: "#E5E7EB",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#E5E7EB",
    },
    backgroundColor: "#f5f5f5",
    cursor: "default",
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  indicatorContainer: (base) => ({
    ...base,
    display: "none", // Hide dropdown indicator for view mode
  }),
  dropdownIndicator: (base) => ({
    ...base,
    display: "none",
  }),
};

const FormReactSelect = ({
  value,
  options,
  onChange,
  onSelectionChange,
  ...props
}) => {
  const selectedOption = options?.find((opt) => opt.value === value) || null;

  return (
    <ReactSelect
      {...props}
      options={options}
      value={selectedOption}
      onChange={(option) => {
        const val = option ? option.value : null;
        onChange?.(val);
        onSelectionChange?.(val, option);
      }}
    />
  );
};

function ViewQuestionForm({
  initialValues = {},
  topicOptionsParam = [],
  subTopicOptionsParam = [],
  closeModal,
}) {
  const [form] = useForm();
  const isClosedRange =
    initialValues.question_subtype == "RANGE_BASED_ANSWER" &&
    Object.keys(initialValues.options[0]).length == 2;
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(initialValues);
  
  const [selectedQuestionType, setSelectedQuestionType] = useState(
    initialValues.question_type
  );
  const [selectedSubQuestionType, setSelectedSubQuestionType] = useState(
    initialValues.question_subtype
  );
  const [selectedRange, setSelectedRange] = useState(
    isClosedRange ? "CLOSED RANGE" : "OPEN RANGE"
  );
  const [selectedTopic, setSelectedTopic] = useState(initialValues.topic);
  const [selectedSubTopic, setSelectedSubTopic] = useState(
    initialValues.sub_topic
  );
  const [expressions, setExpressions] = useState(
    convertOptionToExpression(initialValues.options) ?? [
      { variable: "ANS", operator: "<", value: null, logic: "AND" },
    ]
  );

  const [formState, setFormState] = useState(
    isClosedRange && convertOptionToFormState(initialValues.options[0])
  );

  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });

  const questionTypeOptions = [
    {
      value: "MCQ",
      label: "MCQ",
      subQuestionTypeOptions: [
        {
          value: "SINGLE_CHOICE",
          label: "Single Choice",
        },
        {
          value: "MULTI_CHOICE",
          label: "Multi Choice",
        },
        {
          value: "READING_COMPREHENSION",
          label: "Reading Comprehension",
        },
      ],
    },
    {
      value: "GRIDIN",
      label: "Grid In",
      subQuestionTypeOptions: [
        {
          value: "SINGLE_ANSWER",
          label: "Single Value Correct",
        },
        {
          value: "MULTI_ANSWER",
          label: "Multiple Value Correct",
        },
        {
          value: "RANGE_BASED_ANSWER",
          label: "Range Correct",
        },
      ],
    },
  ];

  const subQuestionTypeOptions =
    questionTypeOptions.find((questionTypeObject) => {
      return questionTypeObject.value == selectedQuestionType;
    })?.subQuestionTypeOptions ?? [];

  const difficultyOptions = [
    {
      value: "VERY_EASY",
      label: "Very Easy",
    },
    {
      value: "EASY",
      label: "Easy",
    },
    {
      value: "MODERATE",
      label: "Moderate",
    },
    {
      value: "HARD",
      label: "Hard",
    },
    {
      value: "VERY_HARD",
      label: "Very Hard",
    },
  ];
  const testTypeOptions = [
    {
      value: "SELF_PRACTICE_TEST",
      label: "Practice Questions",
    },
    {
      value: "FULL_LENGTH_TEST",
      label: "Full Length Test",
    },
  ];
  const showCalculatorOptions = [
    {
      value: true,
      label: "Yes",
    },
    {
      value: false,
      label: "No",
    },
  ];

  const difficultyMap = {
    VERY_EASY: { label: "Very Easy", color: "green" },
    EASY: { label: "Easy", color: "cyan" },
    MODERATE: { label: "Moderate", color: "blue" },
    HARD: { label: "Hard", color: "orange" },
    VERY_HARD: { label: "Very Hard", color: "red" },
  };

  const questionTypeMap = {
    MCQ: "MCQ",
    GRIDIN: "Grid In",
  };

  const questionSubtypeMap = {
    SINGLE_CHOICE: "Single Choice",
    MULTI_CHOICE: "Multi Choice",
    READING_COMPREHENSION: "Reading Comprehension",
    SINGLE_ANSWER: "Single Value Correct",
    MULTI_ANSWER: "Multiple Value Correct",
    RANGE_BASED_ANSWER: "Range Correct",
  };

  const handlePreview = () => {
    const values = form.getFieldsValue(true);
    setPreviewData({
      ...previewData,
      ...values,
    });
    setPreviewVisible(true);
  };

  const getDifficultyDisplay = (value) => {
    return difficultyMap[value] || { label: value, color: "default" };
  };

  // Convert options to display format
  const getDisplayOptions = () => {
    if (selectedSubQuestionType === "RANGE_BASED_ANSWER") {
      return initialValues.options || [];
    }
    return initialValues.options || [];
  };

  const displayOptions = getDisplayOptions();

  const getCorrectAnswers = () => {
    if (selectedQuestionType === "MCQ") {
      const correctOptions = displayOptions.filter(opt => opt.is_correct);
      if (selectedSubQuestionType === "SINGLE_CHOICE") {
        return correctOptions.length > 0 ? ["Option " + (displayOptions.indexOf(correctOptions[0]) + 1)] : ["None selected"];
      }
      return correctOptions.length > 0 
        ? correctOptions.map(opt => "Option " + (displayOptions.indexOf(opt) + 1))
        : ["None selected"];
    }
    return [];
  };

  const getRangeDisplay = () => {
    if (selectedSubQuestionType === "RANGE_BASED_ANSWER") {
      if (selectedRange === "CLOSED RANGE" && formState) {
        return `${formState.operator1 || ''} ANS ${formState.operator2 || ''}`;
      } else if (selectedRange === "OPEN RANGE") {
        return expressions.map((exp, idx) => 
          `${exp.variable} ${exp.operator} ${exp.value || '?'}`
        ).join(" OR ");
      }
    }
    return "-";
  };

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        className="space-y-6"
      >
        {/* Question Type Configuration Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-[#F59405]">
              Question Type Configuration
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Question type and subtype information
            </p>
          </div>

          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Question Type
                </label>
                <div className="bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                  <span className="font-medium">{questionTypeMap[selectedQuestionType] || selectedQuestionType}</span>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Sub Question Type
                </label>
                <div className="bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                  <span className="font-medium">{questionSubtypeMap[selectedSubQuestionType] || selectedSubQuestionType}</span>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Course Details Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-[#F59405]">Course Details</h3>
            <p className="text-sm text-gray-500 mt-1">
              Course information for this question
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <Row gutter={[24, 24]}>
              <Col md={12} lg={6} span={24}>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    Topic
                  </label>
                  <div className="bg-gray-100 px-4 py-2.5 rounded-lg border border-gray-200">
                    <span className="font-medium">{selectedTopic || "-"}</span>
                  </div>
                </div>
              </Col>
              <Col md={12} lg={6} span={24}>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    Sub Topic
                  </label>
                  <div className="bg-gray-100 px-4 py-2.5 rounded-lg border border-gray-200">
                    <span className="font-medium">{selectedSubTopic || "-"}</span>
                  </div>
                </div>
              </Col>
              <Col md={12} lg={6} span={24}>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    Test Type
                  </label>
                  <div className="bg-gray-100 px-4 py-2.5 rounded-lg border border-gray-200">
                    <span className="font-medium">
                      {testTypeOptions.find(opt => opt.value === initialValues.test_type)?.label || initialValues.test_type || "-"}
                    </span>
                  </div>
                </div>
              </Col>
              <Col md={12} lg={6} span={24}>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    Difficulty
                  </label>
                  <div className="bg-gray-100 px-4 py-2.5 rounded-lg border border-gray-200">
                    <Tag bordered={false} color={getDifficultyDisplay(initialValues.difficulty).color}>
                      {getDifficultyDisplay(initialValues.difficulty).label}
                    </Tag>
                  </div>
                </div>
              </Col>
            </Row>

            <div className="pt-4 mt-2 border-t border-gray-200">
              <Row gutter={[24, 24]}>
                <Col md={8} span={24}>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">
                      Show Calculator
                    </label>
                    <div className="bg-gray-100 px-4 py-2.5 rounded-lg border border-gray-200">
                      <span className="font-medium">
                        {initialValues.show_calculator ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </div>

        {/* Reading Passage Card - Conditional */}
        {selectedSubQuestionType == "READING_COMPREHENSION" &&
          selectedQuestionType == "MCQ" && initialValues.reading_comprehension_passage && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#007FBC] to-[#00A3E0] px-6 py-4">
                <h3 className="text-lg font-bold text-white m-0">
                  Reading Passage
                </h3>
              </div>
              <div className="p-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <MathContent content={initialValues.reading_comprehension_passage} />
                </div>
              </div>
            </div>
          )}

        {/* Question Content Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-[#F59405]">
              Question Details
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Question description and explanation
            </p>
          </div>
          <div>
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Question Text
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[80px]">
                    <MathContent content={initialValues.description} />
                  </div>
                </div>
              </Col>
              <Col xs={24} lg={12}>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Explanation
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[80px]">
                    {initialValues.explanation ? (
                      <MathContent content={initialValues.explanation} />
                    ) : (
                      <span className="text-gray-400">No explanation provided</span>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        {/* MCQ Options Card */}
        {selectedQuestionType == "MCQ" && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#F59405] to-[#F59405] px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white m-0">
                Answer Options
              </h3>
              <Tag className="text-white/90 bg-white/20 px-3 py-1.5 rounded-full border-0">
                {selectedSubQuestionType == "MULTI_CHOICE"
                  ? "Select multiple correct answers"
                  : "Select one correct answer"}
              </Tag>
            </div>

            <div className="p-6">
              <Row gutter={[24, 24]}>
                {displayOptions.map((option, index) => (
                  <Col md={12} sm={24} key={index}>
                    <div className={`rounded-xl p-4 border-2 transition-all duration-200 ${
                      option.is_correct 
                        ? "bg-green-50 border-green-400" 
                        : "bg-gray-50 border-gray-200"
                    }`}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="font-semibold text-gray-700">
                          Option {index + 1}
                          {option.is_correct && (
                            <Tag color="success" className="ml-2">✓ Correct</Tag>
                          )}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <MathContent content={option.description} />
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              {displayOptions.length === 0 && (
                <div className="text-center text-gray-400 py-4">No options available</div>
              )}
            </div>
          </div>
        )}

        {/* Grid-In Answers Card */}
        {selectedQuestionType == "GRIDIN" && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#F59405] to-[#F59405] px-6 py-4">
              <h3 className="text-lg font-bold text-white m-0">
                Correct Answer(s)
              </h3>
            </div>
            <div className="p-6">
              {["SINGLE_ANSWER", "MULTI_ANSWER"].includes(
                selectedSubQuestionType
              ) && (
                <div className="flex flex-wrap gap-3">
                  {displayOptions.map((option, index) => (
                    <div key={index} className="bg-green-50 border-2 border-green-400 rounded-lg px-6 py-3">
                      <span className="font-semibold text-lg">{option}</span>
                    </div>
                  ))}
                  {displayOptions.length === 0 && (
                    <div className="text-gray-400">No answers available</div>
                  )}
                </div>
              )}

              {selectedSubQuestionType == "RANGE_BASED_ANSWER" && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-semibold text-gray-700">
                      Range Type:
                    </span>
                    <Tag color="blue">{selectedRange}</Tag>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="font-mono text-lg text-center">
                      {selectedRange == "CLOSED RANGE" && formState ? (
                        <span>
                          <span className="font-bold text-blue-600">{formState.operator1 || '?'}</span>
                          <span className="mx-3">ANS</span>
                          <span className="font-bold text-blue-600">{formState.operator2 || '?'}</span>
                        </span>
                      ) : (
                        <span>
                          {expressions.map((exp, idx) => (
                            <span key={idx}>
                              {idx > 0 && <span className="mx-2 text-orange-500 font-bold">OR</span>}
                              <span className="font-bold text-blue-600">{exp.variable}</span>
                              <span className="mx-2">{exp.operator}</span>
                              <span className="font-bold text-green-600">{exp.value || '?'}</span>
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Section */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-[#F59405]">Question Status</h3>
          </div>
          <Row gutter={[24, 24]}>
            <Col md={6} sm={12} span={24}>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Status
                </label>
                <Tag color={initialValues.is_active ? "success" : "error"} className="text-base px-4 py-1">
                  {initialValues.is_active ? "Active" : "Inactive"}
                </Tag>
              </div>
            </Col>
            <Col md={6} sm={12} span={24}>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Created At
                </label>
                <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <span className="font-medium">{initialValues.created_at ? new Date(initialValues.created_at).toLocaleString() : "-"}</span>
                </div>
              </div>
            </Col>
            <Col md={6} sm={12} span={24}>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Created By
                </label>
                <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <span className="font-medium">{initialValues.created_by || "-"}</span>
                </div>
              </div>
            </Col>
            <Col md={6} sm={12} span={24}>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  Updated At
                </label>
                <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <span className="font-medium">{initialValues.updated_at ? new Date(initialValues.updated_at).toLocaleString() : "-"}</span>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Action Buttons */}
        <div className="!mt-6">
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="large"
              className="min-w-[120px] h-12 rounded-xl font-semibold border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
              onClick={closeModal}
            >
              Close
            </Button>

            <Button
              size="large"
              className="min-w-[120px] h-12 rounded-xl font-semibold border-[#007FBC] text-[#007FBC] hover:bg-[#007FBC] hover:text-white"
              onClick={handlePreview}
            >
              Preview
            </Button>
          </div>
        </div>
      </Form>
      {previewData && (
        <PreviewQuestionModal
          visible={previewVisible}
          onClose={() => setPreviewVisible(false)}
          questionData={previewData}
        />
      )}
    </>
  );
}

export default ViewQuestionForm;