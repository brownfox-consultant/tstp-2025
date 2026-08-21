import { CloseOutlined } from "@ant-design/icons";
import { Col, Form, Row, Button, Radio } from "antd";
import React, { useEffect, useState, useRef } from "react";
import ReactSelect, { components } from "react-select";
import { ChevronIcon } from "./icons/dashboard-icons";

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

const FormReactSelect = ({ value, options, onChange, onSelectionChange, ...props }) => {
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
import { getSubjectTopics } from "@/app/services/authService";
import { useForm } from "antd/es/form/Form";
import { useRouter } from "next/navigation";

function QuestionMetaDataCard({
  add,
  key,
  index,
  name,
  fields,
  courses,
  restField,
  remove,
}) {
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

  const form = Form.useFormInstance();

  const getInitialValue = (fieldName) => {
    const data = form.getFieldValue("questions_data");
    return data && data[name] ? data[name][fieldName] : undefined;
  };

  const [selectedCourse, setSelectedCourse] = useState(
    () => getInitialValue("course") || (courses && courses.length > 0 ? courses[0].name : undefined)
  );
  const [selectedCourseSubject, setSelectedCourseSubject] = useState(
    () => getInitialValue("course_subject")
  );
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [topicOptions, setTopicOptions] = useState([]);
  const [subTopicOptions, setSubTopicOptions] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(
    () => getInitialValue("topic")
  );
  const [selectedSubTopic, setSelectedSubTopic] = useState(
    () => getInitialValue("sub_topic")
  );

  const router = useRouter();
  const isUserChange = useRef(false);

  useEffect(() => {
    if (courses && courses.length > 0) {
      if (!selectedCourse && courses[0]) {
        setSelectedCourse(courses[0].name);
        return;
      }

      setSubjectOptions(
        courses
          .find((course) => course.name == selectedCourse)
          ?.subjects.map((subject) => {
            return {
              value: subject.course_subject_id,
              label: subject.name,
            };
          }) || []
      );

      if (isUserChange.current) {
        setSelectedCourseSubject();
        setSelectedTopic();
        form.setFieldValue([name, "course_subject"], null);
      }
    }
  }, [courses, selectedCourse]);

  useEffect(() => {
    if (selectedCourseSubject) {
      getSubjectTopics(selectedCourseSubject).then((res) => {
        setTopicOptions(
          res.data.map((option) => {
            return { ...option, value: option.name, label: option.name };
          })
        );
      });

      if (isUserChange.current) {
        setSelectedTopic();
        form.setFieldValue([name, "topic"], null);
        form.setFieldValue([name, "sub_topic"], null);
      }
    }
  }, [selectedCourseSubject]);

  useEffect(() => {
    if (selectedTopic && topicOptions.length > 0) {
      setSubTopicOptions(
        topicOptions.find((topicOption) => topicOption.name == selectedTopic)
          ?.subtopics?.map(sub => {
            const label = typeof sub === 'object' ? sub.name : sub;
            return { value: label, label: label };
          }) || []
      );
      
      if (isUserChange.current) {
        setSelectedSubTopic(null);
        form.setFieldValue([name, "sub_topic"], null);
      }
    }
  }, [selectedTopic, topicOptions]);

  return (
    <div key={key} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-bold text-gray-700 m-0">
          Details for Course {index + 1}
        </h4>

        {fields.length > 1 && (
          <Button
            type="text"
            danger
            icon={<CloseOutlined />}
            onClick={() => remove(name)}
            className="hover:bg-red-50 rounded-lg"
          >
            Remove
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <Row gutter={[24, 24]}>
          <Col md={12} lg={6} span={24}>
            <Form.Item
              {...restField}
              label={<span className="text-sm font-semibold text-gray-700">Course</span>}
              name={[name, "course"]}
              required
              rules={[
                {
                  required: true,
                  message: "Please select a course",
                },
                {
                  validator: (_, value) => {
                    const questionsData = form.getFieldValue("questions_data") || [];
                    const isDuplicate = questionsData.some(
                      (item, idx) => idx !== name && item?.course === value
                    );
                    if (isDuplicate) {
                      return Promise.reject(new Error("You cannot select the same course twice"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              className="!mb-0"
            >
              <FormReactSelect
                onSelectionChange={(value) => {
                  isUserChange.current = true;
                  setSelectedCourse(value);
                }}
                placeholder="Select Course"
                options={courses?.map((course) => {
                  return { value: course.name, label: course.name };
                })}
                styles={customSelectStyles}
                components={{ DropdownIndicator }}
                classNamePrefix="react-select"
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              />
            </Form.Item>
          </Col>

          <Col md={12} lg={6} span={24}>
            <Form.Item
              {...restField}
              label={<span className="text-sm font-semibold text-gray-700">Subject</span>}
              name={[name, "course_subject"]}
              required
              rules={[
                {
                  required: true,
                  message: "Please select a subject",
                },
              ]}
              className="!mb-0"
            >
              <FormReactSelect
                placeholder="Select Subject"
                options={subjectOptions}
                onSelectionChange={(value) => {
                  isUserChange.current = true;
                  setSelectedCourseSubject(value);
                }}
                styles={customSelectStyles}
                components={{ DropdownIndicator }}
                classNamePrefix="react-select"
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              />
            </Form.Item>
          </Col>

          <Col md={12} lg={6} span={24}>
            <Form.Item
              {...restField}
              label={<span className="text-sm font-semibold text-gray-700">Topic</span>}
              name={[name, "topic"]}
              required
              rules={[
                {
                  required: true,
                  message: "Please add a topic",
                },
              ]}
              className="!mb-0"
            >
              <FormReactSelect
                options={topicOptions}
                placeholder="Select Topic"
                onSelectionChange={(value) => {
                  isUserChange.current = true;
                  setSelectedTopic(value);
                }}
                styles={customSelectStyles}
                components={{ DropdownIndicator }}
                classNamePrefix="react-select"
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              />
            </Form.Item>
          </Col>

          <Col md={12} lg={6} span={24}>
            <Form.Item
              {...restField}
              label={<span className="text-sm font-semibold text-gray-700">Sub Topic</span>}
              name={[name, "sub_topic"]}
              required
              rules={[
                {
                  required: true,
                  message: "Please select a sub topic",
                },
              ]}
              className="!mb-0"
            >
              <FormReactSelect
                options={subTopicOptions}
                placeholder="Select Sub Topic"
                onSelectionChange={(value) => {
                  isUserChange.current = true;
                  setSelectedSubTopic(value);
                }}
                styles={customSelectStyles}
                components={{ DropdownIndicator }}
                classNamePrefix="react-select"
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          <Col md={12} lg={6} span={24}>
            <Form.Item
              label={<span className="text-sm font-semibold text-gray-700">Test Type</span>}
              name={[name, "test_type"]}
              required
              rules={[
                {
                  required: true,
                  message: "Please select a test type",
                },
              ]}
              className="!mb-0"
            >
              <FormReactSelect
                placeholder="Select Test Type"
                options={testTypeOptions}
                styles={customSelectStyles}
                components={{ DropdownIndicator }}
                classNamePrefix="react-select"
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              />
            </Form.Item>
          </Col>
          <Col md={12} lg={6} span={24}>
            <Form.Item
              label={<span className="text-sm font-semibold text-gray-700">Difficulty</span>}
              name={[name, "difficulty"]}
              wrapperCol={{ span: 24 }}
              required
              rules={[
                {
                  required: true,
                  message: "Please select a difficulty level",
                },
              ]}
              className="!mb-0"
            >
              <FormReactSelect
                placeholder="Select Difficulty"
                options={difficultyOptions}
                styles={customSelectStyles}
                components={{ DropdownIndicator }}
                classNamePrefix="react-select"
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              />
            </Form.Item>
          </Col>
          <Col md={12} lg={6} span={24}>
            <Form.Item
              label={
                <span className="text-sm font-semibold text-gray-700">Show Calculator</span>
              }
              name={[name, "show_calculator"]}
              initialValue={false}
              wrapperCol={{ span: 24 }}
              required
              rules={[
                {
                  required: true,
                  message: "Please select show calculator option",
                },
              ]}
              className="!mb-0"
            >
              <Radio.Group>
                <Radio value={true}>Yes</Radio>
                <Radio value={false}>No</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col md={12} lg={6} span={24}>
            <Form.Item
              label={
                <span className="text-sm font-semibold text-gray-700">Status</span>
              }
              name={[name, "is_active"]}
              initialValue={false}
              wrapperCol={{ span: 24 }}
              required
              rules={[
                {
                  required: true,
                  message: "Please select status",
                },
              ]}
              className="!mb-0"
            >
              <Radio.Group>
                <Radio value={true}>Active</Radio>
                <Radio value={false}>Inactive</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default QuestionMetaDataCard;
