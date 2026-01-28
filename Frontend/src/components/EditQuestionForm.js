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
import ReactSelect, { components } from "react-select";
import { ChevronIcon } from "./icons/dashboard-icons";
import {
  convertOptionToExpression,
  convertOptionToFormState,
} from "@/utils/utils";

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
    borderColor: state.isFocused ? "#F59405" : "#E5E7EB",
    boxShadow: state.isFocused ? "0 0 0 1px #F59405" : "none",
    "&:hover": {
      borderColor: "#F59405",
    },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
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

function EditQuestionForm({
  initialValues = {},
  action = "create",
  topicOptionsParam = [],
  subTopicOptionsParam = [],
  courseSubId,
  page,
  courseSubjectId,
  hideButtons = false,
  closeModal,
  setUpdated,
}) {
  console.log("page", page)
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
  
  const availableCourseOptions =
  initialValues.available_courses?.map(c => ({
    label: `${c.course} (${c.subject})`,
    value: c.course_subject_id,
  })) || [];

  const [selectedCourseSubjectIds, setSelectedCourseSubjectIds] = useState(
  initialValues.available_courses?.map(c => c.course_subject_id) || [courseSubId]
);
const [courseStatusMap, setCourseStatusMap] = useState(
  initialValues.available_courses?.reduce((acc, c) => {
    acc[c.course_subject_id] = c.is_active;
    return acc;
  }, {}) || {}
);

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

  /* REMOVED CustomSelect IMPORT AND REPLACE WITH FormReactSelect */
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
            return { ...option, label: option.name, value: option.name };
          })
        );
      });

      setSelectedTopic();
      form.setFieldValue("topic", null);
      form.setFieldValue("sub_topic", null);
    }
  }, [selectedCourseSubject]);

  useEffect(() => {
    if (topicOptionsParam) {
      setTopicOptions(topicOptionsParam);
    }
  }, [topicOptionsParam]);

  useEffect(() => {
    if (subTopicOptionsParam) {
      const formattedSubTopics = subTopicOptionsParam.map((sub) => {
        const label = typeof sub === "object" ? sub.name : sub;
        return { ...sub, value: label, label: label };
      });
      setSubTopicOptions(formattedSubTopics);
    }
  }, [subTopicOptionsParam]);

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

    // if (pathname.includes("admin")) {
    //   editQuestionService(initialValues.id, {
    //     ...payload,
    //     course_subject: courseSubId,
    //   }).then((res) => {
    //     Modal.success({
    //       title: "Edited successfully",
    //       onOk: () => {
    //         if (closeModal) {
    //           closeModal();
    //         } else {
    //           router.push(
    //             `/admin/questions/questions?course_subject_id=${courseSubjectId}&page=${page}`
    //           );
    //         }
    //       },
    //     });
    //   });
    // }
    if (pathname.includes("admin")) {
  const course_updates = Object.entries(courseStatusMap).map(
    ([course_subject_id, is_active]) => ({
      course_subject_id: Number(course_subject_id),
      is_active,
    })
  );

  editQuestionService(initialValues.id, {
    ...payload,
    course_updates, // 🔥 FINAL
  }).then(() => {
    Modal.success({
      title: "Question updated successfully",
      content: `Updated in ${course_updates.length} course(s)`,
      onOk: () => {
        closeModal?.();
      },
    });
  });
}

    
    else {
      makeSuggestion({
        ...payload,
        question: initialValues.id,
      }).then((res) => {
        Modal.success({
          title: "Suggestion raised",
          onOk: () => {
            if (closeModal) {
              closeModal();
            } else {
              router.back();
            }
          },
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
        className="space-y-6"
      >
        {/* Question Type Configuration Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-[#F59405]">
              Question Type Configuration
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Select the type and subtype for your question
            </p>
          </div>

          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span className="text-sm font-semibold text-gray-700">
                    Question Type
                  </span>
                }
                name="question_type"
                required
                rules={[
                  { required: true, message: "Please select a question type" },
                ]}
                className="!mb-0"
              >
                <FormReactSelect
                  placeholder="Select Question Type"
                  options={questionTypeOptions}
                  onSelectionChange={(value) => {
                    setSelectedQuestionType(value);
                    setSelectedSubQuestionType(undefined);
                    form.setFieldValue("question_subtype", undefined);
                    form.setFieldValue("options", [{}]);
                  }}
                  styles={customSelectStyles}
                  components={{ DropdownIndicator }}
                  classNamePrefix="react-select"
                  menuPortalTarget={
                    typeof document !== "undefined" ? document.body : null
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span className="text-sm font-semibold text-gray-700">
                    Sub Question Type
                  </span>
                }
                name="question_subtype"
                required
                rules={[
                  {
                    required: true,
                    message: "Please select a sub question type",
                  },
                ]}
                className="!mb-0"
              >
                <FormReactSelect
                  placeholder="Select Sub Question Type"
                  options={subQuestionTypeOptions}
                  onSelectionChange={(value) => {
                    setSelectedSubQuestionType(value);
                  }}
                  styles={customSelectStyles}
                  components={{ DropdownIndicator }}
                  classNamePrefix="react-select"
                  menuPortalTarget={
                    typeof document !== "undefined" ? document.body : null
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Course Details Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-[#F59405]">Course Details</h3>
            <p className="text-sm text-gray-500 mt-1">
              Update course information for this question
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <Row gutter={[24, 24]}>
              {action == "create" && (
                <Col md={12} lg={6} span={24}>
                  <Form.Item
                    label={
                      <span className="text-sm font-semibold text-gray-700">
                        Course
                      </span>
                    }
                    name="course"
                    required
                    className="!mb-0"
                  >
                    <FormReactSelect
                      onSelectionChange={(v) => setSelectedCourse(v)}
                      placeholder="Select Course"
                      options={courses?.map((course) => {
                        return { value: course.name, label: course.name };
                      })}
                      styles={customSelectStyles}
                      components={{ DropdownIndicator }}
                      classNamePrefix="react-select"
                      menuPortalTarget={
                        typeof document !== "undefined" ? document.body : null
                      }
                    />
                  </Form.Item>
                </Col>
              )}

              {/* {action === "edit" && initialValues.available_in_other_courses && (
  <Col span={24}>
    <Form.Item
      label={
        <span className="text-sm font-semibold text-gray-700">
          Update Question In Courses
        </span>
      }
      required
    >
      <ReactSelect
        isMulti
        options={availableCourseOptions}
        value={availableCourseOptions.filter(opt =>
          selectedCourseSubjectIds.includes(opt.value)
        )}
        onChange={(selected) =>
          setSelectedCourseSubjectIds(selected.map(s => s.value))
        }
        styles={customSelectStyles}
        components={{ DropdownIndicator }}
        classNamePrefix="react-select"
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : null
        }
      />
      <p className="text-xs text-gray-500 mt-1">
        Changes will be applied to all selected courses
      </p>
    </Form.Item>
  </Col>
)} */}


              <Col md={12} lg={6} span={24}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-gray-700">
                      Topic
                    </span>
                  }
                  name="topic"
                  required
                  className="!mb-0"
                >
                  <FormReactSelect
                    options={topicOptions}
                    value={selectedTopic}
                    onSelectionChange={(value) => {
                      setSelectedTopic(value);
                      setSelectedSubTopic();
                      form.setFieldValue("sub_topic", null);
                      setSubTopicOptions(
                        topicOptions.find(
                          (topicOption) => topicOption.name == value
                        )?.subtopics?.map((sub) => {
                          const label = typeof sub === 'object' ? sub.name : sub;
                          return { value: label, label: label };
                        }) || []
                      );
                    }}
                    placeholder="Select Topic"
                    styles={customSelectStyles}
                    components={{ DropdownIndicator }}
                    classNamePrefix="react-select"
                    menuPortalTarget={
                      typeof document !== "undefined" ? document.body : null
                    }
                  />
                </Form.Item>
              </Col>
              <Col md={12} lg={6} span={24}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-gray-700">
                      Sub Topic
                    </span>
                  }
                  name="sub_topic"
                  className="!mb-0"
                >
                  <FormReactSelect
                    options={subTopicOptions}
                    value={selectedSubTopic}
                    onSelectionChange={(value) => setSelectedSubTopic(value)}
                    placeholder="Select Sub Topic"
                    styles={customSelectStyles}
                    components={{ DropdownIndicator }}
                    classNamePrefix="react-select"
                    menuPortalTarget={
                      typeof document !== "undefined" ? document.body : null
                    }
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="pt-4 mt-2 border-t border-gray-200">
              <Row gutter={[24, 24]}>
                <Col md={8} span={24}>
                  <Form.Item
                    label={
                      <span className="text-sm font-semibold text-gray-700">
                        Test Type
                      </span>
                    }
                    name="test_type"
                    required
                    className="!mb-0"
                  >
                    <FormReactSelect
                      placeholder="Select Test Type"
                      options={testTypeOptions}
                      styles={customSelectStyles}
                      components={{ DropdownIndicator }}
                      classNamePrefix="react-select"
                      menuPortalTarget={
                        typeof document !== "undefined" ? document.body : null
                      }
                    />
                  </Form.Item>
                </Col>
                <Col md={8} span={24}>
                  <Form.Item
                    label={
                      <span className="text-sm font-semibold text-gray-700">
                        Difficulty
                      </span>
                    }
                    name="difficulty"
                    required
                    className="!mb-0"
                  >
                    <FormReactSelect
                      placeholder="Select Difficulty"
                      options={difficultyOptions}
                      styles={customSelectStyles}
                      components={{ DropdownIndicator }}
                      classNamePrefix="react-select"
                      menuPortalTarget={
                        typeof document !== "undefined" ? document.body : null
                      }
                    />
                  </Form.Item>
                </Col>

                <Col md={8} span={24}>
                  <Form.Item
                    label={
                      <span className="text-sm font-semibold text-gray-700">
                        Show Calculator
                      </span>
                    }
                    name="show_calculator"
                    required
                    className="!mb-0"
                  >
                    <FormReactSelect
                      placeholder="Show Calculator"
                      options={showCalculatorOptions}
                      value={selectedShowCalculatorOption}
                      onSelectionChange={setSelectedShowCalculatorOption}
                      styles={customSelectStyles}
                      components={{ DropdownIndicator }}
                      classNamePrefix="react-select"
                      menuPortalTarget={
                        typeof document !== "undefined" ? document.body : null
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

             {action === "edit" && initialValues.available_in_other_courses && (
  <Col span={24}>
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        Course-wise Status
      </h4>

      <div className="space-y-2">
        {initialValues.available_courses.map((c) => (
          <div
            key={c.course_subject_id}
            className="flex items-center justify-between bg-white p-3 rounded-lg border"
          >
            <div>
              <div className="font-medium">{c.course}</div>
              <div className="text-xs text-gray-500">{c.subject}</div>
            </div>

            <Radio.Group
              value={courseStatusMap[c.course_subject_id]}
              onChange={(e) =>
                setCourseStatusMap((prev) => ({
                  ...prev,
                  [c.course_subject_id]: e.target.value,
                }))
              }
            >
              <Radio.Button value={true}>Active</Radio.Button>
              <Radio.Button value={false}>Inactive</Radio.Button>
            </Radio.Group>
          </div>
        ))}
      </div>
    </div>
  </Col>
)}


            </div>
          </div>
        </div>

        {/* Reading Passage Card - Conditional */}
        {selectedSubQuestionType == "READING_COMPREHENSION" &&
          selectedQuestionType == "MCQ" && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#007FBC] to-[#00A3E0] px-6 py-4">
                <h3 className="text-lg font-bold text-white m-0">
                  Reading Passage
                </h3>
              </div>
              <div className="p-6">
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-gray-700">
                      Passage Content
                    </span>
                  }
                  name="reading_comprehension_passage"
                  required
                  rules={[
                    { required: true, message: "Please add a reading passage" },
                  ]}
                  className="!mb-0"
                >
                  <RichTextEditor />
                </Form.Item>
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
              Provide the question description and explanation
            </p>
          </div>
          <div>
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-gray-700">
                      Question Text
                    </span>
                  }
                  name="description"
                  required
                  rules={[
                    {
                      required: true,
                      message: "Please add question description",
                    },
                  ]}
                  className="!mb-0"
                >
                  <RichTextEditor />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-gray-700">
                      Explanation
                    </span>
                  }
                  name="explanation"
                  className="!mb-0"
                >
                  <RichTextEditor />
                </Form.Item>
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
              <span className="text-xs font-medium text-white/90 bg-white/20 px-3 py-1.5 rounded-full">
                {selectedSubQuestionType == "MULTI_CHOICE"
                  ? "Select multiple correct answers"
                  : "Select one correct answer"}
              </span>
            </div>

            <div className="p-6">
              <Form.List name="options">
                {(fields, { add, remove }) => (
                  <div className="space-y-4">
                    <Row gutter={[24, 24]}>
                      {selectedSubQuestionType == "MULTI_CHOICE" ? (
                        fields.map(({ key, name, ...restField }, index) => (
                          <Col md={12} sm={24} key={key}>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-[#F59405] hover:shadow-sm transition-all duration-200">
                              <div className="flex justify-between items-center mb-3">
                                <Form.Item
                                  {...restField}
                                  labelAlign="left"
                                  name={[name, "is_correct"]}
                                  valuePropName="checked"
                                  initialValue={false}
                                  className="!mb-0"
                                  wrapperCol={{ span: 24 }}
                                >
                                  <Checkbox className="font-semibold text-gray-700">
                                    Option {index + 1}
                                  </Checkbox>
                                </Form.Item>
                                {fields.length > 1 && (
                                  <Button
                                    type="text"
                                    danger
                                    icon={<CloseOutlined />}
                                    onClick={() => remove(name)}
                                    className="hover:bg-red-50"
                                  />
                                )}
                              </div>
                              <Form.Item
                                {...restField}
                                name={[name, "description"]}
                                rules={[
                                  { required: true, message: "Missing option" },
                                ]}
                                className="!mb-0"
                              >
                                <RichTextEditor />
                              </Form.Item>
                            </div>
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
                          <Row gutter={[24, 24]}>
                            {fields.map(
                              ({ key, name, ...restField }, index) => (
                                <Col md={12} sm={24} key={key}>
                                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-[#F59405] hover:shadow-sm transition-all duration-200">
                                    <div className="flex justify-between items-center mb-3">
                                      <Form.Item
                                        {...restField}
                                        labelAlign="left"
                                        name={[name, "is_correct"]}
                                        valuePropName="checked"
                                        className="!mb-0"
                                        wrapperCol={{ span: 24 }}
                                      >
                                        <Radio
                                          value={index}
                                          className="font-semibold text-gray-700"
                                        >
                                          Option {index + 1}
                                        </Radio>
                                      </Form.Item>
                                      {fields.length > 1 && (
                                        <Button
                                          type="text"
                                          danger
                                          icon={<CloseOutlined />}
                                          onClick={() => remove(name)}
                                          className="hover:bg-red-50"
                                        />
                                      )}
                                    </div>
                                    <Form.Item
                                      {...restField}
                                      name={[name, "description"]}
                                      rules={[
                                        {
                                          required: true,
                                          message: "Missing option",
                                        },
                                      ]}
                                      className="!mb-0"
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
                    </Row>

                    {fields.length <= 5 && (
                      <button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                        className="px-5 py-3 rounded-lg border border-dashed border-[#F59405] bg-[#FFF8F0] text-[#F59405] hover:!bg-[#F59405] hover:!text-white hover:!border-[#F59405] font-semibold transition-all duration-300 flex items-center justify-center gap-2 w-auto mx-auto"
                      >
                        Add Option
                      </button>
                    )}
                  </div>
                )}
              </Form.List>
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
                  <Form.List name="options">
                    {(fields, { add, remove }) => (
                      <div className="flex flex-wrap gap-4">
                        {fields.map(({ key, name, ...restField }, index) => (
                          <div key={key} className="flex items-center gap-2">
                            <Form.Item
                              label={
                                <span className="text-sm font-semibold text-gray-700">
                                  Answer {index + 1}
                                </span>
                              }
                              {...restField}
                              name={[name]}
                              rules={[
                                { required: true, message: "Missing answer" },
                              ]}
                              className="!mb-0"
                            >
                              <Input
                                value={form.getFieldValue([name])}
                                onChange={(e) => handleInputNumber(e, name)}
                                placeholder="Enter value"
                                onKeyDown={(e) => {
                                  handleKeyDown(e, add);
                                  handleKeyDownLengthCheck(e);
                                }}
                                className="w-32 h-10 rounded-lg font-semibold"
                              />
                            </Form.Item>
                            {selectedSubQuestionType == "MULTI_ANSWER" && (
                              <Popover content="Add more answer">
                                <Button
                                  shape="circle"
                                  icon={<PlusOutlined />}
                                  onClick={() => add()}
                                  type="primary"
                                  className="bg-[#F59405] border-[#F59405] hover:bg-[#d68104]"
                                />
                              </Popover>
                            )}
                            {index > 0 && (
                              <Button
                                type="text"
                                danger
                                icon={<MinusCircleOutlined />}
                                onClick={() => remove(name)}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Form.List>
                )}

              {selectedSubQuestionType == "RANGE_BASED_ANSWER" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-700">
                      Range Type:
                    </span>
                    <FormReactSelect
                      placeholder="Select type"
                      onSelectionChange={(value) => setSelectedRange(value)}
                      options={[
                        { label: "Closed Range", value: "CLOSED RANGE" },
                        { label: "Open Range", value: "OPEN RANGE" },
                      ]}
                      styles={customSelectStyles}
                      components={{ DropdownIndicator }}
                      classNamePrefix="react-select"
                      menuPortalTarget={
                        typeof document !== "undefined" ? document.body : null
                      }
                      value={selectedRange}
                    />
                  </div>

                  {selectedRange == "CLOSED RANGE" ? (
                    <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <Form.Item
                        name="value1"
                        required
                        rules={[{ required: true, message: "Required" }]}
                        className="!mb-0"
                      >
                        <Input
                          name="value1"
                          value={formState.value1}
                          onKeyDown={(e) => handleKeyDownLengthCheck(e)}
                          onChange={(e) =>
                            handleInputChange("value1", e.target.value)
                          }
                          className="w-24 h-10 rounded-lg font-semibold m-0"
                          placeholder="Min"
                        />
                      </Form.Item>
                      <Form.Item className="!mb-0">
                        <FormReactSelect
                          name="operator1"
                          onSelectionChange={(value) =>
                            handleSelectChange("operator1", value)
                          }
                          options={[
                            { value: "<", label: "<" },
                            { value: "<=", label: "<=" },
                            { value: ">", label: ">" },
                            { value: ">=", label: ">=" },
                            { value: "=", label: "=" },
                          ]}
                          styles={customSelectStyles}
                          components={{ DropdownIndicator }}
                          classNamePrefix="react-select"
                          menuPortalTarget={
                            typeof document !== "undefined"
                              ? document.body
                              : null
                          }
                          value={formState.operator1}
                        />
                      </Form.Item>
                      <div className="h-10 px-4 flex items-center bg-gray-200 rounded-lg font-bold text-gray-600">
                        ANS
                      </div>
                      <Form.Item className="!mb-0">
                        <FormReactSelect
                          name="operator2"
                          onSelectionChange={(value) =>
                            handleSelectChange("operator2", value)
                          }
                          options={[
                            { value: "<", label: "<" },
                            { value: "<=", label: "<=" },
                            { value: ">", label: ">" },
                            { value: ">=", label: ">=" },
                            { value: "=", label: "=" },
                          ]}
                          styles={customSelectStyles}
                          components={{ DropdownIndicator }}
                          classNamePrefix="react-select"
                          menuPortalTarget={
                            typeof document !== "undefined"
                              ? document.body
                              : null
                          }
                          value={formState.operator2}
                        />
                      </Form.Item>
                      <Form.Item
                        name="value2"
                        required
                        rules={[{ required: true, message: "Required" }]}
                        className="!mb-0"
                      >
                        <Input
                          onKeyDown={(e) => handleKeyDownLengthCheck(e)}
                          name="value2"
                          value={formState.value2}
                          onChange={(e) =>
                            handleInputChange("value2", e.target.value)
                          }
                          className="w-24 h-10 rounded-lg font-semibold"
                          placeholder="Max"
                        />
                      </Form.Item>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {expressions.map((expression, index) => (
                        <div
                          key={index}
                          className="flex flex-wrap items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200"
                        >
                          {index > 0 && (
                            <span className="font-bold text-[#F59405] px-2">
                              OR
                            </span>
                          )}
                          <div className="h-10 px-6 flex items-center justify-center bg-gray-200 rounded-lg font-bold text-gray-600">
                            {expression.variable}
                          </div>
                          <Form.Item required className="!mb-0">
                            <FormReactSelect
                              onSelectionChange={(value) =>
                                handleExpChange(index, "operator", value)
                              }
                              options={[
                                { value: "<", label: "<" },
                                { value: "<=", label: "<=" },
                                { value: ">", label: ">" },
                                { value: ">=", label: ">=" },
                                { value: "=", label: "=" },
                              ]}
                              styles={customSelectStyles}
                              components={{ DropdownIndicator }}
                              classNamePrefix="react-select"
                              menuPortalTarget={
                                typeof document !== "undefined"
                                  ? document.body
                                  : null
                              }
                              value={expression.operator}
                            />
                          </Form.Item>
                          <Form.Item
                            name={`value_${index}`}
                            required
                            rules={[{ required: true, message: "Required" }]}
                            className="!mb-0"
                          >
                            <Input
                              onKeyDown={(e) => handleKeyDownLengthCheck(e)}
                              value={expression.value}
                              onChange={(e) =>
                                handleExpChange(index, "value", e.target.value)
                              }
                              className="w-24 h-10 rounded-lg font-semibold"
                              placeholder="Value"
                            />
                          </Form.Item>
                          <div className="flex gap-2 ml-auto">
                            {expressions.length == 2 && index == 1 && (
                              <Button
                                shape="circle"
                                danger
                                icon={<MinusCircleFilled />}
                                onClick={() => removeExpression(index)}
                              />
                            )}
                            {expressions.length == 1 && (
                              <Button
                                shape="circle"
                                type="primary"
                                icon={<PlusCircleFilled />}
                                onClick={addExpression}
                                className="bg-[#F59405] border-[#F59405]"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="!mt-6">
          <div className="flex flex-wrap justify-center gap-4">
            {!hideButtons && (
              <Button
                size="large"
                className="min-w-[120px] h-12 rounded-xl font-semibold border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
                onClick={() => {
                  if (closeModal) {
                    closeModal();
                  } else {
                    router.back();
                  }
                }}
              >
                Cancel
              </Button>
            )}

            <Button
              size="large"
              className="min-w-[120px] h-12 rounded-xl font-semibold border-[#007FBC] text-[#007FBC] hover:bg-[#007FBC] hover:text-white"
              onClick={handlePreview}
            >
              Preview
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-[#F59405] to-[#FF7A00] border-none font-bold shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:opacity-90"
            >
              {action == "create" ? "Create Question" : "Update Question"}
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

export default EditQuestionForm;
