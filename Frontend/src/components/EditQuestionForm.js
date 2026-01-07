import {
  editQuestionService,
  getSubjectTopics,
  makeSuggestion,
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
  Form,
  InputNumber,
  Modal,
  Popover,
  Radio,
  Row,
  Select,
  Space,
  Input,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import CustomSelect from "./CustomSelect";
import { useMediaQuery } from "react-responsive";
import RichTextEditor from "./RichTextEditor";
import PreviewQuestionModal from "./PreviewQuestionModal"
import {
  convertOptionToExpression,
  convertOptionToFormState,
} from "@/utils/utils";

function EditQuestionForm({
  initialValues = {},
  action = "create",
  topicOptionsParam = [],
  subTopicOptionsParam = [],
  courseSubId,
  page,
  courseSubjectId,
}) {
  console.log("page",page)
  const [form] = useForm();
  const pathname = usePathname();
  const isClosedRange =
    initialValues.question_subtype == "RANGE_BASED_ANSWER" &&
    Object.keys(initialValues.options[0]).length == 2;
  const [question, setQuestion] = useState(initialValues.description);
  const [readingComprehensionPassage, setReadingComprehensionPassage] =
    useState(initialValues.reading_comprehension_passage);
  const [courses, setCourses] = useState([]);
  const [selectedQuestionType, setSelectedQuestionType] = useState(
    initialValues.question_type
  );
  const [selectedSubQuestionType, setSelectedSubQuestionType] = useState(
    initialValues.question_subtype
  );
  const [selectedRange, setSelectedRange] = useState(
    isClosedRange ? "CLOSED RANGE" : "OPEN RANGE"
  );
  const [selectedCourse, setSelectedCourse] = useState(courseSubId);
  const [selectedCourseSubject, setSelectedCourseSubject] = useState();
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [topicOptions, setTopicOptions] = useState(topicOptionsParam);
  const [subTopicOptions, setSubTopicOptions] = useState(subTopicOptionsParam);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(initialValues);
  const [selectedTopic, setSelectedTopic] = useState(initialValues.topic);
  const [selectedShowCalculatorOption, setSelectedShowCalculatorOption] =
    useState(initialValues.show_calculator);

  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });
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

  const handlePreview = () => {
  const values = form.getFieldsValue(true);
  setPreviewData({
    ...previewData,
    ...values,
  });
  setPreviewVisible(true);
  };
  
  function handleKeyDown(e, add) {
    if (e.key === "Enter" && selectedSubQuestionType == "MULTI_ANSWER") {
      e.preventDefault();
      add();
      // addNewInput(id);
    }
  }

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

  const handleSelectChange = (name, value) => {
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleInputChange = (name, value) => {
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const router = useRouter();

  const handleRadioChange = (e) => {
    const newOptions = form.getFieldValue("options").map((option, index) => ({
      ...option,
      is_correct: index === e.target.value,
    }));

    form.setFieldsValue({ options: newOptions });
  };

  useEffect(() => {
    const formValues = {};
    if (isClosedRange) {
      Object.entries(formState).forEach(([key, value]) => {
        formValues[key] = value;
      });
    } else {
      expressions?.forEach((expression, index) => {
        formValues[`value_${index}`] = expression.value;
      });
    }
    form.setFieldsValue(formValues);
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

  useEffect(() => {
    if (
      selectedQuestionType == "GRIDIN" &&
      ["SINGLE_ANSWER", "MULTI_ANSWER"].includes(selectedSubQuestionType) &&
      Object.keys(initialValues).length == 0
    ) {
      form.setFieldValue(
        "options",
        selectedSubQuestionType == "SINGLE_ANSWER" ? [""] : ["", ""]
      );
    } else {
      // form.setFieldValue("options", [{}, {}, {}, {}]);
    }
  }, [selectedSubQuestionType]);

  const onSubmit = (values) => {
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

    if (pathname.includes("admin")) {
      editQuestionService(initialValues.id, {
        ...payload,
        course_subject: courseSubId,
      }).then((res) => {
        Modal.success({
          title: "Edited successfully",
          onOk: () =>
        router.push(
          `/admin/questions/questions?course_subject_id=${courseSubjectId}&page=${page}`
        ),
        });
      });
    } else {
      makeSuggestion({
        ...payload,
        question: initialValues.id,
      }).then((res) => {
        Modal.success({
          title: "Suggestion raised",
          onOk: () => router.back(),
        });
      });
    }
  };

  return (
    <>
      <Form
        form={form}
        onFinish={onSubmit}
        layout="vertical"
        initialValues={initialValues}
      >
        <Row gutter={[8, 8]}>
          <Col md={8} sm={24} lg={6}>
            <Form.Item
              label={
                <div className="text-base font-semibold">Question Type</div>
              }
              name="question_type"
              required
            >
              <Select
                placeholder="Select Question Type"
                options={questionTypeOptions}
                value={selectedQuestionType}
                onChange={(value) => {
                  setSelectedQuestionType(value);
                  setSelectedSubQuestionType(undefined);
                  form.setFieldValue("question_subtype", undefined);
                  form.setFieldValue("options", [{}]);
                }}
              ></Select>
            </Form.Item>
          </Col>
          <Col md={8} sm={24} lg={6}>
            <Form.Item
              label={
                <div className="text-base font-semibold">Sub Question Type</div>
              }
              name="question_subtype"
              required
            >
              <Select
                placeholder="Select Sub Question Type"
                options={subQuestionTypeOptions}
                value={selectedSubQuestionType}
                onChange={(value) => {
                  setSelectedSubQuestionType(value);
                }}
              ></Select>
            </Form.Item>
          </Col>
          {action == "create" && (
            <Col md={4} sm={24}>
              <Form.Item
                label={<div className="text-base font-semibold">Course</div>}
                name="course"
                required
              >
                <Select
                  onChange={(v) => setSelectedCourse(v)}
                  value={selectedCourse}
                  placeholder="Select Course"
                  options={courses?.map((course) => {
                    return { value: course.name, label: course.name };
                  })}
                ></Select>
              </Form.Item>
            </Col>
          )}

          <Col md={8} sm={24} lg={6}>
            <Form.Item
              label={<div className="text-base font-semibold">Topic</div>}
              name="topic"
              required
            >
              <CustomSelect
                fieldName="Topic"
                options={topicOptions}
                value={selectedTopic}
                onChange={(value) => {
                  setSelectedTopic(value);
                  setSelectedSubTopic();
                  form.setFieldValue("sub_topic", null);
                  setSubTopicOptions(
                    topicOptions.find(
                      (topicOption) => topicOption.name == value
                    )?.subtopics
                  );
                }}
              />
            </Form.Item>
          </Col>
          <Col md={8} sm={24} lg={6}>
            <Form.Item
              label={<div className="text-base font-semibold">Sub Topic</div>}
              name="sub_topic"
            >
              <CustomSelect
                fieldName="Sub Topic"
                options={subTopicOptions}
                value={selectedSubTopic}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[8, 8]}>
          <Col md={8} sm={24} lg={6}>
            <Form.Item
              label={<div className="text-base font-semibold">Test Type</div>}
              name="test_type"
              required
            >
              <Select
                placeholder="Select Test Type"
                options={testTypeOptions}
              ></Select>
            </Form.Item>
          </Col>
          <Col md={8} sm={24} lg={6}>
            <Form.Item
              label={<div className="text-base font-semibold">Difficulty</div>}
              name="difficulty"
              required
            >
              <Select
                placeholder="Select Difficulty"
                options={difficultyOptions}
              ></Select>
            </Form.Item>
          </Col>

          <Col md={5} sm={24}>
            <Form.Item
              label={
                <div className="text-base font-semibold">Show Calculator</div>
              }
              name="show_calculator"
              required
            >
              <Select
                placeholder="Show Calculator"
                options={showCalculatorOptions}
                value={selectedShowCalculatorOption}
                onChange={setSelectedShowCalculatorOption}
              ></Select>
            </Form.Item>
          </Col>
        </Row>
        {selectedSubQuestionType == "READING_COMPREHENSION" &&
          selectedQuestionType == "MCQ" && (
            <Row gutter={[8, 8]}>
              <Col md={12} sm={24}>
                <Form.Item
                  label={
                    <div className="text-base font-semibold">
                      Reading Passage
                    </div>
                  }
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
              {/* <Col md={12} sm={24}>
                <Form.Item
                  label={
                    <div className="text-base font-semibold">Question</div>
                  }
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
              </Col> */}
            </Row>
          )}
        {/* {selectedQuestionType == "MCQ" &&
          selectedSubQuestionType !== "READING_COMPREHENSION" && (
            <Row gutter={[8, 8]}>
              <Col md={19} sm={24}>
                <Form.Item
                  label={
                    <div className="text-base font-semibold">Question</div>
                  }
                  name="description"
                  rules={[
                    {
                      required: true,
                      message: "Please add question description",
                    },
                  ]}
                  required
                >
                  <RichTextEditor />
                </Form.Item>
              </Col>
            </Row>
          )} */}

        <Row gutter={[8, 8]}>
          {/* <Col md={12} sm={24}>
            <Form.Item
              label={<div className="text-base font-semibold">Directions</div>}
              name="directions"
            >
              <RichTextEditor />
            </Form.Item>
          </Col> */}
           <Col md={12} sm={24}>
            <Form.Item
              label={<div className="text-base font-semibold">Explanation</div>}
              name="explanation"
            >
              <RichTextEditor />
            </Form.Item>
          </Col>
          <Col md={12} sm={24}>
            <Form.Item
              label={<div className="text-base font-semibold">Question</div>}
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
        </Row>

        {selectedQuestionType == "MCQ" && (
          <div>
            <div className="mb-3 text-base font-semibold">Options:</div>

            <Form.List name="options">
              {(fields, { add, remove }) => (
                <Row gutter={[16, 8]}>
                  {selectedSubQuestionType == "MULTI_CHOICE" ? (
                    fields.map(({ key, name, ...restField }, index) => (
                      <Col md={12} sm={24}>
                        <Row
                          key={key}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            marginBottom: 2,
                          }}
                        >
                          <Row className="flex justify-between align-middle">
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                labelAlign="left"
                                name={[name, "is_correct"]}
                                valuePropName="checked"
                                initialValue={false}
                                className="mb-0"
                                wrapperCol={{ span: 24 }}
                              >
                                <Checkbox className="w-max">
                                  Option {index + 1}
                                </Checkbox>
                              </Form.Item>
                            </Col>
                            {fields.length > 1 ? (
                              <CloseOutlined
                                className="dynamic-delete-button mb-2 mr-1"
                                onClick={() => remove(name)}
                              />
                            ) : null}
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
                          >
                            <RichTextEditor />
                          </Form.Item>
                        </Row>
                      </Col>
                    ))
                  ) : (
                    <Radio.Group
                      className="w-full"
                      defaultValue={initialValues.options.findIndex(
                        ({ is_correct }) => is_correct == true
                      )}
                      onChange={handleRadioChange}
                    >
                      <Row gutter={[16, 0]}>
                        {fields.map(({ key, name, ...restField }, index) => (
                          <Col md={12} sm={24}>
                            <Row
                              key={key}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                marginBottom: 2,
                              }}
                            >
                              <Row className="flex justify-between align-middle">
                                <Col span={6}>
                                  <Form.Item
                                    {...restField}
                                    labelAlign="left"
                                    name={[name, "is_correct"]}
                                    valuePropName="checked"
                                    className="mb-0"
                                    wrapperCol={{ span: 24 }}
                                  >
                                    <Radio value={index} className="w-max">
                                      Option {index + 1}
                                    </Radio>
                                  </Form.Item>
                                </Col>
                                {fields.length > 1 ? (
                                  <CloseOutlined
                                    className="dynamic-delete-button mb-2 mr-1"
                                    onClick={() => remove(name)}
                                  />
                                ) : null}
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
                              >
                                <RichTextEditor />
                              </Form.Item>
                            </Row>
                          </Col>
                        ))}
                      </Row>
                    </Radio.Group>
                  )}

                  {fields.length <= 5 && (
                    <Col md={24} sm={24}>
                      <Form.Item className="">
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
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

        {selectedQuestionType == "GRIDIN" && (
          <>
            {["SINGLE_ANSWER", "MULTI_ANSWER"].includes(
              selectedSubQuestionType
            ) && (
              <Form.List
                name="options"
                initialValue={Array(
                  selectedSubQuestionType == "SINGLE_ANSWER" ? 1 : 2
                ).fill({})}
              >
                {(fields, { add, remove }) => (
                  <Row gutter={[16, 8]}>
                    {fields.map(({ key, name, ...restField }, index) => (
                      <Col span={3}>
                        <Space>
                          <Form.Item
                            label={
                              <div className="text-base font-semibold">
                                Answer
                              </div>
                            }
                            {...restField}
                            name={[name]}
                            rules={[
                              {
                                required: true,
                                message: "Missing answer",
                              },
                            ]}
                          >
                            <Input
                              value={form.getFieldValue([name])}
                              onChange={(e) => handleInputNumber(e, name)}
                              placeholder="Enter number"
                              onKeyDown={(e) => {
                                handleKeyDown(e, add);
                                handleKeyDownLengthCheck(e);
                              }}
                            ></Input>
                          </Form.Item>
                          {selectedSubQuestionType == "MULTI_ANSWER" && (
                            <Popover content={`Add more answer`}>
                              <Button
                                shape="circle"
                                icon={<PlusOutlined />}
                                onClick={() => add()}
                                type="primary"
                              ></Button>
                            </Popover>
                          )}
                          {index > 0 && (
                            <MinusCircleOutlined onClick={() => remove(name)} />
                          )}
                        </Space>
                      </Col>
                    ))}
                  </Row>
                )}
              </Form.List>
            )}
            {selectedSubQuestionType == "RANGE_BASED_ANSWER" && (
              <div>
                <div className="my-2 text-base font-semibold">Answer Range</div>
                <Select
                  placeholder="Select type"
                  className="w-40"
                  style={{ marginRight: "1rem" }}
                  value={selectedRange}
                  onChange={setSelectedRange}
                  options={[
                    { label: "CLOSED RANGE", value: "CLOSED RANGE" },
                    { label: "OPEN RANGE", value: "OPEN RANGE" },
                  ]}
                ></Select>
                {selectedRange == "CLOSED RANGE" ? (
                  <Space className="" align="baseline">
                    <Form.Item
                      name="value1"
                      required
                      rules={[
                        {
                          required: true,
                          message: "Please add a value",
                        },
                      ]}
                    >
                      <Input
                        name="value1"
                        value={formState.value1}
                        onKeyDown={(e) => handleKeyDownLengthCheck(e)}
                        onChange={(e) =>
                          handleInputChange("value1", e.target.value)
                        }
                      />
                    </Form.Item>
                    <Form.Item>
                      <Select
                        style={{ width: "4rem" }}
                        name="operator1"
                        value={formState.operator1}
                        onChange={(value) =>
                          handleSelectChange("operator1", value)
                        }
                      >
                        <Option value="<">&lt;</Option>
                        <Option value="<=">&lt;=</Option>
                        <Option value=">">&gt;</Option>
                        <Option value=">=">&gt;=</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item>
                      <InputNumber
                        className="font-bold"
                        disabled
                        placeholder="ANS"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Select
                        name="operator2"
                        style={{ width: "4rem" }}
                        value={formState.operator2}
                        onChange={(value) =>
                          handleSelectChange("operator2", value)
                        }
                      >
                        <Option value="<">&lt;</Option>
                        <Option value="<=">&lt;=</Option>
                        <Option value=">">&gt;</Option>
                        <Option value=">=">&gt;=</Option>
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
                    >
                      <Input
                        onKeyDown={(e) => handleKeyDownLengthCheck(e)}
                        name="value2"
                        value={formState.value2}
                        onChange={(e) =>
                          handleInputChange("value2", e.target.value)
                        }
                      />
                    </Form.Item>
                  </Space>
                ) : (
                  <>
                    {expressions.map((expression, index) => (
                      <Space className="mr-1" key={index} align="baseline">
                        {index > 0 && (
                          <span className=" mx-2 font-semibold">OR</span>
                        )}
                        <Form.Item>
                          <Input
                            disabled
                            name="variable"
                            className="font-bold"
                            value={expression.variable}
                          />
                        </Form.Item>
                        <Form.Item required>
                          <Select
                            value={expression.operator}
                            onChange={(value) =>
                              handleExpChange(index, "operator", value)
                            }
                          >
                            <Option value="<">&lt;</Option>
                            <Option value="<=">&lt;=</Option>
                            <Option value=">">&gt;</Option>
                            <Option value=">=">&gt;=</Option>
                          </Select>
                        </Form.Item>
                        <Form.Item
                          name={`value_${index}`}
                          required
                          rules={[
                            { required: true, message: "Please add a value" },
                          ]}
                        >
                          <Input
                            onKeyDown={(e) => handleKeyDownLengthCheck(e)}
                            value={expression.value}
                            onChange={(e) =>
                              handleExpChange(index, "value", e.target.value)
                            }
                          />
                        </Form.Item>
                        {expressions.length == 2 && index == 1 && (
                          <MinusCircleFilled
                            onClick={() => removeExpression(index)}
                          />
                        )}
                        {expressions.length == 1 && (
                          <PlusCircleFilled onClick={addExpression} />
                        )}
                      </Space>
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        )}

        <Row className="my-2" gutter={[8, 8]}>
          {/* <Col md={12} sm={24}>
            <Form.Item
              label={<div className="text-base font-semibold">Explanation</div>}
              name="explanation"
            >
              <RichTextEditor />
            </Form.Item>
          </Col> */}
        </Row>
<Form.Item className="flex justify-center space-x-2">
  <Button type="primary" htmlType="submit">
    {pathname.includes("admin") ? "Update" : "Suggest"}
  </Button>
  
  <Button
    className="ml-2"
    onClick={() => router.back()}
  >
    Cancel
  </Button>

 

<Button type="default" className="ml-2" onClick={handlePreview}>
    Preview Question
  </Button>

<PreviewQuestionModal
  visible={previewVisible}
  onClose={() => setPreviewVisible(false)}
  questionData={previewData}
/>



</Form.Item>


      </Form>
    </>
  );
}

export default EditQuestionForm;
