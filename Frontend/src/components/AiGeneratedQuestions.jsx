"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Checkbox, Empty, Input, Select, Spin, Tag, notification } from "antd";
import { CheckCircleOutlined, PaperClipOutlined, PlusOutlined, RobotOutlined, SendOutlined } from "@ant-design/icons";
import axios from "axios";
import { getSubjectTopics } from "@/app/services/authService";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import { BASE_URL } from "@/app/constants/apiConstants";

const option = (value, label = value) => ({ value, label });

export default function AiGeneratedQuestions() {
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [course, setCourse] = useState();
  const [subject, setSubject] = useState();
  const [topic, setTopic] = useState();
  const [subjectId, setSubjectId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState([]);
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [verified, setVerified] = useState({});
  const [transferring, setTransferring] = useState({});
  const [transferred, setTransferred] = useState({});
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fileInput = useRef(null);

  useEffect(() => {
    getCoursesInsideAuth()
      .then((response) => setCourses(response?.data || []))
      .catch(() => setError("Could not load courses. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const selectedCourse = courses.find((item) => item.name === course);
  const subjectOptions = (selectedCourse?.subjects || []).map((item) => option(item.name));

  const selectCourse = (value) => {
    setCourse(value); setSubject(undefined); setTopic(undefined); setSubjectId(null); setTopics([]);
  };

  const selectSubject = (value) => {
    const selected = selectedCourse?.subjects?.find((item) => item.name === value);
    setSubject(value); setTopic(undefined); setSubjectId(selected?.course_subject_id || null); setTopics([]);
    if (selected?.course_subject_id) {
      getSubjectTopics(selected.course_subject_id)
        .then((response) => setTopics(response?.data || []))
        .catch(() => setError("Could not load topics for this subject."));
    }
  };

  const addFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selected.length) return;
    const unsupported = selected.find((file) => !/\.(txt|md|markdown)$/i.test(file.name));
    if (unsupported) {
      setError("Upload text or Markdown files (.txt, .md). Other file types are not supported yet.");
      return;
    }
    try {
      const contents = await Promise.all(selected.map(async (file) => ({
        name: file.name,
        text: await file.text(),
      })));
      setFiles((current) => [...current, ...contents]);
      setError("");
    } catch {
      setError("Could not read one of the selected files.");
    }
  };

  const generateQuestions = async (event) => {
    event.preventDefault();
    if (!subjectId || !topic) {
      setError("Choose a course, subject, and topic so questions can be transferred to the right place.");
      return;
    }
    if (!prompt.trim() && files.length === 0) {
      setError("Enter a prompt or attach a text file to get started.");
      return;
    }
    setGenerating(true); setError(""); setQuestions([]); setVerified({}); setTransferred({});
    try {
      const response = await axios.post(`${BASE_URL}/api/question/generate-ai/`, {
        course_subject_id: subjectId,
        topic,
        count,
        prompt: prompt.trim(),
        source_material: files.map((file) => `File: ${file.name}\n${file.text}`).join("\n\n"),
      }, {
        withCredentials: true,
        headers: { "X-CSRFToken": window.localStorage.getItem("csrfToken") },
      });
      setQuestions((response.data?.questions || []).map((question, index) => ({ ...question, id: `${Date.now()}-${index}` })));
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not generate questions. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const transferQuestion = async (item) => {
    if (!verified[item.id]) return;
    let options;
    if (item.question_type === "MCQ" && item.question_subtype === "FILL_IN_BLANKS") options = item.correct_answers;
    else if (item.question_type === "MCQ") options = (item.options || []).map((description) => ({ description, is_correct: item.correct_answers.includes(description) }));
    else if (item.question_subtype === "RANGE_BASED_ANSWER") options = [{ gte: item.range_min, lte: item.range_max }];
    else options = item.correct_answers;
    const payload = {
      description: item.question, options, question_type: item.question_type, question_subtype: item.question_subtype,
      reading_comprehension_passage: item.passage || null, explanation: item.explanation || "",
      questions_data: [{ course_subject: subjectId, topic, difficulty: "MODERATE", test_type: "SELF_PRACTICE_TEST", is_active: true, show_calculator: false }],
    };
    setTransferring((current) => ({ ...current, [item.id]: true }));
    try {
      await axios.post(`${BASE_URL}/api/question/create-multiple/`, payload, {
        withCredentials: true,
        headers: { "X-CSRFToken": window.localStorage.getItem("csrfToken") },
      });
      setTransferred((current) => ({ ...current, [item.id]: true }));
    } catch (err) {
      const duplicate = err?.response?.data?.duplicate_question;
      notification.error({ message: duplicate ? "This question is already in the question bank." : (err?.response?.data?.detail || "Could not transfer this question.") });
    } finally {
      setTransferring((current) => ({ ...current, [item.id]: false }));
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">AI question studio</h1>
        <p className="mt-2 text-gray-600">Describe what you need, review each draft, then choose which verified questions to add to your bank.</p>
      </header>

      <Card className="rounded-2xl shadow-sm">
        <form onSubmit={generateQuestions}>
          <Input.TextArea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe the questions you want… For example: Create 10 medium-difficulty questions about photosynthesis, focusing on the light-dependent reactions."
            autoSize={{ minRows: 4, maxRows: 8 }}
            maxLength={4000}
            showCount
            aria-label="Describe the questions to generate"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button icon={<PaperClipOutlined />} onClick={() => fileInput.current?.click()}>Upload text files</Button>
            <input ref={fileInput} type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" multiple className="hidden" onChange={addFiles} />
            {files.map((file, index) => (
              <Tag key={`${file.name}-${index}`} closable onClose={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}>{file.name}</Tag>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">Text and Markdown files are read to provide source material for generation.</p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Select showSearch optionFilterProp="label" placeholder="Course" value={course} options={courses.map((item) => option(item.name))} onChange={selectCourse} loading={loading} />
            <Select showSearch optionFilterProp="label" placeholder="Subject" value={subject} options={subjectOptions} onChange={selectSubject} disabled={!course} />
            <Select showSearch optionFilterProp="label" placeholder="Topic" value={topic} options={topics.map((item) => option(item.name))} onChange={setTopic} disabled={!subject} />
            <Select value={count} options={[1, 5, 10, 15, 20, 25, 30].map((value) => option(value, `${value} questions`))} onChange={setCount} />
          </div>
          <div className="mt-5 flex justify-end">
            <Button type="primary" htmlType="submit" size="large" icon={<SendOutlined />} loading={generating}>Generate questions</Button>
          </div>
        </form>
        {error && <Alert className="mt-4" type="error" showIcon message={error} />}
      </Card>

      {generating && <div className="py-8 text-center"><Spin size="large" /><p className="mt-3 text-gray-600">Creating draft questions…</p></div>}
      {!generating && questions.length > 0 && (
        <section aria-live="polite" className="space-y-4">
          <div><h2 className="text-xl font-semibold text-gray-900">Draft questions <Tag color="blue">{questions.length}</Tag></h2><p className="mt-1 text-sm text-gray-600">Check each question after reviewing it. Only checked questions can be transferred to the bank.</p></div>
          {questions.map((item, index) => (
            <Card key={item.id} className="rounded-xl shadow-sm">
              <div className="mb-3 flex items-center justify-between"><Tag>Question {index + 1}</Tag><Tag>{item.question_type} · {item.question_subtype}</Tag></div>
              {item.passage && <div className="mb-3 rounded-lg bg-gray-50 p-4 text-gray-700">{item.passage}</div>}
              <p className="font-medium text-gray-900">{item.question}</p>
              {item.options?.length > 0 && <ol className="mt-3 grid list-[upper-alpha] grid-cols-1 gap-1 pl-6 text-gray-700 sm:grid-cols-2">{item.options.map((answer, answerIndex) => <li key={`${answer}-${answerIndex}`}>{answer}</li>)}</ol>}
              <p className="mt-4 text-sm text-green-700"><strong>Answer:</strong> {item.correct_answers?.join(", ") || `${item.range_min} to ${item.range_max}`}</p>
              {item.explanation && <p className="mt-2 text-sm text-gray-600"><strong>Explanation:</strong> {item.explanation}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <Checkbox checked={Boolean(verified[item.id])} disabled={transferred[item.id]} onChange={(event) => setVerified((current) => ({ ...current, [item.id]: event.target.checked }))}>I have reviewed and verified this question</Checkbox>
                <Button type="primary" icon={transferred[item.id] ? <CheckCircleOutlined /> : <PlusOutlined />} disabled={!verified[item.id] || transferred[item.id]} loading={transferring[item.id]} onClick={() => transferQuestion(item)}>{transferred[item.id] ? "Added to question bank" : "Transfer to question bank"}</Button>
              </div>
            </Card>
          ))}
        </section>
      )}
      {!generating && questions.length === 0 && <Empty image={<RobotOutlined className="text-4xl text-gray-300" />} description="Your generated question drafts will appear here." />}
    </main>
  );
}
