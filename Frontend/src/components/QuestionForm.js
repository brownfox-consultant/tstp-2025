"use client";
import {
  createQuestionMultipleService,
  getSubjectTopics,
} from "@/app/services/authService";
import { getCoursesInsideAuth } from "@/app/services/courseService";
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
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popover,
  Radio,
  Row,
  Select,
  Space,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import QuestionMetaDataCard from "./QuestionMetaDataCard";
import RichTextEditor from "./RichTextEditor";
import PreviewQuestionModal from "./PreviewQuestionModal";

function QuestionForm({
  initialValues = {},
  action = "create",
  topicOptionsParam = [],
  subTopicOptionsParam = [],
}) {
  const [form] = useForm();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const router = useRouter();
  const [question, setQuestion] = useState();
  const [readingComprehensionPassage, setReadingComprehensionPassage] =
    useState();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  const [selectedQuestionType, setSelectedQuestionType] = useState();
  const [selectedSubQuestionType, setSelectedSubQuestionType] = useState();
  const [selectedCourseSubject, setSelectedCourseSubject] = useState();
  const [expressions, setExpressions] = useState([
    { variable: "ANS", operator: "<", value: 10, logic: "AND" },
  ]);
  const [submitLoader, setSubmitLoader] = useState(false);
  const [formState, setFormState] = useState({
    value1: "",
    operator1: "<",
    value2: "",
    operator2: ">",
  });
  const [selectedRange, setSelectedRange] = useState("CLOSED RANGE");

  const [subjectOptions, setSubjectOptions] = useState([]);
  const [topicOptions, setTopicOptions] = useState(topicOptionsParam);
  const [subTopicOptions, setSubTopicOptions] = useState(subTopicOptionsParam);
  const [selectedTopic, setSelectedTopic] = useState(initialValues.topic);
  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });
  // const [selectedSubTopic, setSelectedSubTopic] = useState(
  //   initialValues.sub_topic
  // );
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

  const openPreview = () => {
    const formValues = form.getFieldsValue(true); // get all current form values
    let options = formValues.options?.map((opt, idx) => ({
      ...opt,
      is_correct: !!opt.is_correct, // ensure boolean
    })) || [];

    setPreviewData({
      description: formValues.description,
      // directions: formValues.directions,
      reading_comprehension_passage: formValues.reading_comprehension_passage,
      options: options,
      explanation: formValues.explanation,
      question_type: formValues.question_type,
      question_subtype: formValues.question_subtype,
    });

    setPreviewVisible(true);
  };

  function handleKeyDown(e, add) {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
      // addNewInput(id);
    }
  }

  const subQuestionTypeOptions =
    questionTypeOptions.find((questionTypeObject) => {
      return questionTypeObject.value == selectedQuestionType;
    })?.subQuestionTypeOptions ?? [];

  // Handle change for inputs and selects
  const handleInputChange = (name, value) => {
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const addExpression = () => {
    setExpressions([
      ...expressions,
      { variable: "ANS", operator: "<", value: 5, logic: "AND" },
    ]);
  };

  const removeExpression = (index) => {
    let newExpressions = expressions.filter(
      (exp, expIndex) => expIndex != index
    );
    setExpressions(newExpressions);
  };

  const handleExpChange = (index, field, value) => {
    const updatedExpressions = [...expressions];
    updatedExpressions[index][field] = value;
    setExpressions(updatedExpressions);
  };

  const handleRadioChange = (e) => {
    const newOptions = form.getFieldValue("options").map((option, index) => ({
      ...option,
      is_correct: index === e.target.value,
    }));

    form.setFieldsValue({ options: newOptions });
  };

  useEffect(() => {
    if (action == "create") {
      getCoursesInsideAuth()
        .then((res) => {
          setCourses(res.data);
        })
        .catch((err) => console.log(err));
    }
  }, []);

  useEffect(() => {
    if (courses && courses.length > 0) {
      setSubjectOptions(
        courses
          .find((course) => course.name == selectedCourse)
          ?.subjects.map((subject) => {
            return {
              value: subject.course_subject_id,
              label: subject.name,
            };
          })
      );

      setSelectedCourseSubject();
      setSelectedTopic();
      form.setFieldValue("course_subject", null);
    }
  }, [courses, selectedCourse]);

  useEffect(() => {
    if (selectedCourseSubject && topicOptionsParam.length == 0) {
      getSubjectTopics(selectedCourseSubject).then((res) => {
        setTopicOptions(
          res.data.map((option) => {
            return { ...option, label: option.name };
          })
        );
      });

      setSelectedTopic();
      form.setFieldValue("topic", null);
      form.setFieldValue("sub_topic", null);
    }
  }, [selectedCourseSubject]);

  function transformExpressions(expressions) {
    return expressions.map((expression) => {
      const option = {};
      switch (expression.operator) {
        case ">":
          option["gt"] = expression.value;
          break;
        case ">=":
          option["gte"] = expression.value;
          break;
        case "<":
          option["lt"] = expression.value;
          break;
        case "<=":
          option["lte"] = expression.value;
          break;
        case "==":
          option["eq"] = expression.value;
          break;
        case "!=":
          option["neq"] = expression.value;
          break;
        default:
          break;
      }
      return option;
    });
  }

  useEffect(() => {
    if (selectedQuestionType == "GRIDIN") {
      form.setFieldValue(
        "options",
        selectedSubQuestionType == "SINGLE_ANSWER" ? [""] : ["", ""]
      );
    } else {
      // form.setFieldValue("options", [{}, {}, {}, {}]);
    }
  }, [selectedSubQuestionType]);

  const inverseOperatorMapping = {
    ">": "lt",
    ">=": "lte",
    "<": "gt",
    "<=": "gte",
    "==": "eq",
    "!=": "neq",
  };

  const normalOperatorMapping = {
    ">": "gt",
    ">=": "gte",
    "<": "lt",
    "<=": "lte",
    "==": "eq",
    "!=": "neq",
  };

  function handleInputNumber(e, name) {
    let val = e.target.value;

    const maxLength = Number(val) < 0 ? 6 : 5;
    if (val.length > maxLength) {
      val = val.slice(0, maxLength);
    }

    // Set the value in the form
    form.setFieldValue([name], val);
  }

  const handleKeyDownLengthCheck = (e) => {
    const { key, target } = e;
    const value = target.value;

    // Allow navigation and editing keys
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
    ];

    const maxLength = value.startsWith("-") ? 6 : 5;
    const extraChar = value.includes("/") || value.includes(".") ? 0 : 0;

    // Allow hyphen only at the beginning
    if (key === "-" && target.selectionStart === 0 && !value.includes("-")) {
      return;
    }

    // Allow forward slash only once, not at the beginning or end, and only if there's no decimal point
    if (
      key === "/" &&
      !value.includes("/") &&
      !value.includes(".") &&
      target.selectionStart !== 0 &&
      (target.selectionStart !== value.length || value.length < maxLength)
    ) {
      return;
    }

    // Allow decimal point only once and only if there's no forward slash
    if (key === "." && !value.includes(".") && !value.includes("/")) {
      return;
    }

    // Check the maxLength condition for all inputs

    // Prevent input if maxLength is reached
    if (value.length + extraChar >= maxLength && !allowedKeys.includes(key)) {
      e.preventDefault();
    }

    // Allow numbers
    if (/^[0-9]$/.test(key)) {
      return;
    }

    // Prevent default action for disallowed keys
    if (!allowedKeys.includes(key)) {
      e.preventDefault();
    }
  };

  const onSubmit = (values) => {
    if (action == "create") {
      // setSubmitLoader(true);
      const options =
        selectedRange == "OPEN RANGE"
          ? transformExpressions(expressions)
          : [
              {
                [inverseOperatorMapping[formState.operator1]]: formState.value1,
                [normalOperatorMapping[formState.operator2]]: formState.value2,
              },
            ];
      let payload = {
        ...values,
        ...(selectedSubQuestionType == "RANGE_BASED_ANSWER" && {
          options,
        }),
      };
      createQuestionMultipleService({ ...payload })
        .then((res) => {
          Modal.success({
            title: "Question successfully created",
            onOk: () => router.back(),
          });
        })
        .finally(() => setSubmitLoader(false));
    } else {
      // if (role == "admin") {
      //   editQuestionService(initialValues.id, {
      //     ...values,
      //     description: question,
      //     course_subject: courseSubId,
      //   })
      //     .then((res) => {
      //       closeModal();
      //       setUpdated(!updated);
      //     })
      //     .finally(() => setUpdateLoading(false));
      // } else {
      //   makeSuggestion({
      //     ...values,
      //     question: initialValues.id,
      //     description: question,
      //   })
      //     .then((res) => {
      //       closeModal();
      //       setUpdated(!updated);
      //       Modal.success({
      //         title: "Suggestion raised",
      //       });
      //     })
      //     .finally(() => setUpdateLoading(false));
      // }
    }
  };
  return (
    <>
      <div className="min-h-screen">
        <div className="w-full">
          <Form
            form={form}
            onFinish={onSubmit}
            layout="vertical"
            initialValues={initialValues}
            className="space-y-6"
          >
            {/* Question Type Selection Card */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-[#F59405]">
                  Question Type Configuration
                </h3>
                <p className="text-sm text-gray-500 mt-1">Select the type and subtype for your question</p>
              </div>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<div className="text-base font-semibold text-gray-700">Question Type</div>}
                    name="question_type"
                    required
                    rules={[
                      {
                        required: true,
                        message: "Please select a question type",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Select Question Type"
                      options={questionTypeOptions}
                      value={selectedSubQuestionType}
                      onChange={(value) => {
                        setSelectedQuestionType(value);
                        setSelectedSubQuestionType(undefined);
                        form.setFieldValue("question_subtype", undefined);
                      }}
                      size="large"
                      className="[&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!h-12"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<div className="text-base font-semibold text-gray-700">Sub Question Type</div>}
                    dependencies={["question_type"]}
                    name="question_subtype"
                    required
                    rules={[
                      {
                        required: true,
                        message: "Please select a sub question type",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Select Sub Question Type"
                      options={subQuestionTypeOptions}
                      value={selectedSubQuestionType}
                      onChange={setSelectedSubQuestionType}
                      size="large"
                      className="[&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!h-12"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Reading Comprehension Card */}
            {selectedSubQuestionType == "READING_COMPREHENSION" &&
              selectedQuestionType == "MCQ" && (
                <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-[#007FBC]">
                      Reading Comprehension Passage
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Add the reading passage for comprehension questions</p>
                  </div>
                  <Row gutter={[16, 16]}>
                    <Col xs={24}>
                      <Form.Item
                        label={<div className="text-base font-semibold text-gray-700">Reading Passage</div>}
                        name="reading_comprehension_passage"
                        required
                        rules={[
                          {
                            required: true,
                            message: "Please add a reading passage",
                          },
                        ]}
                      >
                        <RichTextEditor />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              )}

            {/* Question and Explanation Card */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-[#F59405]">
                  Question Details
                </h3>
                <p className="text-sm text-gray-500 mt-1">Provide the question description and explanation</p>
              </div>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<div className="text-base font-semibold text-gray-700">Question</div>}
                    name="description"
                    required
                    rules={[
                      {
                        required: true,
                        message: "Please add question description",
                      },
                    ]}
                  >
                    <RichTextEditor />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<div className="text-base font-semibold text-gray-700">Explanation</div>}
                    name="explanation"
                  >
                    <RichTextEditor />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* MCQ Options Card */}
            {selectedQuestionType == "MCQ" && (
              <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-[#F59405]">
                    Answer Options
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 italic">
                    {selectedSubQuestionType == "MULTI_CHOICE" 
                      ? "Check all correct options" 
                      : "Select the correct option"}
                  </p>
                </div>
                <Divider className="my-4 border-gray-200" />
                <Form.List name="options" initialValue={Array(4).fill({})}>
                  {(fields, { add, remove }) => (
                    <Row gutter={[16, 16]}>
                      {selectedSubQuestionType == "MULTI_CHOICE" ? (
                        fields.map(({ key, name, ...restField }, index) => (
                          <Col lg={12} xs={24} key={key}>
                            <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 hover:border-[#F59405] transition-all duration-300 hover:shadow-md">
                              <Row className="flex justify-between items-center mb-3">
                                <Col>
                                  <Form.Item
                                    {...restField}
                                    labelAlign="left"
                                    name={[name, "is_correct"]}
                                    valuePropName="checked"
                                    initialValue={false}
                                    className="mb-0"
                                  >
                                    <Checkbox className="text-base font-medium text-gray-700">
                                      Option {index + 1}
                                    </Checkbox>
                                  </Form.Item>
                                </Col>
                                {fields.length > 1 && (
                                  <Col>
                                    <CloseOutlined
                                      className="text-red-500 hover:text-red-700 cursor-pointer transition-colors duration-200"
                                      onClick={() => remove(name)}
                                    />
                                  </Col>
                                )}
                              </Row>
                              <Form.Item
                                {...restField}
                                name={[name, "description"]}
                                rules={[
                                  {
                                    required: true,
                                    message: "Missing option",
                                  },
                                ]}
                                className="mb-0"
                              >
                                <RichTextEditor />
                              </Form.Item>
                            </div>
                          </Col>
                        ))
                      ) : (
                        <Radio.Group className="w-full" onChange={handleRadioChange}>
                          <Row gutter={[16, 16]}>
                            {fields.map(({ key, name, ...restField }, index) => (
                              <Col xs={24} lg={12} key={key}>
                                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 hover:border-[#F59405] transition-all duration-300 hover:shadow-md">
                                  <Row className="flex justify-between items-center mb-3">
                                    <Col>
                                      <Form.Item
                                        {...restField}
                                        labelAlign="left"
                                        name={[name, "is_correct"]}
                                        valuePropName="checked"
                                        className="mb-0"
                                      >
                                        <Radio value={index} className="text-base font-medium text-gray-700">
                                          Option {index + 1}
                                        </Radio>
                                      </Form.Item>
                                    </Col>
                                    {fields.length > 1 && (
                                      <Col>
                                        <CloseOutlined
                                          className="text-red-500 hover:text-red-700 cursor-pointer transition-colors duration-200"
                                          onClick={() => remove(name)}
                                        />
                                      </Col>
                                    )}
                                  </Row>
                                  <Form.Item
                                    {...restField}
                                    name={[name, "description"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Missing option",
                                      },
                                    ]}
                                    className="mb-0"
                                  >
                                    <RichTextEditor />
                                  </Form.Item>
                                </div>
                              </Col>
                            ))}
                          </Row>
                        </Radio.Group>
                      )}

                      {fields.length <= 5 && (
                        <Col xs={24}>
                          <Form.Item className="flex justify-center mb-0">
                            <Button
                              type="dashed"
                              onClick={() => add()}
                              block
                              icon={<PlusOutlined />}
                              className="h-12 rounded-xl border-2 border-dashed border-[#FFD46A] hover:border-[#F59405] hover:text-[#F59405] transition-all duration-300 font-medium"
                            >
                              Add Option
                            </Button>
                          </Form.Item>
                        </Col>
                      )}
                    </Row>
                  )}
                </Form.List>
              </div>
            )}

            {/* Grid-In Answers Card */}
            {selectedQuestionType == "GRIDIN" && (
              <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-[#007FBC]">
                    Grid-In Answers
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Define the correct answer(s) or range</p>
                </div>
                
                {["SINGLE_ANSWER", "MULTI_ANSWER"].includes(selectedSubQuestionType) && (
                  <Form.List name="options" initialValue={Array(1).fill({ value: 1 })}>
                    {(fields, { add, remove }) => (
                      <Row gutter={[16, 16]}>
                        {fields.map(({ key, name, ...restField }, index) => (
                          <Col xs={24} sm={12} md={8} key={key}>
                            <Space direction="vertical" className="w-full">
                              <Form.Item
                                label={<div className="text-base font-semibold text-gray-700">Answer {index + 1}</div>}
                                {...restField}
                                name={[name]}
                                rules={[
                                  {
                                    required: true,
                                    message: "Missing answer",
                                  },
                                ]}
                                className="mb-0"
                              >
                                <Input
                                  value={form.getFieldValue([name])}
                                  onChange={(e) => handleInputNumber(e, name)}
                                  placeholder="Enter value"
                                  onKeyDown={(e) => {
                                    handleKeyDown(e, add);
                                    handleKeyDownLengthCheck(e);
                                  }}
                                  size="large"
                                  className="!rounded-lg !h-12"
                                />
                              </Form.Item>
                              <div className="flex gap-2">
                                {selectedSubQuestionType == "MULTI_ANSWER" && (
                                  <Popover content="Add more answer">
                                    <Button
                                      shape="circle"
                                      icon={<PlusOutlined />}
                                      onClick={() => add()}
                                      className="bg-[#007FBC] text-white border-0 hover:bg-[#006BA3]"
                                    />
                                  </Popover>
                                )}
                                {index > 0 && (
                                  <Button
                                    shape="circle"
                                    icon={<MinusCircleOutlined />}
                                    onClick={() => remove(name)}
                                    danger
                                  />
                                )}
                              </div>
                            </Space>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </Form.List>
                )}

                {selectedSubQuestionType == "RANGE_BASED_ANSWER" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="text-base font-semibold text-gray-700">Range Type:</div>
                      <Select
                        placeholder="Select type"
                        className="w-48 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!h-12"
                        value={selectedRange}
                        onChange={setSelectedRange}
                        options={[
                          { label: "CLOSED RANGE", value: "CLOSED RANGE" },
                          { label: "OPEN RANGE", value: "OPEN RANGE" },
                        ]}
                        size="large"
                      />
                    </div>

                    {selectedRange == "CLOSED RANGE" ? (
                      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-xl border border-[#FFD46A]">
                        <Space wrap align="baseline" size="middle">
                          <Form.Item
                            name="value1"
                            required
                            rules={[
                              {
                                required: true,
                                message: "Please add a value",
                              },
                            ]}
                            className="mb-0"
                          >
                            <Input
                              name="value1"
                              value={formState.value1}
                              onKeyDown={(e) => handleKeyDownLengthCheck(e)}
                              onChange={(e) => handleInputChange("value1", e.target.value)}
                              size="large"
                              className="w-32 !rounded-lg !h-12"
                              placeholder="Value 1"
                            />
                          </Form.Item>
                          <Form.Item className="mb-0">
                            <Select
                              name="operator1"
                              value={formState.operator1}
                              onChange={(value) => handleSelectChange("operator1", value)}
                              size="large"
                              className="w-24 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!h-12"
                            >
                              <Select.Option value="<">&lt;</Select.Option>
                              <Select.Option value="<=">&lt;=</Select.Option>
                              <Select.Option value=">">&gt;</Select.Option>
                              <Select.Option value=">=">&gt;=</Select.Option>
                              <Select.Option value="==">==</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item className="mb-0">
                            <InputNumber
                              className="font-bold w-24 !rounded-lg !h-12"
                              disabled
                              placeholder="ANS"
                              size="large"
                            />
                          </Form.Item>
                          <Form.Item className="mb-0">
                            <Select
                              name="operator2"
                              value={formState.operator2}
                              onChange={(value) => handleSelectChange("operator2", value)}
                              size="large"
                              className="w-24 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!h-12"
                            >
                              <Select.Option value="<">&lt;</Select.Option>
                              <Select.Option value="<=">&lt;=</Select.Option>
                              <Select.Option value=">">&gt;</Select.Option>
                              <Select.Option value=">=">&gt;=</Select.Option>
                              <Select.Option value="=">=</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name="value2"
                            required
                            rules={[
                              {
                                required: true,
                                message: "Please add a value",
                              },
                            ]}
                            className="mb-0"
                          >
                            <Input
                              onKeyDown={(e) => handleKeyDownLengthCheck(e)}
                              name="value2"
                              value={formState.value2}
                              onChange={(e) => handleInputChange("value2", e.target.value)}
                              size="large"
                              className="w-32 !rounded-lg !h-12"
                              placeholder="Value 2"
                            />
                          </Form.Item>
                        </Space>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {expressions.map((expression, index) => (
                          <div key={index} className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-[#70D9E4]">
                            <Space wrap align="baseline" size="middle">
                              {index > 0 && <span className="px-3 py-1 bg-[#007FBC] text-white rounded-lg font-semibold text-sm">OR</span>}
                              <Form.Item className="mb-0">
                                <Input
                                  disabled
                                  className="font-bold w-24 !rounded-lg !h-12"
                                  value={expression.variable}
                                  size="large"
                                />
                              </Form.Item>
                              <Form.Item required className="mb-0">
                                <Select
                                  value={expression.operator}
                                  onChange={(value) => handleExpChange(index, "operator", value)}
                                  size="large"
                                  className="w-24 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!h-12"
                                >
                                  <Select.Option value="<">&lt;</Select.Option>
                                  <Select.Option value="<=">&lt;=</Select.Option>
                                  <Select.Option value=">">&gt;</Select.Option>
                                  <Select.Option value=">=">&gt;=</Select.Option>
                                  <Select.Option value="=">=</Select.Option>
                                </Select>
                              </Form.Item>
                              <Form.Item
                                name={`value_${index}`}
                                required
                                rules={[{ required: true, message: "Please add a value" }]}
                                className="mb-0"
                              >
                                <Input
                                  onKeyDown={(e) => handleKeyDownLengthCheck(e)}
                                  value={expression.value}
                                  onChange={(e) => handleExpChange(index, "value", e.target.value)}
                                  size="large"
                                  className="w-32 !rounded-lg !h-12"
                                  placeholder="Value"
                                />
                              </Form.Item>
                              {expressions.length == 2 && index == 1 && (
                                <Button
                                  shape="circle"
                                  icon={<MinusCircleFilled />}
                                  onClick={() => removeExpression(index)}
                                  danger
                                />
                              )}
                              {expressions.length == 1 && (
                                <Button
                                  shape="circle"
                                  icon={<PlusCircleFilled />}
                                  onClick={addExpression}
                                  className="bg-[#F59405] text-white border-0 hover:bg-[#E08904]"
                                />
                              )}
                            </Space>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Course Details Card */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
              <div className="mb-1">
                <h3 className="text-xl font-bold text-[#F59405]">
                  Course Details
                </h3>
                <p className="text-sm text-gray-500 mt-1">Add course information and metadata for this question</p>
              </div>
              <div className="border-gray-200" />
              <Form.List name="questions_data" initialValue={Array(1).fill({})}>
                {(fields, { add, remove }) => (
                  <div className="space-y-4">
                    {fields.map(({ key, name, ...restField }, index) => (
                      <div key={key}>
                        <QuestionMetaDataCard
                          index={index}
                          name={name}
                          fields={fields}
                          courses={courses}
                          restField={restField}
                          add={add}
                          remove={remove}
                        />
                      </div>
                    ))}

                    {fields.length <= 5 && (
                      <Form.Item className="flex justify-center mb-0">
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                          className="h-12 rounded-xl border-2 border-dashed border-[#FFD46A] hover:border-[#F59405] hover:text-[#F59405] transition-all duration-300 font-medium"
                        >
                          Add this question in another course
                        </Button>
                      </Form.Item>
                    )}
                  </div>
                )}
              </Form.List>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
              <Form.Item className="flex justify-center mb-0">
                <Space size="middle" wrap>
                  <Button
                    onClick={openPreview}
                    size="large"
                    className="h-12 px-8 rounded-xl border-2 border-[#007FBC] text-[#007FBC] hover:bg-blue-50 font-semibold transition-all duration-300"
                  >
                    Preview
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitLoader}
                    size="large"
                    className="h-12 px-8 rounded-xl bg-[#F59405] border-0 hover:bg-[#E08904] font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Submit Question
                  </Button>
                  <Button
                    onClick={() => router.back()}
                    size="large"
                    className="h-12 px-8 rounded-xl border-2 border-gray-300 hover:border-gray-400 font-semibold transition-all duration-300"
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </div>
          </Form>
        </div>
      </div>

      {/* Preview Modal */}
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

export default QuestionForm;
