import { Input, Tabs, Button, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";
import SubjectQuestionnaire2 from "./SubjectQuestionnaire2";
import AdvancedSearchModal from "./AdvancedSearchModal";
import axios from "axios";
import { BASE_URL } from "@/app/constants/apiConstants";
//const BASE_URL = "http://localhost:8000"; // or your actual base URL


function QuestionsComponent2({ courses }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  let updatedSearchParams = new URLSearchParams(searchParams);

  const [tabItems, setTabItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [difficultyList, setDifficultyList] = useState([]);
  const [questionTypeList, setQuestionTypeList] = useState([]);
  const [testTypeList, setTestTypeList] = useState([]);
  const [questionSubtypeList, setQuestionSubtypeList] = useState([]);

  const role = pathname.split("/")[1];

  // 🔧 Utility: parse and convert query params to arrays
  const getArrayParam = (key) =>
    searchParams.get(key)
      ?.split(",")
      .map(Number)
      .filter((v) => !isNaN(v) && v !== 0) || [];

  // 🚀 Load constants (topics, difficultyList, etc.)
  useEffect(() => {
    async function fetchConstants() {
      try {
        const response = await axios.get(`${BASE_URL}/api/course/constants/`, {
          withCredentials: true,
        });
        const data = response.data;
        console.log("constants API response2:", data);
        setTopics(data.topics || []);
        setDifficultyList(data.difficultyList || []);
        setQuestionTypeList(data.questionTypeList || []);
        setTestTypeList(data.testTypeList || []);
        setQuestionSubtypeList(data.questionSubtypeList || []);
      } catch (error) {
        console.error("Failed to fetch constants", error);
      }
    }

    fetchConstants();
  }, []);

  // 🧠 Build Tab UI dynamically from `courses` prop
  useEffect(() => {
    if (courses.length > 0) {
      setTabItems(
        courses.map((course) => ({
          ...course,
          key: course.name,
          label: course.name,
          children: (
            <SubjectQuestionnaire2
              course={course.name}
              subjectsData={course.subjects}
              role={role}
              setTopics={setTopics}
            />
          ),
        }))
      );
    }
  }, [courses, role]);

 const handleDownload = async () => {
    const courseSubjectId = Number(searchParams.get("course_subject_id"));

    let selectedCourse = null;
    let selectedCourseId = null;

    for (let course of courses) {
      const subject = course.subjects.find(
        (sub) => sub.course_subject_id === courseSubjectId
      );
      if (subject) {
        selectedCourse = course;
        selectedCourseId = course.id;
        break;
      }
    }

    if (!selectedCourseId || !courseSubjectId) {
      console.error("No course or subject selected");
      return;
    }

    try {
      setLoading(true); // Start loader
      const response = await axios.get(
        `${BASE_URL}/api/question/download-report/`,
        {
          params: {
            // course_id: selectedCourseId,
            // course_subject_id: courseSubjectId,
          },
          responseType: "blob",
          withCredentials: true,
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "questions_report.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading report", error);
    } finally {
      setLoading(false); // Stop loader
    }
  };


  const calculateCurrentKey = () => {
    let current_course_subject_id =
      Number(searchParams.get("course_subject_id")) ||
      courses[0]?.subjects[0]?.course_subject_id;

    let current_course = courses.find((course) =>
      course.subjects.some((subject) => subject.course_subject_id === current_course_subject_id)
    );

    return current_course?.name || "";
  };

  const handleTabChange = (key) => {
    console.log("heloooo")
    let currentCourse = courses.find((course) => course.name === key);
    let course_subject_id = currentCourse.subjects[0].course_subject_id;

    updatedSearchParams.set("course_subject_id", course_subject_id.toString());
    updatedSearchParams.set("page", "1");
    updatedSearchParams.delete("query");
    updatedSearchParams.delete("topic");
    updatedSearchParams.delete("sub_topic");
    updatedSearchParams.delete("difficulty");
    updatedSearchParams.delete("test_type");
    updatedSearchParams.delete("question_type");

    router.replace(`${pathname}?${updatedSearchParams.toString()}`);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    updatedSearchParams.set("query", value);
    updatedSearchParams.set("page", "1");
    router.replace(`${pathname}?${updatedSearchParams.toString()}`);
  };

  const handleApplyAdvanced = (filters) => {
  console.log("Filters from modal:", filters);
  [
    "difficulty", "question_type", "test_type", "topic",
    "sub_topic", "option_text", "question_text", "srno", "is_active","question_subtype"
  ].forEach((key) => {
    updatedSearchParams.delete(key);
  });

  if (filters.difficulty?.length) updatedSearchParams.set("difficulty", filters.difficulty.join(","));
  if (filters.question_type?.length) updatedSearchParams.set("question_type", filters.question_type.join(","));
  if (filters.test_type?.length) updatedSearchParams.set("test_type", filters.test_type.join(","));
  if (filters.topic?.length) updatedSearchParams.set("topic", filters.topic.join(","));
  if (filters.sub_topic?.length) updatedSearchParams.set("sub_topic", filters.sub_topic.join(","));
  if (filters.question_subtype?.length) updatedSearchParams.set("question_subtype", filters.question_subtype.join(","));
  if (filters.option_text) updatedSearchParams.set("option_text", filters.option_text);
  if (filters.question_text) updatedSearchParams.set("question_text", filters.question_text);
  if (filters.srno) updatedSearchParams.set("srno", filters.srno);
  
    if (filters.is_active?.length) {
    updatedSearchParams.set("is_active", filters.is_active[0] === true ? "true" : "false");
  }

  updatedSearchParams.set("page", "1");
  router.replace(`${pathname}?${updatedSearchParams.toString()}`);
  setShowAdvanced(false);
};





  return (
    <>
      {/* 🔍 Search Bar + Filter Button */}
     {/* 🔍 Search Bar + Filter Button */}
<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
  <Input
    placeholder="Search by name, email, ..."
    allowClear
    prefix={<SearchOutlined />}
    value={searchQuery}
    onChange={handleSearch}
    style={{ width: 300 }}
  />
  <Button icon={<FilterOutlined />} onClick={() => setShowAdvanced(true)}>
    Advanced Search 
  </Button>

  {role === "admin" && (
    <>
      <Button
        type="primary"
        onClick={handleDownload}
        icon={loading ? <LoadingOutlined /> : null}
        disabled={loading}
      >
        {loading ? "Downloading..." : "Download"}
      </Button>

      <Button
        type="default"
        onClick={() => {
          router.push(`${pathname}/logs`);
        }}
      >
        Questions Log
      </Button>

      <Button
        type="default"
        onClick={async () => {
          try {
            setLoading(true);
            const response = await axios.get(
              `${BASE_URL}/api/question/duplicates/?export=csv`,
              { responseType: "blob", withCredentials: true }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "duplicate_questions.csv");
            document.body.appendChild(link);
            link.click();
            link.remove();
          } catch (error) {
            console.error("Error downloading duplicate questions:", error);
          } finally {
            setLoading(false);
          }
        }}
        icon={loading ? <LoadingOutlined /> : null}
        disabled={loading}
      >
        {loading ? "Downloading..." : "Duplicate Questions"}
      </Button>
    </>
  )}
</div>


      {/* 🧠 Advanced Search Modal */}
      <AdvancedSearchModal
        open={showAdvanced}
        onClose={() => setShowAdvanced(false)}
        onApply={handleApplyAdvanced}
        currentFilters={{
  difficulty: searchParams.get("difficulty")?.split(",") || [],
  question_type: searchParams.get("question_type")?.split(",") || [],
  test_type: searchParams.get("test_type")?.split(",") || [],
  topic: getArrayParam("topic"),
  sub_topic: getArrayParam("sub_topic"),
  question_subtype: searchParams.get("question_subtype")?.split(",") || [], 
  option_text: searchParams.get("option_text") || "",
  question_text: searchParams.get("question_text") || "",
  srno: searchParams.get("srno") || "",
  is_active: searchParams.get("is_active")
   ? [searchParams.get("is_active") === "true" ? true : false]
   : [],
}}

        topics={topics}
        difficultyList={difficultyList}
        questionTypeList={questionTypeList}
        testTypeList={testTypeList}
        questionSubtypeList={questionSubtypeList}
      />

      {/* 📚 Course Tabs */}
      <Tabs
        activeKey={calculateCurrentKey()}
        items={tabItems}
        onChange={handleTabChange}
      
      />
    </>
  );
}

export default QuestionsComponent2;
