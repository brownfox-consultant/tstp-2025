import { CloseOutlined } from "@ant-design/icons";
import { Col, Divider, Form, Row, Select } from "antd";
import React, { useEffect, useState } from "react";
import CustomSelect from "./CustomSelect";
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

  const [form] = useForm();

  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  const [selectedCourseSubject, setSelectedCourseSubject] = useState();
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [topicOptions, setTopicOptions] = useState([]);
  const [subTopicOptions, setSubTopicOptions] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState([]);
  const [selectedSubTopic, setSelectedSubTopic] = useState(null);

  const router = useRouter();

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
    if (selectedCourseSubject) {
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

  return (
    <div>
      <div key={key} className="flex justify-between">
        <div className="text-base font-semibold mb-4">
          Details for Course {index + 1}
        </div>

        {fields.length > 1 ? (
          <CloseOutlined
            className="dynamic-delete-button"
            onClick={() => remove(name)}
          />
        ) : null}
      </div>
      <Divider className="my-2" />
      <Row key={key} gutter={[8, 8]} justify="space-between">
        <Col md={4} span={24} lg={5}>
          <Form.Item
            {...restField}
            label={<div className="text-base font-semibold">Course</div>}
            name={[name, "course"]}
            required
            rules={[
              {
                required: true,
                message: "Please select a course",
              },
            ]}
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

        <Col md={5} span={24} lg={5}>
          <Form.Item
            {...restField}
            label={<div className="text-base font-semibold">Subject</div>}
            name={[name, "course_subject"]}
            required
            rules={[
              {
                required: true,
                message: "Please select a subject",
              },
            ]}
          >
            <Select
              value={selectedCourseSubject}
              placeholder="Select Subject"
              options={subjectOptions}
              onChange={setSelectedCourseSubject}
            ></Select>
          </Form.Item>
        </Col>

        <Col md={7} span={24} lg={5}>
          <Form.Item
            {...restField}
            label={<div className="text-base font-semibold">Topic</div>}
            name={[name, "topic"]}
            required
            rules={[
              {
                required: true,
                message: "Please add a topic",
              },
            ]}
          >
            <CustomSelect
              fieldName="Topic"
              options={topicOptions}
              value={selectedTopic}
              onChange={(value) => {
                setSelectedTopic(value);
                setSubTopicOptions(
                  topicOptions.find((topicOption) => topicOption.name == value)
                    ?.subtopics
                );
              }}
            />
          </Form.Item>
        </Col>

        <Col span={24} md={7} lg={5}>
          <Form.Item
            {...restField}
            label={<div className="text-base font-semibold">Sub Topic</div>}
            name={[name, "sub_topic"]}
          >
            <CustomSelect
              fieldName="Sub Topic"
              options={subTopicOptions}
              value={selectedSubTopic}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[54, 16]}>
        <Col md={6} span={24}>
          <Form.Item
            label={<div className="text-base font-semibold">Test Type</div>}
            name={[name, "test_type"]}
            required
            rules={[
              {
                required: true,
                message: "Please select a test type",
              },
            ]}
          >
            <Select
              placeholder="Select Test Type"
              options={testTypeOptions}
            ></Select>
          </Form.Item>
        </Col>
        <Col md={6} span={24}>
          <Form.Item
            label={<div className="text-base font-semibold">Difficulty</div>}
            name={[name, "difficulty"]}
            wrapperCol={{ span: 24 }}
            required
            rules={[
              {
                required: true,
                message: "Please select a difficulty level",
              },
            ]}
          >
            <Select
              placeholder="Select Difficulty"
              options={difficultyOptions}
            ></Select>
          </Form.Item>
        </Col>
        <Col md={6} span={24}>
          <Form.Item
            label={
              <div className="text-base font-semibold">Show Calculator</div>
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
          >
            <Select
              placeholder="Show Calculator"
              options={showCalculatorOptions}
            ></Select>
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}

export default QuestionMetaDataCard;
