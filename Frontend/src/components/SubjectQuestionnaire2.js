import { Button, Segmented } from "antd";
import React, { useState, useEffect } from "react";
import QuestionsList from "./QuestionsList";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlusOutlined } from "@ant-design/icons";

function SubjectQuestionnaire2({ course, subjectsData, role }) {
  const searchParams = useSearchParams();
  const [courseSubjectId, setCourseSubjectId] = useState(null);
  
  const router = useRouter();
  const pathname = usePathname();
  let updatedSearchParams = new URLSearchParams(searchParams);

  useEffect(() => {
    const id = Number(searchParams.get("course_subject_id"));
    if (!isNaN(id)) {
      setCourseSubjectId(id);
    }
  }, [searchParams]);

  const onChange = (val) => {
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

  const isSelected = Number(searchParams.get("course_subject_id"));

  return (
    <div className="space-y-4">
      {isSelected && (
        <div className="bg-white rounded-lg p-2 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 overflow-x-auto">
            <Segmented
              className="custom-segmented"
              onChange={onChange}
              value={courseSubjectId}
              options={subjectsData.map(({ name, course_subject_id }) => {
                return { value: course_subject_id, label: name };
              })}
              size="large"
            />
          </div>
          
          {["admin", "developer"].includes(role) && (
            <Button
              type="primary"
              size="medium"
              icon={<PlusOutlined />}
              onClick={() => router.push(`${pathname}/create`)}
              className="action-button"
            >
              Add Question
            </Button>
          )}
        </div>
      )}

      {isSelected && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
        </div>
      )}

      <style jsx global>{`
        .custom-segmented .ant-segmented-item-selected {
          background-color: #eff6ff !important; /* blue-50 */
          color: #2563eb !important; /* blue-600 */
          font-weight: 600;
        }
        .custom-segmented .ant-segmented-item:hover:not(.ant-segmented-item-selected) {
          color: #2563eb;
        }
        .custom-segmented {
          padding: 4px;
          background-color: #f9fafb; /* gray-50 */
        }
      `}</style>
    </div>
  );
}

export default SubjectQuestionnaire2;
