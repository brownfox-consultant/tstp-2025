"use client";

import { LeftOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { Button, Col, Divider, Form, Row, Select, notification,Radio,Input } from "antd";
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

function PracticeTestForm() {
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
      // form.setFieldValue("topic", []);
      // form.setFieldValue("sub_topic", []);
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
    <div>
      <div className="text-xl font-semibold mb-5 flex align-middle">
        <LeftOutlined
          onClick={() => window.location.reload()}
          className="mr-2 text-base hover:font-extrabold"
        />{" "}
        Practice Questions
      </div>
      <Form form={form} onFinish={handleSubmit} onFieldsChange={onFieldsChange}>
        <Row gutter={[16, 8]} className="px-5">
          <Col span={24} md={8} lg={8}>
            <Form.Item
              labelAlign="left"
              wrapperCol={{ lg: 16 }}
              labelCol={{ span: 8, lg: 5 }}
              label="Course"
              name="course"
              required
            >
              <Select
                onChange={(v) => {
                  setSelectedCourse(v);
                  setSelectedCourseSubject();
                }}
                value={selectedCourse}
                placeholder="Select Course"
                options={courses?.map((course) => {
                  return { value: course.name, label: course.name };
                })}
              ></Select>
            </Form.Item>
          </Col>
          <Col span={24} md={8} lg={8}>
            <Form.Item
              labelAlign="left"
              wrapperCol={{ lg: 16 }}
              dependencies={["course"]}
              label="Subject"
              name="course_subject"
              required
            >
              <Select
                value={selectedCourseSubject}
                onChange={setSelectedCourseSubject}
                placeholder="Select Subject"
                options={subjectOptions}
              ></Select>
            </Form.Item>
          </Col>
          {/* <Col span={24} md={12} lg={8}>
            <Form.Item
              labelAlign="left"
              labelCol={{ span: 8, lg: 7 }}
              wrapperCol={{ lg: 16 }}
              label="Practice Type"
              name="practice_type"
              required
            >
              <Select
                value={selectedPractice}
                onChange={(val) => setSelectedPractice(val)}
                placeholder="Select Practice Type"
                //   options={subjectOptions}
              >
                <Option value="GUIDED">Guided</Option>
                <Option value="CUSTOM">Custom</Option>
              </Select>
            </Form.Item>
          </Col> */}
        </Row>

     <Row className="p-5" gutter={[16, 8]} justify="start">
  <div className="text-base font-semibold">Criteria</div>
  <Divider style={{ margin: "5px 2px" }} />

  {/* Topic */}
  <Col span={24} md={12} lg={12}>
    <Form.Item
      name="topic"
      label="Topic"
      labelAlign="left"
      labelCol={{ span: 6, lg: 4 }}
      wrapperCol={{ span: 14 }}
    >
      <Select
        mode="multiple"
        placeholder="Select Topic"
        options={topicOptions}
        value={selectedTopic}
        onChange={(values) => {
          setSelectedTopic(values.length === 0 ? null : values);
          setSubTopicOptions(getSubtopicOptionsFromValues(values));
        }}
      />
    </Form.Item>
  </Col>

  {/* Sub Topic */}
  <Col span={24} md={12} lg={12}>
    <Form.Item
      name="sub_topic"
      label="Sub Topic"
      labelCol={{ span: 6, lg: 4 }}
      wrapperCol={{ span: 14 }}
      labelAlign="left"
    >
      <Select
        mode="multiple"
        placeholder="Select Sub Topic"
        options={subTopicOptions?.map(({ id, name }) => ({
          label: name,
          value: id,
        }))}
        value={selectedSubTopic}
        onChange={setSelectedSubTopic}
      />
    </Form.Item>
  </Col>

  {/* Difficulty */}
  <Col span={24} md={12} lg={12}>
    <Form.Item
      name="difficulty"
      label="Difficulty"
      labelCol={{ span: 6, lg: 4 }}
      wrapperCol={{ span: 14 }}
      labelAlign="left"
    >
      <Select
        mode="multiple"
        placeholder="Select Difficulty"
        options={difficultyOptions}
        value={selectedDifficulty}
        onChange={setSelectedDifficulty}
      />
    </Form.Item>
  </Col>

  {/* Question Mode (✅ aligned properly now) */}
{/* Question Mode */}
<Col span={24} md={12} lg={12}>
  <Form.Item
    name="question_mode"
    label="Que. Mode"
    labelCol={{ span: 6, lg: 4 }}
    wrapperCol={{ span: 14 }}
    labelAlign="left"
    rules={[{ required: true, message: "Please select a question mode" }]}
  >
    <Radio.Group>
      <Radio value="INCORRECT">Answered Incorrectly</Radio>
      <Radio value="UNANSWERED">Unanswered</Radio>
      <Radio value="BOTH">Answered + Unanswered</Radio>
    </Radio.Group>
  </Form.Item>
</Col>

{/* Number of Questions */}
<Col span={24} md={12} lg={12}>
  <Form.Item
    name="no_of_questions"
    label="No. of Que."
    labelCol={{ span: 6, lg: 4 }}
    wrapperCol={{ span: 14 }}
    labelAlign="left"
    rules={[
      { required: true, message: "Enter number of questions" },
      {
        validator(_, value) {
          if (!value || (value > 0 && value <= 90)) {
            return Promise.resolve();
          }
          return Promise.reject(new Error("Enter between 1 and 90 questions"));
        },
      },
    ]}
  >
    <Input
      type="number"
      min={1}
      max={90}
      placeholder="Enter number of questions"
      style={{ width: 180 }}
    />
  </Form.Item>
</Col>

  {/* Timer */}
  <Col span={24} md={12} lg={12}>
  <Form.Item
    name="timer"
    label="Timer (mins)"
    labelCol={{ span: 6, lg: 4 }}
    wrapperCol={{ span: 14 }}
    labelAlign="left"
    rules={[
      { required: true, message: "Enter timer in minutes" },
      {
        validator(_, value) {
          if (!value || (value > 0 && value <= 90)) {
            return Promise.resolve();
          }
          return Promise.reject(new Error("Enter between 1 and 90 minutes"));
        },
      },
    ]}
  >
    <Input
      type="number"
      min={1}
      max={90}
      placeholder="Enter time in minutes"
      style={{ width: 180 }}
    />
  </Form.Item>
</Col>

  {/* Number of Questions (✅ aligned properly now) */}
  {/* Number of Questions */}


</Row>



        <Form.Item className="w-full flex justify-center">
          <Button
            loading={practiceLoading}
            disabled={isSubmitDisabled}
            type="primary"
            htmlType="submit"
          >
            Start Practice
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default PracticeTestForm;
