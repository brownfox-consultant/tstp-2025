"use client";

import React, { useEffect, useState } from "react";
import { LeftOutlined } from "@ant-design/icons";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import EditQuestionForm from "@/components/EditQuestionForm";
import { getQuestionDetails } from "@/app/services/authService";
import Loading from "@/app/loading";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const { question_id } = params;

  const [questionDetails, setQuestionDetails] = useState(null);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const searchParams = useSearchParams();

  // Get URL params
  const csIdFromUrl = searchParams.get("course_subject_id");
  const pageFromUrl = searchParams.get("page");

  useEffect(() => {
    if (!question_id) return;

    getQuestionDetails(question_id).then((res) => {
      const detail = res.data.detail;
      setQuestionDetails(detail);
      setTopics(res.data.topics || []);

      const subTopicOptions =
        res.data.topics.find((t) => t.name === detail.topic)?.subtopics || [];
      setSubtopics(subTopicOptions);
    });
  }, [question_id]);

  const handleBack = () => router.back();

  // Wait until questionDetails is loaded
  if (!questionDetails) return <Loading />;

  // Final values for courseSubjectId and page
  const finalCourseSubjectId = csIdFromUrl ?? questionDetails.course_subject;
  const finalPage = pageFromUrl ?? 1;

  // Log URL and params
  console.log("Current URL:", window.location.href);
  console.log("courseSubjectId:", finalCourseSubjectId);
  console.log("page:", finalPage);

  return (
    <>
      <div className="text-xl font-bold mb-5 flex align-middle">
        <LeftOutlined
          className="mr-2 text-base hover:font-extrabold cursor-pointer"
          onClick={handleBack}
        />
        Edit question
      </div>

      <EditQuestionForm
        action="edit"
        initialValues={questionDetails}
        courseSubId={questionDetails.course_subject}
        topicOptionsParam={topics}
        subTopicOptionsParam={subtopics}
        page={finalPage}
        courseSubjectId={finalCourseSubjectId}
      />
    </>
  );
}
