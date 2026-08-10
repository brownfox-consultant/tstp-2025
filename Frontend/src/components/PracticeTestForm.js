"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { Button, Col, Divider, Form, Row, notification, Radio, Input } from "antd";
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
  getPracticeQuestionCount
} from "@/app/services/authService";

import { useGlobalContext } from "@/context/store";
import useFullScreen from "@/utils/useFullScreen";
import {
  SubjectSelectionIcon,
  TopicFilterIcon,
  TestParametersIcon,
  DropdownArrowIcon
} from "./icons/PracticeTestIcons";
import ReactSelect, { components } from "react-select";

// Custom Dropdown Indicator with rotating arrow
const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <DropdownArrowIcon isOpen={props.selectProps.menuIsOpen} />
    </components.DropdownIndicator>
  );
};

// Custom styles for react-select to match admin dashboard
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '48px',
    borderColor: state.isFocused ? '#F59405' : '#E5E7EB',
    boxShadow: state.isFocused ? '0 0 0 1px #F59405' : 'none',
    '&:hover': {
      borderColor: '#F59405',
    },
    borderRadius: '6px',
    backgroundColor: 'white',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected 
      ? '#F59405' 
      : state.isFocused 
      ? '#FFF5E6' 
      : 'white',
    color: state.isSelected ? 'white' : '#2E2725',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#F59405',
    },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#FFF5E6',
    borderRadius: '0.375rem',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#805830',
    fontWeight: '500',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#805830',
    '&:hover': {
      backgroundColor: '#F59405',
      color: 'white',
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    zIndex: 9999,
  }),
};

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
  const [availableCount, setAvailableCount] = useState(null);
  const [countLoading, setCountLoading] = useState(false);
  const [questionMode, setQuestionMode] = useState("BOTH");



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
      timer: values.timer,   // Minutes
    };

    startPractice(payload)
  .then(({ data }) => {

    const {
      practice_test_id,
      practice_test_result_id,
      remaining_time,
    } = data;

    // Save for refresh / continue
    window.sessionStorage.setItem(
      "practice_test_id",
      practice_test_id
    );

    window.sessionStorage.setItem(
      "practice_test_result_id",
      practice_test_result_id
    );

    window.sessionStorage.setItem(
      "practice_remaining_time",
      remaining_time
    );
        if (data.question_ids.length > 0) {
          dispatch(resetTestSlice());
          dispatch(fetchMultipleQuestionDetails(data.question_ids));
          dispatch(
  setTestDetails({
    testId: practice_test_id,
    time: timerInSeconds,
    testType: "practice",
  })
);

// Save timer too
window.sessionStorage.setItem(
  "timer",
  JSON.stringify(timerInSeconds)
);

window.sessionStorage.setItem(
  "testId",
  practice_test_id
);

router.push(`/student/${id}/practice/${practice_test_id}/info`);
          goFullScreen();
        } else {
          notification.info({
            message: "No questions for practice for given criteria",
          });
        }
        window.sessionStorage.setItem(
  "timer",
  JSON.stringify(remaining_time)
);

window.sessionStorage.setItem(
  "timeTaken",
  0
);
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

  useEffect(() => {
  const values = form.getFieldsValue([
    "course_subject",
    "topic",
    "sub_topic",
    "difficulty",
    "question_mode",
  ]);

  if (!values.course_subject) return;

  const payload = {
    course_subject_id: values.course_subject,
    topic: values.topic?.join(","),
    sub_topic: values.sub_topic?.join(","),
    difficulty: values.difficulty?.join(","),
    question_mode: values.question_mode || "BOTH",
  };

  setCountLoading(true);

  getPracticeQuestionCount(payload)
    .then(({ data }) => {
      setAvailableCount(data.total_available);
    })
    .catch(() => setAvailableCount(null))
    .finally(() => setCountLoading(false));
}, [
  selectedCourseSubject,
  selectedTopic,
  selectedSubTopic,
  selectedDifficulty,
  questionMode,
]);

useEffect(() => {
  form.setFieldValue("question_mode", "BOTH");
}, []);

useEffect(() => {
  if (availableCount === 0) {
    setIsSubmitDisabled(true);
  }
}, [availableCount]);



  return (
    <div>
      {/* Page Header */}
      <div className="max-w-7xl  mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="lg:text-2xl text-xl font-bold text-gray-900 mb-2">Create Custom Practice</h1>
            <p className="text-gray-600 hidden lg:block">Customize your practice test by selecting topics and difficulties</p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 h-10 px-4 border border-gray-300 rounded-cl hover:bg-gray-50"
          >
            <ArrowLeftOutlined className="text-sm" />
            Back
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <Form form={form} onFinish={handleSubmit} onFieldsChange={onFieldsChange}>
        <div className="max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Course Selection & Topic Filtering */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subject & Course Selection Card */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 flex items-center gap-3 rounded-t-xl bg-[#805B36]">
                <SubjectSelectionIcon />
                <h2 className="text-lg font-semibold text-white">Subject & Course Selection</h2>
              </div>
              <div className="p-6">
                <Row gutter={[16, 16]}>
                  <Col span={24} md={12}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                    <Form.Item name="course" className="!mb-0" rules={[{ required: true, message: 'Please select a course' }]}>
                      <div>
                        <ReactSelect
                          value={courses?.find((c) => c.name === selectedCourse) || null}
                          onChange={(opt) => {
                            setSelectedCourse(opt?.name);
                            setSelectedCourseSubject();
                            form.setFieldValue("course", opt?.name);
                          }}
                          options={courses}
                          getOptionLabel={(e) => e.name}
                          getOptionValue={(e) => e.name}
                          placeholder="Select Course"
                          components={{ DropdownIndicator }}
                          styles={customSelectStyles}
                          isClearable
                        />
                      </div>
                    </Form.Item>
                  </Col>
                  <Col span={24} md={12}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <Form.Item name="course_subject" className="!mb-0" rules={[{ required: true, message: 'Please select a subject' }]}>
                      <div>
                        <ReactSelect
                          value={subjectOptions?.find((s) => s.value === selectedCourseSubject) || null}
                          onChange={(opt) => {
                            setSelectedCourseSubject(opt?.value);
                            form.setFieldValue("course_subject", opt?.value);
                          }}
                          options={subjectOptions}
                          placeholder="Select Subject"
                          components={{ DropdownIndicator }}
                          styles={customSelectStyles}
                          isClearable
                        />
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </div>

            {/* Topic & Difficulty Filtering Card */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 flex items-center gap-3 rounded-t-xl bg-[#805B36]">
                <TopicFilterIcon />
                <h2 className="text-lg font-semibold text-white">Topic & Difficulty Filtering</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Select Topics */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Topics</label>
                  <Form.Item name="topic" className="!mb-0">
                    <div>
                      <ReactSelect
                        isMulti
                        closeMenuOnSelect={false}
                        hideSelectedOptions={false}
                        blurInputOnSelect={false}
                        value={topicOptions?.filter((opt) => selectedTopic?.includes(opt.value)) || []}
                        onChange={(selected) => {
                          // Check if "Select All" or "Unselect All" was clicked
                          const hasSelectAll = selected?.some(s => s.value === 'SELECT_ALL');
                          const hasUnselectAll = selected?.some(s => s.value === 'UNSELECT_ALL');
                          
                          if (hasSelectAll) {
                            // Select all topics
                            const allValues = topicOptions.filter(opt => opt.value !== 'SELECT_ALL').map(opt => opt.value);
                            setSelectedTopic(allValues);
                            setSubTopicOptions(getSubtopicOptionsFromValues(allValues));
                            form.setFieldValue("topic", allValues);
                          } else if (hasUnselectAll) {
                            // Unselect all topics
                            setSelectedTopic(null);
                            setSubTopicOptions([]);
                            form.setFieldValue("topic", []);
                          } else {
                            const values = selected ? selected.map((s) => s.value) : [];
                            setSelectedTopic(values.length === 0 ? null : values);
                            setSubTopicOptions(getSubtopicOptionsFromValues(values));
                            form.setFieldValue("topic", values);
                          }
                        }}
                        options={[
                          // Show "Unselect All" if all are selected, otherwise "Select All"
                          selectedTopic?.length === topicOptions?.length
                            ? { value: 'UNSELECT_ALL', label: '✗ Unselect All Topics' }
                            : { value: 'SELECT_ALL', label: '✓ Select All Topics', name: 'Select All' },
                          ...topicOptions
                        ]}
                        placeholder="Select topics..."
                        components={{ DropdownIndicator }}
                        styles={customSelectStyles}
                        isClearable
                      />
                    </div>
                  </Form.Item>
                </div>

                {/* Sub-Topics and Difficulty */}
                <Row gutter={[16, 16]}>
                  <Col span={24} md={12}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Sub-Topics</label>
                    <Form.Item name="sub_topic" className="!mb-0">
                      <div>
                        <ReactSelect
                          isMulti
                          closeMenuOnSelect={false}
                          hideSelectedOptions={false}
                          blurInputOnSelect={false}
                          value={subTopicOptions?.filter((opt) => selectedSubTopic?.includes(opt.id)).map(({ id, name }) => ({ label: name, value: id })) || []}
                          onChange={(selected) => {
                            // Check if "Select All" or "Unselect All" was clicked
                            const hasSelectAll = selected?.some(s => s.value === 'SELECT_ALL');
                            const hasUnselectAll = selected?.some(s => s.value === 'UNSELECT_ALL');
                            
                            if (hasSelectAll) {
                              // Select all sub-topics
                              const allValues = subTopicOptions.map(opt => opt.id);
                              setSelectedSubTopic(allValues);
                              form.setFieldValue("sub_topic", allValues);
                            } else if (hasUnselectAll) {
                              // Unselect all sub-topics
                              setSelectedSubTopic([]);
                              form.setFieldValue("sub_topic", []);
                            } else {
                              const values = selected ? selected.map((s) => s.value) : [];
                              setSelectedSubTopic(values);
                              form.setFieldValue("sub_topic", values);
                            }
                          }}
                          options={[
                            // Show "Unselect All" if all are selected, otherwise "Select All"
                            selectedSubTopic?.length === subTopicOptions?.length && subTopicOptions?.length > 0
                              ? { value: 'UNSELECT_ALL', label: '✗ Unselect All Sub-Topics' }
                              : { value: 'SELECT_ALL', label: '✓ Select All Sub-Topics' },
                            ...subTopicOptions?.map(({ id, name }) => ({ label: name, value: id }))
                          ]}
                          placeholder="Choose sub-topics..."
                          components={{ DropdownIndicator }}
                          styles={customSelectStyles}
                          isClearable
                        />
                      </div>
                    </Form.Item>
                  </Col>
                  <Col span={24} md={12}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                    <Form.Item name="difficulty" className="!mb-0">
                      <div>
                        <ReactSelect
                          isMulti
                          closeMenuOnSelect={false}
                          hideSelectedOptions={false}
                          blurInputOnSelect={false}
                          value={difficultyOptions?.filter((opt) => selectedDifficulty?.includes(opt.value)) || []}
                          onChange={(selected) => {
                            // Check if "Select All" or "Unselect All" was clicked
                            const hasSelectAll = selected?.some(s => s.value === 'SELECT_ALL');
                            const hasUnselectAll = selected?.some(s => s.value === 'UNSELECT_ALL');
                            
                            if (hasSelectAll) {
                              // Select all difficulty levels
                              const allValues = difficultyOptions.map(opt => opt.value);
                              setSelectedDifficulty(allValues);
                              form.setFieldValue("difficulty", allValues);
                            } else if (hasUnselectAll) {
                              // Unselect all difficulty levels
                              setSelectedDifficulty([]);
                              form.setFieldValue("difficulty", []);
                            } else {
                              const values = selected ? selected.map((s) => s.value) : [];
                              setSelectedDifficulty(values);
                              form.setFieldValue("difficulty", values);
                            }
                          }}
                          options={[
                            // Show "Unselect All" if all are selected, otherwise "Select All"
                            selectedDifficulty?.length === difficultyOptions?.length
                              ? { value: 'UNSELECT_ALL', label: '✗ Unselect All Difficulty Levels' }
                              : { value: 'SELECT_ALL', label: '✓ Select All Difficulty Levels' },
                            ...difficultyOptions
                          ]}
                          placeholder="Choose difficulty..."
                          components={{ DropdownIndicator }}
                          styles={customSelectStyles}
                          isClearable
                        />
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </div>
          </div>

          {/* Right Column - Test Parameters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm sticky top-6">
              <div className="px-6 py-4 flex items-center gap-3 rounded-t-xl" style={{ backgroundColor: '#F59405' }}>
                <TestParametersIcon />
                <h2 className="text-lg font-semibold text-white">Test Parameters</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Question Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <span className="text-red-500">*</span> Question Mode
                  </label>
                  <Form.Item
  name="question_mode"
  rules={[{ required: true, message: "Please select a question mode" }]}
  className="!mb-0"
>
                    <Radio.Group className="w-full space-y-3"
                    onChange={(e) => setQuestionMode(e.target.value)}
                    >
                      
                      <div className="border border-gray-200 rounded-lg p-4 transition-all cursor-pointer" style={{ '--hover-border': '#F59405', '--hover-bg': '#FFF5E6' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F59405'; e.currentTarget.style.backgroundColor = '#FFF5E6'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        <Radio value="INCORRECT" className="w-full">
                          <div>
                            <div className="font-medium text-gray-900">Incorrect Only</div>
                            <div className="text-sm text-gray-500">Re-attempt incorrectly answered questions</div>
                          </div>
                        </Radio>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4 transition-all cursor-pointer" onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F59405'; e.currentTarget.style.backgroundColor = '#FFF5E6'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        <Radio value="UNANSWERED" className="w-full">
                          <div>
                            <div className="font-medium text-gray-900">Unanswered Only</div>
                            <div className="text-sm text-gray-500">Questions you haven't attempted yet</div>
                          </div>
                        </Radio>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4 transition-all cursor-pointer" onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F59405'; e.currentTarget.style.backgroundColor = '#FFF5E6'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        <Radio value="BOTH" className="w-full">
                          <div>
                            <div className="font-medium text-gray-900">Answered + Unanswered</div>
                            <div className="text-sm text-gray-500">Mix of Answered and Unanswered questions</div>
                          </div>
                        </Radio>
                      </div>
                    </Radio.Group>
                  </Form.Item>
                </div>

                {availableCount !== null && (
  <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
    📊 <strong>{availableCount}</strong> questions available for selected criteria
  </div>
)}


                {/* Number of Questions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-red-500">*</span> Number of Questions
                  </label>
                  <Form.Item
                    name="no_of_questions"
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
                    className="!mb-0"
                  >
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      placeholder="e.g. 20"
                      prefix={<span className="text-gray-400">📝</span>}
                      className="w-full h-12"
                      size="large"
                    />
                  </Form.Item>
                </div>

                {/* Timer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-red-500">*</span> Timer (Minutes)
                  </label>
                  <Form.Item
                    name="timer"
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
                    className="!mb-0"
                  >
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      placeholder="e.g. 30"
                      prefix={<span className="text-gray-400">⏱️</span>}
                      className="w-full h-12"
                      size="large"
                    />
                  </Form.Item>
                </div>

                {/* Submit Button */}
                <Form.Item className="!mb-0 !mt-8">
                  <Button
                    loading={practiceLoading}
                    disabled={isSubmitDisabled}
                    type="primary"
                    htmlType="submit"
                    className="w-full h-12 text-base font-semibold border-none rounded-lg shadow-md hover:shadow-lg transition-all"
                    style={{ backgroundColor: '#F59405' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E08804'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F59405'}
                    size="large"
                  >
                    {practiceLoading ? "Starting Practice..." : "Start Practice Test"}
                  </Button>
                </Form.Item>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}

export default PracticeTestForm;