"use client";

import { LeftOutlined, BookOutlined, AppstoreOutlined, FilterOutlined, FieldTimeOutlined, ThunderboltOutlined, OrderedListOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { Button, Col, Divider, Form, Row, Select, notification, Radio, Input, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  fetchMultipleQuestionDetails,
  resetTestSlice,
  setTestDetails,
} from "@/lib/features/test/testSlice";
import { useEffect, useState } from "react";
import {
  getSubjectTopics,
  getUserDetails,
  startPractice,
} from "@/app/services/authService";

import { useGlobalContext } from "@/context/store";
import useFullScreen from "@/utils/useFullScreen";

const { Option } = Select;

function PracticeTestForm({ onBack }) {
  const router = useRouter();
  const [form] = useForm();
  const pathname = usePathname();
  const params = useParams();
  const { id } = params;
  const { courseDetails } = useGlobalContext();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [topicOptions, setTopicOptions] = useState([]);
  const [subTopicOptions, setSubTopicOptions] = useState([]);
  const [selectedCourseSubject, setSelectedCourseSubject] = useState();
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState();
  const [selectedDifficulty, setSelectedDifficulty] = useState();
  const [selectedSubTopic, setSelectedSubTopic] = useState();
  const [timer, setTimer] = useState(undefined);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [practiceLoading, setPracticeLoading] = useState(false);

  const { goFullScreen } = useFullScreen();
  const dispatch = useDispatch();

  const getSubtopicOptionsFromValues = (values) => {
    let temp = [];
    values.map((value) => {
      temp = [
        ...temp,
        ...topicOptions.find((topicOption) => value == topicOption.value)
          .subtopics,
      ];
    });
    return temp;
  };

  const timerOptions = [
    { value: 300, label: "5 Mins" },
    { value: 600, label: "10 Mins" },
    { value: 1800, label: "30 Mins" },
    { value: 3600, label: "1 hour" },
  ];

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

  const handleSubmit = (values) => {
    setPracticeLoading(true);

    const noOfQuestions = values.no_of_questions;
    const timerInSeconds = values.timer ? values.timer * 60 : null; // ✅ convert minutes → seconds

    let payload = {
      difficulty: values.difficulty?.join(","),
      sub_topic: values.sub_topic?.join(","),
      topic: values.topic?.join(","),
      course_subject_id: values.course_subject,
      no_of_questions: noOfQuestions,
      question_mode: values.question_mode,
    };

    startPractice(payload)
      .then(({ data }) => {
        const { practice_test_id } = data;
        if (data.question_ids.length > 0) {
          dispatch(resetTestSlice());
          dispatch(fetchMultipleQuestionDetails(data.question_ids));
          dispatch(
            setTestDetails({
              testId: practice_test_id,
              time: timerInSeconds, // ✅ store converted time
              testType: "practice",
            })
          );
          window.sessionStorage.setItem("testId", practice_test_id);
          router.push(`/student/${id}/practice/${practice_test_id}/info`);
          goFullScreen();
        } else {
          notification.info({
            message: "No questions for practice for given criteria",
          });
        }
        window.sessionStorage.setItem("timer", JSON.stringify(timerInSeconds));
        window.sessionStorage.setItem("timeTaken", 0);
      })
      .finally(() => setPracticeLoading(false));
  };


  useEffect(() => {
    getUserDetails(id)
      .then((res) => {
        setCourses(
          res.data.course_details.map(({ course }) => {
            return course;
          })
        );
      })
      .catch((err) => console.log(err));
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
    if (selectedCourseSubject) {
      getSubjectTopics(selectedCourseSubject).then((res) => {
        setTopicOptions(
          res.data.map((option) => {
            return { ...option, label: option.name, value: option.id };
          })
        );
      });

      setSelectedTopic([]);
      setSelectedSubTopic([]);
      setSelectedDifficulty([]);
      setTimer(null);
      form.setFieldsValue({
        topic: [],
        sub_topic: [],
        difficulty: [],
        timer: null,
      });
    }
  }, [selectedCourseSubject]);

  const onFieldsChange = (_, allFields) => {
    const isFormValid = allFields.slice(0, 3).every((field) => {
      if (!field.value || field.errors.length > 0) {
        return false;
      }
      return true;
    });
    const criteriaObject = form.getFieldsValue([
      "difficulty",
      "topic",
      "sub_topic",
    ]);
    const areSelectCriteriaValid = Object.values(criteriaObject).some(
      (value) => Array.isArray(value) && value.length > 0
    );
    const isTimerValid = !!form.getFieldValue("timer");
    const isCriteriaValid = areSelectCriteriaValid || isTimerValid;

    setIsSubmitDisabled(!isFormValid || !isCriteriaValid);
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto">
      {/* Global Style Override */}
      <style jsx global>{`
         .practice-form .ant-select-selector,
         .practice-form .ant-input,
         .practice-form .ant-input-number-input {
           height: 48px !important;
           min-height: 48px !important;
           border-radius: 8px !important;
           display: flex !important;
           align-items: center !important;
         }
         .practice-form .ant-select-selection-search-input {
           height: 46px !important;
         }
         .practice-form .ant-select-multiple .ant-select-selector {
           height: auto !important;
           min-height: 48px !important;
           padding-top: 4px !important;
           padding-bottom: 4px !important;
         }
         .practice-form .ant-radio-button-wrapper {
           height: 48px;
           line-height: 46px;
           font-weight: 500;
         }
       `}</style>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Create Custom Practice
          </h1>
          <p className="text-sm text-gray-500">
            Customize your practice test by selecting topics and difficulties
          </p>
        </div>
        <button
          onClick={onBack || (() => router.back())}
          className="px-5 py-3 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 shadow transition-all duration-300 hover:scale-105 cursor-pointer border-0 text-gray-700 font-medium"
        >
          <LeftOutlined className="mr-2" /> Back
        </button>
      </div>

      <div className=" mx-auto">
        <Form
          form={form}
          onFinish={handleSubmit}
          onFieldsChange={onFieldsChange}
          layout="vertical"
          className="practice-form space-y-6"
        >
          <Row gutter={[24, 24]}>
            {/* Left Column - Configuration */}
            <Col span={24} lg={16} className="space-y-6">
              
              {/* Basic Details Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#0071BC] text-white px-6 py-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BookOutlined />
                    Subject & Course Selection
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Course */}
                  <Form.Item
                    label={<span className="font-medium text-gray-700">Course</span>}
                    name="course"
                    rules={[{ required: true, message: 'Please select a course' }]}
                    className="mb-0"
                  >
                    <Select
                      onChange={(v) => {
                        setSelectedCourse(v);
                        setSelectedCourseSubject();
                      }}
                      value={selectedCourse}
                      placeholder="Select Course"
                      suffixIcon={<AppstoreOutlined className="text-gray-400" />}
                      className="w-full"
                      options={courses?.map((course) => ({ value: course.name, label: course.name }))}
                    />
                  </Form.Item>

                  {/* Subject */}
                  <Form.Item
                    label={<span className="font-medium text-gray-700">Subject</span>}
                    name="course_subject"
                    dependencies={["course"]}
                    rules={[{ required: true, message: 'Please select a subject' }]}
                    className="mb-0"
                  >
                    <Select
                      value={selectedCourseSubject}
                      onChange={setSelectedCourseSubject}
                      placeholder="Select Subject"
                      suffixIcon={<BookOutlined className="text-gray-400" />}
                      options={subjectOptions}
                    />
                  </Form.Item>
                </div>
              </div>

              {/* Filtering Criteria Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#805B30] text-white px-6 py-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FilterOutlined />
                    Topic & Difficulty Filtering
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 gap-6">
                  {/* Topic */}
                  <Form.Item
                    name="topic"
                    label={<span className="font-medium text-gray-700">Select Topics</span>}
                    className="mb-0"
                  >
                    <Select
                      mode="multiple"
                      placeholder="Choose one or more topics..."
                      options={topicOptions}
                      value={selectedTopic}
                      onChange={(values) => {
                        setSelectedTopic(values.length === 0 ? null : values);
                        setSubTopicOptions(getSubtopicOptionsFromValues(values));
                      }}
                      maxTagCount="responsive"
                    />
                  </Form.Item>

                  <Row gutter={[16, 16]}>
                    <Col span={24} md={12}>
                      <Form.Item
                        name="sub_topic"
                        label={<span className="font-medium text-gray-700">Select Sub-Topics</span>}
                        className="mb-0"
                      >
                        <Select
                          mode="multiple"
                          placeholder="Choose sub-topics..."
                          options={subTopicOptions?.map(({ id, name }) => ({
                            label: name,
                            value: id,
                          }))}
                          value={selectedSubTopic}
                          onChange={setSelectedSubTopic}
                          maxTagCount="responsive"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24} md={12}>
                      <Form.Item
                        name="difficulty"
                        label={<span className="font-medium text-gray-700">Difficulty Level</span>}
                        className="mb-0"
                      >
                        <Select
                          mode="multiple"
                          placeholder="Choose difficulty..."
                          options={difficultyOptions}
                          value={selectedDifficulty}
                          onChange={setSelectedDifficulty}
                          maxTagCount="responsive"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </div>

            </Col>

            {/* Right Column - Parameters */}
            <Col span={24} lg={8} className="space-y-6">
              
              {/* Test Parameters Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
                <div className="bg-[#F59403] text-white px-6 py-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ThunderboltOutlined />
                    Test Parameters
                  </h2>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  
                  {/* Question Mode */}
                  <Form.Item
                    name="question_mode"
                    label={<span className="font-medium text-gray-700">Question Mode</span>}
                    rules={[{ required: true, message: "Select question mode" }]}
                    className="mb-0"
                  >
                    <Radio.Group className="w-full flex flex-col gap-2">
                       <Radio value="INCORRECT" className="border border-gray-200 rounded-lg p-3 hover:border-blue-400 transition-colors">
                        <span className="font-medium">Incorrect Only</span>
                        <div className="text-xs text-gray-500 pl-6">Re-attempt incorrectly answered questions</div>
                       </Radio>
                       <Radio value="UNANSWERED" className="border border-gray-200 rounded-lg p-3 hover:border-blue-400 transition-colors">
                        <span className="font-medium">Unanswered Only</span>
                        <div className="text-xs text-gray-500 pl-6">Questions you haven't attempted yet</div>
                       </Radio>
                       <Radio value="BOTH" className="border border-gray-200 rounded-lg p-3 hover:border-blue-400 transition-colors">
                        <span className="font-medium">Both</span>
                        <div className="text-xs text-gray-500 pl-6">Mix of incorrect and unanswered questions</div>
                       </Radio>
                    </Radio.Group>
                  </Form.Item>

                   <Divider dashed className="my-2" />

                  {/* Question Count */}
                  <Form.Item
                    name="no_of_questions"
                    label={<span className="font-medium text-gray-700">Number of Questions</span>}
                    rules={[
                      { required: true, message: "Enter number of questions" },
                      {
                        validator(_, value) {
                          if (!value || (value > 0 && value <= 90)) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error("1 - 90 questions"));
                        },
                      },
                    ]}
                    className="mb-0"
                  >
                    <Input
                      type="number"
                      prefix={<OrderedListOutlined className="text-gray-400" />}
                      min={1}
                      max={90}
                      placeholder="e.g. 20"
                      className="w-full"
                    />
                  </Form.Item>

                  {/* Timer */}
                  <Form.Item
                    name="timer"
                    label={<span className="font-medium text-gray-700">Timer (Minutes)</span>}
                    rules={[
                      { required: true, message: "Enter timer duration" },
                      {
                        validator(_, value) {
                          if (!value || (value > 0 && value <= 90)) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error("1 - 90 minutes"));
                        },
                      },
                    ]}
                    className="mb-0"
                  >
                    <Input
                      type="number"
                      prefix={<FieldTimeOutlined className="text-gray-400" />}
                      min={1}
                      max={90}
                      placeholder="e.g. 30"
                      className="w-full"
                    />
                  </Form.Item>

                  {/* Action Button */}
                   <Button
                    loading={practiceLoading}
                    disabled={isSubmitDisabled}
                    type="primary"
                    htmlType="submit"
                    className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-lg mt-4"
                  >
                    Start Practice Test
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}

export default PracticeTestForm;
