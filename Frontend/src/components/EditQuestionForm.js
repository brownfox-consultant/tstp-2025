import {
  editQuestionService,
  getSubjectTopics,
  makeSuggestion,
} from "@/app/services/authService";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import {
  CloseOutlined,
  LeftOutlined,
  MinusCircleFilled,
  MinusCircleOutlined,
  PlusCircleFilled,
  PlusOutlined,
  ArrowLeftOutlined 
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Col,
  Divider,
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
import FormSelect from "./FormSelect";
import { useMediaQuery } from "react-responsive";
import RichTextEditor from "./RichTextEditor";
import PreviewQuestionModal from "./PreviewQuestionModal";
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
  isHead = false,
}) {
  console.log("page", page);
  const [form] = useForm();
  const pathname = usePathname();
  const router = useRouter(); // Moved up if needed, but it was already there lower down? No, checking.

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
    }
  }

  const subQuestionTypeOptions =
    questionTypeOptions.find((questionTypeObject) => {
      return questionTypeObject.value == selectedQuestionType;
    })?.subQuestionTypeOptions ?? [];

  const difficultyOptions = [
    { value: "VERY_EASY", label: "Very Easy" },
    { value: "EASY", label: "Easy" },
    { value: "MODERATE", label: "Moderate" },
    { value: "HARD", label: "Hard" },
    { value: "VERY_HARD", label: "Very Hard" },
  ];

  const testTypeOptions = [
    { value: "SELF_PRACTICE_TEST", label: "Practice Questions" },
    { value: "FULL_LENGTH_TEST", label: "Full Length Test" },
  ];

  const showCalculatorOptions = [
    { value: true, label: "Yes" },
    { value: false, label: "No" },
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

  // const router = useRouter(); // Removed from here as I moved it up

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
    form.setFieldValue([name], val);
  }

  const handleKeyDownLengthCheck = (e) => {
    const { key, target } = e;
    const value = target.value;
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
    ];
    const maxLength = value.startsWith("-") ? 6 : 5;
    const extraChar = value.includes("/") || value.includes(".") ? 0 : 0;

    if (key === "-" && target.selectionStart === 0 && !value.includes("-")) {
      return;
    }
    if (
      key === "/" &&
      !value.includes("/") &&
      !value.includes(".") &&
      target.selectionStart !== 0 &&
      (target.selectionStart !== value.length || value.length < maxLength)
    ) {
      return;
    }
    if (key === "." && !value.includes(".") && !value.includes("/")) {
      return;
    }
    if (value.length + extraChar >= maxLength && !allowedKeys.includes(key)) {
      e.preventDefault();
    }
    if (/^[0-9]$/.test(key)) {
      return;
    }
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
      <div className="min-h-screen">
          {isHead && (
            <div className="flex items-center gap-4 mb-4 justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {action == "suggest"
                    ? "Suggest changes to question"
                    : "Edit Question"}
                </h1>
                <p className="text-sm text-gray-500">
                  {action == "suggest"
                    ? "Propose modifications to this question"
                    : "Update the details of the question"}
                </p>
              </div>
              <button
                onClick={() => router.back()}
                className="px-5 py-3 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 shadow transition-all duration-300 hover:scale-105 cursor-pointer border-0"
              >
                <ArrowLeftOutlined />
                Back
              </button>
            </div>
          )}
        <div className="w-full">
          <Form
            form={form}
            onFinish={onSubmit}
            layout="vertical"
            initialValues={initialValues}
            className="space-y-6"
          >
            {/* Question Type Configuration Card */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-[#F59405]">
                  Question Type Configuration
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Select the type and subtype for your question
                </p>
              </div>
              <Divider className="my-4 border-gray-200" />
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                  <Form.Item
                    label={
                      <div className="text-base font-semibold text-gray-700">
                        Question Type
                      </div>
                    }
                    name="question_type"
                    required
                  >
                    <FormSelect
                      placeholder="Select Question Type"
                      options={questionTypeOptions}
                      value={selectedQuestionType}
                      onChange={(value) => {
                        setSelectedQuestionType(value);
                        setSelectedSubQuestionType(undefined);
                        form.setFieldValue("question_subtype", undefined);
                        form.setFieldValue("options", [{}]);
                      }}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Form.Item
                    label={
                      <div className="text-base font-semibold text-gray-700">
                        Sub Question Type
                      </div>
                    }
                    name="question_subtype"
                    required
                  >
                    <FormSelect
                      placeholder="Select Sub Question Type"
                      options={subQuestionTypeOptions}
                      value={selectedSubQuestionType}
                      onChange={(value) => {
                        setSelectedSubQuestionType(value);
                      }}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                {action == "create" && (
                  <Col xs={24} sm={12} lg={6}>
                    <Form.Item
                      label={
                        <div className="text-base font-semibold text-gray-700">
                          Course
                        </div>
                      }
                      name="course"
                      required
                    >
                      <FormSelect
                        onChange={(v) => setSelectedCourse(v)}
                        value={selectedCourse}
                        placeholder="Select Course"
                        options={courses?.map((course) => {
                          return { value: course.name, label: course.name };
                        })}
                        className="w-full"
                      />
                    </Form.Item>
                  </Col>
                )}
                <Col xs={24} sm={12} lg={6}>
                  <Form.Item
                    label={
                      <div className="text-base font-semibold text-gray-700">
                        Topic
                      </div>
                    }
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
                <Col xs={24} sm={12} lg={6}>
                  <Form.Item
                    label={
                      <div className="text-base font-semibold text-gray-700">
                        Sub Topic
                      </div>
                    }
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
            </div>

            {/* Test Settings Card */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-[#007FBC]">
                  Test Settings
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Configure test type, difficulty, and calculator options
                </p>
              </div>
              <Divider className="my-4 border-gray-200" />
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item
                    label={
                      <div className="text-base font-semibold text-gray-700">
                        Test Type
                      </div>
                    }
                    name="test_type"
                    required
                  >
                    <FormSelect
                      placeholder="Select Test Type"
                      options={testTypeOptions}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item
                    label={
                      <div className="text-base font-semibold text-gray-700">
                        Difficulty
                      </div>
                    }
                    name="difficulty"
                    required
                  >
                    <FormSelect
                      placeholder="Select Difficulty"
                      options={difficultyOptions}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item
                    label={
                      <div className="text-base font-semibold text-gray-700">
                        Show Calculator
                      </div>
                    }
                    name="show_calculator"
                    required
                  >
                    <FormSelect
                      placeholder="Show Calculator"
                      options={showCalculatorOptions}
                      value={selectedShowCalculatorOption}
                      onChange={setSelectedShowCalculatorOption}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Reading Comprehension Passage Card */}
            {selectedSubQuestionType == "READING_COMPREHENSION" &&
              selectedQuestionType == "MCQ" && (
                <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-[#007FBC]">
                      Reading Comprehension Passage
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Add the reading passage for comprehension questions
                    </p>
                  </div>
                  <Divider className="my-4 border-gray-200" />
                  <Row gutter={[16, 16]}>
                    <Col xs={24}>
                      <Form.Item
                        label={
                          <div className="text-base font-semibold text-gray-700">
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
                  </Row>
                </div>
              )}

            {/* Question Details Card */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-[#F59405]">
                  Question Details
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Provide the question description and explanation
                </p>
              </div>
              <Divider className="my-4 border-gray-200" />
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <div className="text-base font-semibold text-gray-700">
                        Question
                      </div>
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
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <div className="text-base font-semibold text-gray-700">
                        Explanation
                      </div>
                    }
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
                <Form.List name="options">
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
                        <Radio.Group
                          className="w-full"
                          defaultValue={initialValues.options?.findIndex(
                            ({ is_correct }) => is_correct == true
                          )}
                          onChange={handleRadioChange}
                        >
                          <Row gutter={[16, 16]}>
                            {fields.map(
                              ({ key, name, ...restField }, index) => (
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
                                          <Radio
                                            value={index}
                                            className="text-base font-medium text-gray-700"
                                          >
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
                              )
                            )}
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
                  <p className="text-sm text-gray-500 mt-1">
                    Define the correct answer(s) or range
                  </p>
                </div>
                <Divider className="my-4 border-gray-200" />

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
                      <Row gutter={[16, 16]}>
                        {fields.map(({ key, name, ...restField }, index) => (
                          <Col xs={24} sm={12} md={8} key={key}>
                            <Space direction="vertical" className="w-full">
                              <Form.Item
                                label={
                                  <div className="text-base font-semibold text-gray-700">
                                    Answer {index + 1}
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
                      <div className="text-base font-semibold text-gray-700">
                        Range Type:
                      </div>
                      <FormSelect
                        placeholder="Select type"
                        className="w-48"
                        value={selectedRange}
                        onChange={setSelectedRange}
                        options={[
                          { label: "CLOSED RANGE", value: "CLOSED RANGE" },
                          { label: "OPEN RANGE", value: "OPEN RANGE" },
                        ]}
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
                              onChange={(e) =>
                                handleInputChange("value1", e.target.value)
                              }
                              size="large"
                              className="w-32 !rounded-lg !h-12"
                              placeholder="Value 1"
                            />
                          </Form.Item>
                          <Form.Item className="mb-0">
                            <FormSelect
                              name="operator1"
                              value={formState.operator1}
                              onChange={(value) =>
                                handleSelectChange("operator1", value)
                              }
                              className="w-24"
                              options={[
                                { value: "<", label: "<" },
                                { value: "<=", label: "<=" },
                                { value: ">", label: ">" },
                                { value: ">=", label: ">=" },
                              ]}
                            />
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
                            <FormSelect
                              name="operator2"
                              value={formState.operator2}
                              onChange={(value) =>
                                handleSelectChange("operator2", value)
                              }
                              className="w-24"
                              options={[
                                { value: "<", label: "<" },
                                { value: "<=", label: "<=" },
                                { value: ">", label: ">" },
                                { value: ">=", label: ">=" },
                              ]}
                            />
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
                              onChange={(e) =>
                                handleInputChange("value2", e.target.value)
                              }
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
                          <div
                            key={index}
                            className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-[#70D9E4]"
                          >
                            <Space wrap align="baseline" size="middle">
                              {index > 0 && (
                                <span className="px-3 py-1 bg-[#007FBC] text-white rounded-lg font-semibold text-sm">
                                  OR
                                </span>
                              )}
                              <Form.Item className="mb-0">
                                <Input
                                  disabled
                                  className="font-bold w-24 !rounded-lg !h-12"
                                  value={expression.variable}
                                  size="large"
                                />
                              </Form.Item>
                              <Form.Item required className="mb-0">
                                <FormSelect
                                  value={expression.operator}
                                  onChange={(value) =>
                                    handleExpChange(index, "operator", value)
                                  }
                                  className="w-24"
                                  options={[
                                    { value: "<", label: "<" },
                                    { value: "<=", label: "<=" },
                                    { value: ">", label: ">" },
                                    { value: ">=", label: ">=" },
                                  ]}
                                />
                              </Form.Item>
                              <Form.Item
                                name={`value_${index}`}
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
                                  value={expression.value}
                                  onChange={(e) =>
                                    handleExpChange(
                                      index,
                                      "value",
                                      e.target.value
                                    )
                                  }
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

            {/* Action Buttons Card */}
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <Form.Item className="flex justify-center mb-0">
                <Space size="middle" wrap>
                  <button
                    onClick={handlePreview}
                    size="large"
                    className="h-12 px-8 rounded-xl border-2 border-[#007FBC] text-[#007FBC] hover:bg-blue-50 font-semibold transition-all duration-300"
                  >
                    Preview Question
                  </button>
                  <button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    className="h-12 px-8 rounded-xl bg-[#F59405] border-0 hover:bg-[#E08904] font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {pathname.includes("admin") ? "Update" : "Suggest"}
                  </button>
                  <button
                    onClick={() => router.back()}
                    size="large"
                    className="h-12 px-8 rounded-xl border-2 border-gray-300 hover:border-gray-400 font-semibold transition-all duration-300"
                  >
                    Cancel
                  </button>
                </Space>
              </Form.Item>
            </div>
          </Form>
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewQuestionModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        questionData={previewData}
      />
    </>
  );
}

export default EditQuestionForm;
