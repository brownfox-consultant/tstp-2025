import { Button, Dropdown, Empty, Segmented, Space } from "antd";
import React from "react";
import { useState, useEffect } from "react";
import QuestionsList from "./QuestionsList";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function SubjectQuestionnaire2({ course, subjectsData, role }) {
  const searchParams = useSearchParams();
  // const [courseSubId, setCourseSubId] = useState(
  //   Number(searchParams.get("course_subject_id"))
  // );
  const [courseSubjectId, setCourseSubjectId] = useState(null);
  
  const current_course_subject_id = Number(
    searchParams.get("course_subject_id")
  );
  useEffect(() => {
  const id = Number(searchParams.get("course_subject_id"));
  if (!isNaN(id)) {
    setCourseSubjectId(id); // 💡 update local state when URL param changes
  }
}, [searchParams]);

  const router = useRouter();
  const pathname = usePathname();
  let updatedSearchParams = new URLSearchParams(searchParams);
  const onChange = (val) => {
    console.log("kokokokokoko")
    // setCourseSubId(val);
    updatedSearchParams.set("course_subject_id", val.toString());
    updatedSearchParams.set("page", "1");
    updatedSearchParams.delete("query");
    updatedSearchParams.delete("topic");
    updatedSearchParams.delete("difficulty");
    updatedSearchParams.delete("test_type");
    updatedSearchParams.delete("sub_topic");
    updatedSearchParams.delete("question_type");
    updatedSearchParams.delete("question_subtype");

    router.replace(`${pathname}?${updatedSearchParams}`);
     setCourseSubjectId(val);
  };

  function calculateCurrentCourseSubject() {
    return Number(searchParams.get("course_subject_id"));
  }

  return (
    <>
      {Number(searchParams.get("course_subject_id")) && (
        <div className="flex justify-between">
          <Segmented
            className="mb-3"
            onChange={onChange}
            value={courseSubjectId}
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
      )}

      {Number(searchParams.get("course_subject_id")) && (
        <QuestionsList
          role={role}
         
  filters={{
    difficulty: searchParams.get("difficulty")?.split(",") || [],
    question_type: searchParams.get("question_type")?.split(",") || [],
    test_type: searchParams.get("test_type")?.split(",") || [],
    topic: searchParams.get("topic")?.split(",").map(Number).filter(v => !isNaN(v)) || [],
    sub_topic: searchParams.get("sub_topic")?.split(",").map(Number).filter(v => !isNaN(v)) || [],
    question_subtype: searchParams.get("question_subtype")?.split(",") || [],
    option_text: searchParams.get("option_text") || "",
    question_text: searchParams.get("question_text") || searchParams.get("query") || "",
    srno: searchParams.get("srno") || "",
    is_active: searchParams.get("is_active")
   ? [searchParams.get("is_active") === "true" ? true : false]
   : [],
  }}
        
        />
      )}
    </>
  );
}

export default SubjectQuestionnaire2;
