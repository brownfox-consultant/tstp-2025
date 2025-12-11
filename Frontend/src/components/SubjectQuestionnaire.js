import { Button, Dropdown, Empty, Segmented, Space } from "antd";
import React from "react";
import { useState, useEffect } from "react";
import QuestionsList from "./QuestionsList";
import { usePathname, useRouter } from "next/navigation";

function SubjectQuestionnaire({ course, subjectsData, role, searchQuery, filters }) {
  const [courseSubId, setCourseSubId] = useState();
  const [searchText, setSearchText] = useState();
  const [current, setCurrent] = useState(1);
  const [params, setParams] = useState({});
  const router = useRouter();
  const pathname = usePathname();
  const onChange = (val) => {
    setCourseSubId(val);
    setSearchText();
    setCurrent(1);
    setParams({});
  
    // 🔥 FIX: Update the URL with course_subject_id
    const updatedSearchParams = new URLSearchParams(window.location.search);
    updatedSearchParams.set("course_subject_id", val);
    updatedSearchParams.set("page", 1); // reset to first page
    router.replace(`${pathname}?${updatedSearchParams.toString()}`);
  };

  useEffect(() => {
    if (subjectsData[0]) {
      const defaultId = subjectsData[0].course_subject_id;
      setCourseSubId(defaultId);
  
      const updatedSearchParams = new URLSearchParams(window.location.search);
      updatedSearchParams.set("course_subject_id", defaultId);
      updatedSearchParams.set("page", 1);
      router.replace(`${pathname}?${updatedSearchParams.toString()}`);
    }
  }, [subjectsData]);

  return (
    <>
      <div className="flex justify-between">
        <Segmented
          className="mb-3"
          // defaultValue={subjectsData[0].id}
          onChange={onChange}
          value={courseSubId}
          options={subjectsData.map(({ name, course_subject_id }) => {
            return { value: course_subject_id, label: name };
          })}
        />
        {["admin", "developer"].includes(role) && (
          <Button
            type="primary"
            onClick={() => router.push(`${pathname}/create`)}
          >
            Add Question
          </Button>
        )}
      </div>

      <QuestionsList
  searchText={searchQuery}
  filters={filters}
  setSearchText={setSearchText}
  current={current}
  setCurrent={setCurrent}
  params={params}
  setParams={setParams}
  courseSubId={courseSubId}
  role={role}
/>

    </>
  );
}

export default SubjectQuestionnaire;
