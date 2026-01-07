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
    <Form
      form={form}
      onFinish={onSubmit}
      layout="vertical"
      initialValues={initialValues}
      // onFieldsChange={onFieldsChange}
    >
      <Row gutter={[16]}>
        <Col span={24} sm={5}>
          <Form.Item
            label={<div className="text-base font-semibold">Question Type</div>}
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
            ></Select>
          </Form.Item>
        </Col>
        <Col span={24} sm={5}>
          <Form.Item
            label={
              <div className="text-base font-semibold">Sub Question Type</div>
            }
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
                  <div className="text-base font-semibold">Reading Passage</div>
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
            </Col> */}
          </Row>
        )}
      {/* {selectedQuestionType == "MCQ" &&
        selectedSubQuestionType !== "READING_COMPREHENSION" && (
          <Row gutter={[8, 8]}>
            <Col md={19} sm={24}>
              <Form.Item
                label={<div className="text-base font-semibold">Question</div>}
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
        <div className="border-gray-300 border-2 rounded-md p-5">
          <div className="mb-3 text-base font-semibold">Options</div>
          <span className=" text-sm text-grey-400 italic">
            Tick the checkbox of the correct option
          </span>
          <Divider className="my-4" />
          <Form.List name="options" initialValue={Array(4).fill({})}>
            {(fields, { add, remove }) => (
              <Row gutter={[16, 8]}>
                {selectedSubQuestionType == "MULTI_CHOICE" ? (
                  fields.map(({ key, name, ...restField }, index) => (
                    <Col lg={12} sm={24}>
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
                  <Radio.Group className="w-full" onChange={handleRadioChange}>
                    <Row gutter={[16, 0]}>
                      {fields.map(({ key, name, ...restField }, index) => (
                        <Col span={24} lg={12}>
                          <Row
                            key={key}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              marginBottom: 2,
                            }}
                          >
                            <Row className="flex justify-between align-middle">
                              <Col span={24} lg={12}>
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
                  <Form.Item className="w-full flex justify-center">
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      Add Option
                    </Button>
                  </Form.Item>
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
              initialValue={Array(1).fill({ value: 1 })}
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
                            placeholder="Enter value"
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
                      <Option value="==">==</Option>
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
                      value={formState.operator2}
                      onChange={(value) =>
                        handleSelectChange("operator2", value)
                      }
                    >
                      <Option value="<">&lt;</Option>
                      <Option value="<=">&lt;=</Option>
                      <Option value=">">&gt;</Option>
                      <Option value=">=">&gt;=</Option>
                      <Option value="=">=</Option>
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
                          <Option value="=">=</Option>
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

      <div className="border-gray-300 border-2 rounded-md p-5 my-5">
        <div className="mb-3 text-base font-semibold">Course Details</div>
        <span className=" text-sm text-grey-400 italic">
          Add courses and other information for the question
        </span>
        <Divider className="my-4" />
        <Form.List name="questions_data" initialValue={Array(1).fill({})}>
          {(fields, { add, remove }) => (
            <Row gutter={[16, 8]}>
              {fields.map(({ key, name, ...restField }, index) => (
                <Col span={24}>
                  <QuestionMetaDataCard
                    key={key}
                    index={index}
                    name={name}
                    fields={fields}
                    courses={courses}
                    restField={restField}
                    add={add}
                    remove={remove}
                  />
                </Col>
              ))}

              {fields.length <= 5 && (
                <Col span={24}>
                  <Form.Item className="flex justify-center">
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      Add this question in another course
                    </Button>
                  </Form.Item>
                </Col>
              )}
            </Row>
          )}
        </Form.List>
      </div>

        <Form.Item className="flex justify-center">
          <Button type="default" className="mr-3" onClick={openPreview}>
            Preview
          </Button>
          <Button type="primary" htmlType="submit" loading={submitLoader}>
            Submit
          </Button>
          <Button className="ml-5" onClick={() => router.back()}>
            Cancel
        </Button>
        
        </Form.Item>
    </Form>

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
