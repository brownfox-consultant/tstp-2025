import { getCoursesInsideAuth } from "@/app/services/courseService";
import SubjectQuestionnaire from "@/components/SubjectQuestionnaire";
import AdvancedSearchModal from "@/components/AdvancedSearchModal";
import { Tabs, Input, Button } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";
import axios from "axios"; 
import { BASE_URL } from "@/app/constants/apiConstants";
function QuestionsComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  let role = pathname.split("/")[1];

  const [courses, setCourses] = useState([]);
  const [activeCourseKey, setActiveCourseKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({});
  const [topics, setTopics] = useState([]);
const [difficultyList, setDifficultyList] = useState([]);
const [questionTypeList, setQuestionTypeList] = useState([]);
  const [testTypeList, setTestTypeList] = useState([]);
  const [questionSubtypeList, setQuestionSubtypeList] = useState([]);

  
  useEffect(() => {
  // Fetch course list
  getCoursesInsideAuth()
    .then((res) => {
      setCourses(res.data);
      if (res.data.length > 0) {
        setActiveCourseKey(res.data[0].name);
      }
    })
    .catch(console.error);

  // Fetch constants
  axios
    .get(`${BASE_URL}/api/course/constants/`, {
      withCredentials: true,
    })
    .then((res) => {
      console.log("constants API response1:", res.data);
      setTopics(res.data.topics);
      setDifficultyList(res.data.difficultyList);
      setQuestionTypeList(res.data.questionTypeList);
      setTestTypeList(res.data.testTypeList);
      setQuestionSubtypeList(res.data.questionSubtypeList);
      
    })
    .catch(console.error);
}, []);

  useEffect(() => {
    getCoursesInsideAuth()
      .then((res) => {
        setCourses(res.data);
        if (res.data.length > 0) {
          setActiveCourseKey(res.data[0].name); // default to first course
        }
      })
      .catch((err) => console.log(err));
  }, []);

  


  const onChange = (key) => {
    setActiveCourseKey(key);
    const updatedParams = new URLSearchParams(window.location.search);
    updatedParams.set("query", "");
    updatedParams.set("page", 1);
    router.replace(`${pathname}?${updatedParams.toString()}`);
    setSearchQuery("");
  };

  const handleApplyAdvanced = (appliedFilters) => {
    setFilters(appliedFilters);
    setShowAdvanced(false);
  };

  const handleSearch = (value) => {
    const updatedParams = new URLSearchParams(window.location.search);
    updatedParams.set("query", value);
    updatedParams.set("page", 1);
    router.replace(`${pathname}?${updatedParams.toString()}`);
    setSearchQuery(value);
  };

  const activeCourse = courses.find((course) => course.name === activeCourseKey);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Input.Search
          placeholder="Search question text..."
          allowClear
          prefix={<SearchOutlined />}
          enterButton
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
        <Button icon={<FilterOutlined />} onClick={() => setShowAdvanced(true)}>
          Advanced Search
        </Button>
          
      </div>

      <Tabs
        activeKey={activeCourseKey}
        onChange={onChange}
        items={courses.map((course) => ({
          key: course.name,
          label: course.name,
        }))}
      />

      {activeCourse && (
        <SubjectQuestionnaire
          course={activeCourse.name}
          subjectsData={activeCourse.subjects}
          role={role}
          searchQuery={searchQuery}
          filters={filters}
        />
      )}

    <AdvancedSearchModal
  open={showAdvanced}
  onClose={() => setShowAdvanced(false)}
  onApply={handleApplyAdvanced}
  currentFilters={filters}
  topics={topics}
  difficultyList={difficultyList}
  questionTypeList={questionTypeList}
  testTypeList={testTypeList}
  questionSubtypeList={questionSubtypeList}
/>


    </>
  );
}

export default QuestionsComponent;
