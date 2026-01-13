import { Input, Tabs, Button, Spin, Tooltip } from "antd";
import {
  LoadingOutlined,
  DownloadOutlined,
  CopyOutlined,
  HistoryOutlined,
  SearchOutlined,
  FilterOutlined
} from "@ant-design/icons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import SubjectQuestionnaire2 from "./SubjectQuestionnaire2";
import AdvancedSearchModal from "./AdvancedSearchModal";
import axios from "axios";
import { BASE_URL } from "@/app/constants/apiConstants";

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
      "sub_topic", "option_text", "question_text", "srno", "is_active", "question_subtype"
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
    <div className="space-y-6">
      {/* 🔍 Search & Actions Card */}
      <div className="">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Left Side: Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
            <Input
              placeholder="Search by name, email, etc..."
              allowClear
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchQuery}
              onChange={handleSearch}
              className="rounded-lg border-gray-200 hover:border-blue-400 focus:border-blue-500 shadow-sm"
              style={{ height: '48px', width: '100%' }}
            />
            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowAdvanced(true)}
              className="px-5 rounded-lg border-gray-200 hover:border-blue-400 hover:text-blue-600 font-medium flex items-center justify-center gap-2"
              style={{ height: '48px' }}
            >
              Advanced Search for {calculateCurrentKey()}
            </Button>
          </div>

          {/* Right Side: Action Buttons */}
          {role === "admin" && (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="primary"
                onClick={handleDownload}
                icon={loading ? <LoadingOutlined /> : <DownloadOutlined />}
                disabled={loading}
                className="h-10 px-5 rounded-md font-medium shadow-sm border-0 flex items-center gap-2 bg-[#F59405] hover:bg-[#E08904]"
              >
                {loading ? "Downloading..." : "Download Report"}
              </Button>

              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                <Tooltip title="View the history logs of question changes">
                  <Button
                    type="text"
                    icon={<HistoryOutlined />}
                    onClick={() => router.push(`${pathname}/logs`)}
                    className="rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 h-9 px-3  font-bold"
                  >
                    Log
                  </Button>
                </Tooltip>

                <div className="w-px h-5 bg-gray-200 mx-1"></div>

                <Button
  type="text"
  icon={loading ? <LoadingOutlined /> : <CopyOutlined />}
  onClick={async () => {
    try {
      setLoading(true);

      const courseSubjectId = Number(searchParams.get("course_subject_id"));

      if (!courseSubjectId) {
        console.error("course_subject_id not found");
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/api/question/duplicates/`,
        {
          params: {
            export: "csv",
            course_subject_id: courseSubjectId, // ✅
          },
          responseType: "blob",
          withCredentials: true,
        }
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
  disabled={loading}
  className="rounded-md text-gray-600 hover:bg-white hover:shadow-sm h-9"
  title="Export Duplicate Questions"
>
  Duplicates
</Button>

                <Tooltip title="Export a CSV of duplicate questions">
  <Button
    type="text"
    icon={loading ? <LoadingOutlined /> : <CopyOutlined />}
    disabled={loading}
    className="rounded-md text-gray-600 hover:bg-white hover:shadow-sm h-9"
    title="Export Duplicate Questions"
    onClick={async () => {
      try {
        setLoading(true);

        const courseSubjectId = Number(searchParams.get("course_subject_id"));

        if (!courseSubjectId) {
          console.error("course_subject_id not found");
          return;
        }

        const response = await axios.get(
          `${BASE_URL}/api/question/duplicates/`,
          {
            params: {
              export: "csv",
              course_subject_id: courseSubjectId,   // ✅ PASSED
            },
            responseType: "blob",
            withCredentials: true,
          }
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
  >
    Duplicates
  </Button>
</Tooltip>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🧠 Advanced Search Modal */}
      <AdvancedSearchModal
        open={showAdvanced}
        onClose={() => setShowAdvanced(false)}
        onApply={handleApplyAdvanced}
        selectedCourseName={calculateCurrentKey()}
        selectedCourseId={courses.find(c => c.name === calculateCurrentKey())?.id}
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-2 pt-2">
          <Tabs
            activeKey={calculateCurrentKey()}
            items={tabItems}
            onChange={handleTabChange}
            type="card"
            className="custom-tabs"
            tabBarStyle={{ margin: 0, borderBottom: '1px solid #f0f0f0' }}
          />
        </div>
      </div>

      {/* Custom Tabs Styling */}
      <style jsx global>{`
        .custom-tabs .ant-tabs-nav .ant-tabs-tab {
          border-radius: 8px 8px 0 0 !important;
          border: 1px solid transparent !important;
          background: transparent !important;
          margin-right: 4px !important;
          transition: all 0.2s;
        }
        .custom-tabs .ant-tabs-nav .ant-tabs-tab:hover {
          color: #2563eb !important;
        }
        .custom-tabs .ant-tabs-nav .ant-tabs-tab-active {
          background: #fff !important;
          border-color: #f0f0f0 !important;
          border-bottom-color: #fff !important;
          font-weight: 600 !important;
          color: #2563eb !important;
        }
        .custom-tabs .ant-tabs-content {
          padding: 2px 0 0 0;
        }
      `}</style>
    </div>
  );
}

export default QuestionsComponent2;
