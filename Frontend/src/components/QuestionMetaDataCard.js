import { CloseOutlined } from "@ant-design/icons";
import { Button, Form } from "antd";
import React, { useEffect, useState } from "react";
import CustomSelect from "./CustomSelect";
import FormSelect from "./FormSelect";
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

  const [form] = useForm();

  const [selectedCourse, setSelectedCourse] = useState(courses?.[0]?.name);
  const [selectedCourseSubject, setSelectedCourseSubject] = useState();
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [topicOptions, setTopicOptions] = useState([]);
  const [subTopicOptions, setSubTopicOptions] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState();
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
          }) || []
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
    <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6 transition-all duration-300 hover:shadow-xl">
      {/* Gradient Header */}
      <div className="relative bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">{index + 1}</span>
            </div>
            <h4 className="text-xl font-bold text-white drop-shadow-sm">
              Course Details
            </h4>
          </div>
          {fields.length > 1 && (
            <Button
              type="text"
              icon={<CloseOutlined className="text-white" />}
              onClick={() => remove(name)}
              className="hover:bg-white/20 transition-all duration-200 rounded-lg h-10 w-10 flex items-center justify-center border-0"
            />
          )}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
        {/* Primary Information Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h5 className="text-base font-semibold text-gray-700">Primary Information</h5>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            <Form.Item
              {...restField}
              label={<span className="text-sm font-semibold text-gray-700">Course</span>}
              name={[name, "course"]}
              required
              rules={[{ required: true, message: "Please select a course" }]}
              className="!mb-0"
            >
              <FormSelect
                onChange={(v) => setSelectedCourse(v)}
                value={selectedCourse}
                placeholder="Select Course"
                options={courses?.map((course) => ({
                  value: course.name,
                  label: course.name,
                }))}
                className="w-full custom-form-select"
              />
            </Form.Item>

            <Form.Item
              {...restField}
              label={<span className="text-sm font-semibold text-gray-700">Subject</span>}
              name={[name, "course_subject"]}
              required
              rules={[{ required: true, message: "Please select a subject" }]}
              className="!mb-0"
            >
              <FormSelect
                value={selectedCourseSubject}
                placeholder="Select Subject"
                options={subjectOptions}
                onChange={setSelectedCourseSubject}
                className="w-full custom-form-select"
              />
            </Form.Item>

            <Form.Item
              {...restField}
              label={<span className="text-sm font-semibold text-gray-700">Topic</span>}
              name={[name, "topic"]}
              required
              rules={[{ required: true, message: "Please add a topic" }]}
              className="!mb-0"
            >
              <CustomSelect
                fieldName="Topic"
                options={topicOptions}
                value={selectedTopic}
                onChange={(value) => {
                  setSelectedTopic(value);
                  setSubTopicOptions(
                    topicOptions.find((topicOption) => topicOption.name == value)?.subtopics
                  );
                }}
                className="w-full custom-form-select"
                hideAddButton={true}
              />
            </Form.Item>

            <Form.Item
              {...restField}
              label={<span className="text-sm font-semibold text-gray-700">Sub Topic</span>}
              name={[name, "sub_topic"]}
              className="!mb-0"
            >
              <CustomSelect
                fieldName="Sub Topic"
                options={subTopicOptions}
                value={selectedSubTopic}
                className="w-full custom-form-select"
                hideAddButton={true}
              />
            </Form.Item>
          </div>
        </div>

        {/* Test Configuration Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h5 className="text-base font-semibold text-gray-700">Test Configuration</h5>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Form.Item
              label={<span className="text-sm font-semibold text-gray-700">Test Type</span>}
              name={[name, "test_type"]}
              required
              rules={[{ required: true, message: "Please select a test type" }]}
              className="!mb-0"
            >
              <FormSelect
                placeholder="Select Test Type"
                options={testTypeOptions}
                className="w-full custom-form-select"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-semibold text-gray-700">Difficulty Level</span>}
              name={[name, "difficulty"]}
              required
              rules={[{ required: true, message: "Please select a difficulty level" }]}
              className="!mb-0"
            >
              <FormSelect
                placeholder="Select Difficulty"
                options={difficultyOptions}
                className="w-full custom-form-select"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-semibold text-gray-700">Calculator Access</span>}
              name={[name, "show_calculator"]}
              initialValue={false}
              required
              rules={[{ required: true, message: "Please select calculator option" }]}
              className="!mb-0"
            >
              <FormSelect
                placeholder="Show Calculator"
                options={showCalculatorOptions}
                className="w-full custom-form-select"
              />
            </Form.Item>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-form-select :global(.ant-select-selector),
        .custom-form-select :global(.ant-input),
        .custom-form-select :global(input) {
          height: 44px !important;
          border-radius: 8px !important;
          border: 1.5px solid #e5e7eb !important;
          transition: all 0.3s ease !important;
        }

        .custom-form-select :global(.ant-select-selector:hover),
        .custom-form-select :global(.ant-input:hover) {
          border-color: #f59405 !important;
          box-shadow: 0 0 0 2px rgba(245, 148, 5, 0.1) !important;
        }

        .custom-form-select :global(.ant-select-focused .ant-select-selector),
        .custom-form-select :global(.ant-input:focus) {
          border-color: #f59405 !important;
          box-shadow: 0 0 0 3px rgba(245, 148, 5, 0.15) !important;
        }

        .custom-form-select :global(.ant-select-selection-placeholder),
        .custom-form-select :global(.ant-input::placeholder) {
          color: #9ca3af !important;
        }
      `}</style>
    </div>
  );
}

export default QuestionMetaDataCard;
