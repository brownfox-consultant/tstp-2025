"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Empty, notification, Select, Spin, Tag } from "antd";
import { CheckCircleOutlined, PlusOutlined, RobotOutlined, SearchOutlined } from "@ant-design/icons";
import axios from "axios";
import { getSubjectTopics } from "@/app/services/authService";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import { BASE_URL } from "@/app/constants/apiConstants";

const option = (value, label = value) => ({ value, label });

export default function AiGeneratedQuestions() {
  const [filters, setFilters] = useState({});
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [questionConstants, setQuestionConstants] = useState({});
  const [loadingConstants, setLoadingConstants] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [addingQuestions, setAddingQuestions] = useState({});
  const [addResults, setAddResults] = useState({});

  useEffect(() => {
    getCoursesInsideAuth()
      .then((response) => setCourses(response?.data || []))
      .catch(() => setGenerationError("Could not load courses. Please try again."))
      .finally(() => setLoadingCourses(false));
  }, []);

  useEffect(() => {
    axios.get(`${BASE_URL}/api/course/constants/`, { withCredentials: true })
      .then((response) => setQuestionConstants(response?.data || {}))
      .catch(() => setGenerationError("Could not load question filter options. Please try again."))
      .finally(() => setLoadingConstants(false));
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) {
      setTopics([]);
      return;
    }
    let cancelled = false;
    setLoadingTopics(true);
    getSubjectTopics(selectedSubjectId)
      .then((response) => {
        if (!cancelled) setTopics(response?.data || []);
      })
      .catch(() => {
        if (!cancelled) setGenerationError("Could not load topics for this subject.");
      })
      .finally(() => {
        if (!cancelled) setLoadingTopics(false);
      });
    return () => { cancelled = true; };
  }, [selectedSubjectId]);

  const update = (field, value) => {
    const resetAfter = {
      course: ["subject", "topic", "sub_topic"],
      subject: ["topic", "sub_topic"],
      topic: ["sub_topic"],
      question_type: ["question_subtype"],
    };
    if (field === "course") {
      setSelectedSubjectId(null);
      setTopics([]);
    }
    if (field === "subject") {
      const selectedCourse = courses.find((course) => course.name === filters.course);
      const subject = selectedCourse?.subjects?.find((item) => item.name === value);
      setSelectedSubjectId(subject?.course_subject_id || null);
      setTopics([]);
    }
    setFilters((current) => {
      const next = { ...current, [field]: value };
      (resetAfter[field] || []).forEach((dependent) => delete next[dependent]);
      return next;
    });
    setGeneratedQuestions([]);
    setAddResults({});
  };

  const selectedCourse = courses.find((course) => course.name === filters.course);
  const subjectOptions = (selectedCourse?.subjects || []).map((subject) => option(subject.name));
  const topicOptions = topics.map((topic) => option(topic.name));
  const selectedTopic = topics.find((topic) => topic.name === filters.topic);
  const subtopics = selectedTopic?.subtopics || [];
  const subTopicOptions = subtopics.map((subtopic) => option(typeof subtopic === "object" ? subtopic.name : subtopic));

  const questionTypeOptions = (questionConstants.questionTypeList || []).map((value) => option(value));
  const subtypeByType = {
    MCQ: ["SINGLE_CHOICE", "MULTI_CHOICE", "READING_COMPREHENSION", "FILL_IN_BLANKS"],
    GRIDIN: ["SINGLE_ANSWER", "MULTI_ANSWER", "RANGE_BASED_ANSWER"],
  };
  const questionSubtypeOptions = (questionConstants.questionSubtypeList || []).filter((item) =>
    !filters.question_type || subtypeByType[filters.question_type]?.includes(item.value)
  );
  const fields = [
    { key: "course", label: "Course", options: courses.map((course) => option(course.name)) },
    { key: "subject", label: "Subject", options: subjectOptions, dependsOn: "course" },
    { key: "topic", label: "Topic", options: topicOptions, dependsOn: "subject" },
    { key: "sub_topic", label: "Sub Topic", options: subTopicOptions, dependsOn: "topic" },
    { key: "test_type", label: "Test Type", options: (questionConstants.testTypeList || []).map((value) => option(value, value === "SELF_PRACTICE_TEST" ? "Practice Questions" : value === "FULL_LENGTH_TEST" ? "Full Length Test" : value)) },
    { key: "difficulty", label: "Difficulty", options: (questionConstants.difficultyList || []).map((value) => option(value, ({ VERY_EASY: "Very Easy", EASY: "Easy", MODERATE: "Moderate", HARD: "Hard", VERY_HARD: "Very Hard" })[value] || value)) },
    { key: "question_type", label: "Question Type", options: questionTypeOptions },
    { key: "question_subtype", label: "Sub Question Type", options: questionSubtypeOptions, dependsOn: "question_type" },
    { key: "show_calculator", label: "Show Calculator", options: (questionConstants.showCalculatorList || []).map((item) => option(item.value, item.label)) },
    { key: "is_active", label: "Status", options: (questionConstants.statusList || []).map((item) => option(item.value, item.label)) },
  ];

  const generateQuestions = async () => {
    if (!selectedSubjectId || !filters.topic) {
      setGenerationError("Select a course, subject, and topic before generating questions.");
      return;
    }
    setGenerating(true);
    setGenerationError("");
    setGeneratedQuestions([]);
    setAddResults({});
    try {
      const response = await axios.post(`${BASE_URL}/api/question/generate-ai/`, {
        course_subject_id: selectedSubjectId,
        topic: filters.topic,
        sub_topic: filters.sub_topic || "",
        count: numberOfQuestions,
        filters: {
          test_type: filters.test_type,
          difficulty: filters.difficulty,
          question_type: filters.question_type,
          question_subtype: filters.question_subtype,
          show_calculator: filters.show_calculator,
        },
      }, {
        withCredentials: true,
        headers: { "X-CSRFToken": window.localStorage.getItem("csrfToken") },
      });
      setGeneratedQuestions((response.data?.questions || []).map((question, index) => ({
        ...question,
        id: `${Date.now()}-${index}`,
      })));
    } catch (error) {
      setGenerationError(error?.response?.data?.detail || "Could not generate questions. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const addQuestionToBank = async (item) => {
    if (!selectedSubjectId || !filters.topic) {
      notification.warning({ message: "Select a course, subject, and topic first" });
      return;
    }
    let options;
    if (item.question_type === "MCQ" && item.question_subtype === "FILL_IN_BLANKS") {
      options = item.correct_answers;
    } else if (item.question_type === "MCQ") {
      options = item.options.map((description) => ({
        description,
        is_correct: item.correct_answers.includes(description),
      }));
    } else if (item.question_subtype === "RANGE_BASED_ANSWER") {
      options = [{ gte: item.range_min, lte: item.range_max }];
    } else {
      options = item.correct_answers;
    }

    const payload = {
      description: item.question,
      options,
      question_type: item.question_type,
      question_subtype: item.question_subtype,
      reading_comprehension_passage: item.passage || null,
      explanation: item.explanation || "",
      questions_data: [{
        course_subject: selectedSubjectId,
        topic: filters.topic,
        sub_topic: filters.sub_topic || null,
        difficulty: filters.difficulty || "MODERATE",
        test_type: filters.test_type || "SELF_PRACTICE_TEST",
        is_active: filters.is_active ?? true,
        show_calculator: filters.show_calculator ?? false,
      }],
    };

    setAddingQuestions((current) => ({ ...current, [item.id]: true }));
    setAddResults((current) => ({ ...current, [item.id]: null }));
    try {
      await axios.post(`${BASE_URL}/api/question/create-multiple/`, payload, {
        withCredentials: true,
        headers: { "X-CSRFToken": window.localStorage.getItem("csrfToken") },
      });
      setAddResults((current) => ({ ...current, [item.id]: { type: "success", text: "Added to your question bank." } }));
    } catch (error) {
      const duplicate = error?.response?.data?.duplicate_question;
      const result = duplicate
        ? { type: "duplicate", text: `Duplicate: already in the bank (Question #${duplicate.srno ?? duplicate.id}).` }
        : { type: "error", text: error?.response?.data?.detail || "Could not add this question. Please try again." };
      setAddResults((current) => ({ ...current, [item.id]: result }));
    } finally {
      setAddingQuestions((current) => ({ ...current, [item.id]: false }));
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">AI-generated questions</h1>
        <p className="mt-2 text-gray-600">Set the subject and question criteria, then generate a batch of original questions for review.</p>
      </header>

      <Card className="rounded-xl shadow-sm" title={<span className="font-semibold">Question filters</span>}>
        {(loadingCourses || loadingConstants) && <div className="mb-4"><Spin size="small" /> <span className="ml-2 text-gray-500">Loading question filters…</span></div>}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(({ key, label, options, dependsOn }) => (
            <label key={key} className="block text-sm font-medium text-gray-700">
              <span className="mb-2 block">{label}</span>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                className="w-full"
                placeholder={`Select ${label}`}
                value={filters[key]}
                options={options}
                disabled={loadingCourses || loadingConstants || loadingTopics || Boolean(dependsOn && !filters[dependsOn])}
                onChange={(value) => update(key, value)}
              />
            </label>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
            Number of questions
            <Select
              value={numberOfQuestions}
              options={[1, 5, 10, 15, 20, 25, 30].map((count) => option(count, String(count)))}
              onChange={setNumberOfQuestions}
              className="w-24"
            />
          </label>
          <Button type="primary" size="large" icon={<RobotOutlined />} loading={generating} onClick={generateQuestions}>
            Find Questions with AI
          </Button>
          <Button size="large" icon={<SearchOutlined />} onClick={() => {
            setFilters({});
            setSelectedSubjectId(null);
            setTopics([]);
            setGeneratedQuestions([]);
            setGenerationError("");
            setAddResults({});
          }}>
            Clear filters
          </Button>
        </div>
        {generationError && <Alert className="mt-5" type="error" showIcon message={generationError} />}
      </Card>

      {generating && <div className="py-6 text-center"><Spin size="large" /><p className="mt-3 text-gray-600">Generating questions…</p></div>}
      {!generating && generatedQuestions.length > 0 && (
        <section aria-live="polite">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Generated questions ({generatedQuestions.length})</h2>
          <div className="space-y-4">
            {generatedQuestions.map((item) => {
              const addResult = addResults[item.id];
              return (
                <Card key={item.id} className="rounded-xl shadow-sm">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {[filters.course, filters.subject, filters.topic, filters.sub_topic, filters.difficulty, item.question_type, item.question_subtype].filter(Boolean).map((tag) => <Tag key={tag}>{tag}</Tag>)}
                  </div>
                  {item.passage && <div className="mb-3 rounded-lg bg-gray-50 p-4 text-gray-700">{item.passage}</div>}
                  <p className="font-medium text-gray-900">{item.question}</p>
                  {item.options?.length > 0 && (
                    <ol className="mt-3 grid list-[upper-alpha] grid-cols-1 gap-1 pl-6 text-gray-700 sm:grid-cols-2">
                      {item.options.map((answer, index) => <li key={`${answer}-${index}`}>{answer}</li>)}
                    </ol>
                  )}
                  <p className="mt-4 text-sm text-green-700"><strong>Answer:</strong> {item.correct_answers.join(", ") || `${item.range_min} to ${item.range_max}`}</p>
                  {item.explanation && <p className="mt-2 text-sm text-gray-600"><strong>Explanation:</strong> {item.explanation}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      type="primary"
                      icon={addResult?.type === "success" ? <CheckCircleOutlined /> : <PlusOutlined />}
                      loading={addingQuestions[item.id]}
                      disabled={addResult?.type === "success" || addResult?.type === "duplicate"}
                      onClick={() => addQuestionToBank(item)}
                    >
                      {addResult?.type === "success" ? "Added" : "Add to Question Bank"}
                    </Button>
                    {addResult && (
                      <span className={`text-sm ${addResult.type === "success" ? "text-green-700" : addResult.type === "duplicate" ? "text-amber-700" : "text-red-700"}`}>
                        {addResult.text}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}
      {!generating && generatedQuestions.length === 0 && !generationError && <Empty description="Choose your course, subject, and topic, then generate questions." />}
    </main>
  );
}
