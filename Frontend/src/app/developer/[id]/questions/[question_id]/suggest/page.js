"use client";

import React, { useEffect, useState } from "react";
import { LeftOutlined } from "@ant-design/icons";

import { useParams, useRouter } from "next/navigation";
import QuestionForm from "@/components/QuestionForm";
import EditQuestionForm from "@/components/EditQuestionForm";
import { getQuestionDetails } from "@/app/services/authService";
import Loading from "@/app/loading";

export default function page() {
  const router = useRouter();
  const params = useParams();
  const [questionDetails, setQuestionDetails] = useState({});
  const [topics, setTopics] = useState({});
  const [subtopics, setSubtopics] = useState();
  const { question_id } = params;
  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    getQuestionDetails(question_id).then((res) => {
      setQuestionDetails(res.data.detail);
      console.log("res.data.detail",res.data.detail)
      setTopics(res.data.topics);
      let subTopicOptions = res.data.topics.find(
        (topic) => topic.name == res.data.detail.topic
      ).subtopics;
      setSubtopics(subTopicOptions);
    });
  }, []);

  return (
    <>
      <div className="text-xl font-bold mb-5 flex align-middle">
        <LeftOutlined
          className="mr-2 text-base hover:font-extrabold cursor-pointer"
          onClick={() => handleBack()}
        />{" "}
        Suggest changes to question
      </div>
      {Object.keys(questionDetails).length == 0 ? (
        <Loading />
      ) : (
        <EditQuestionForm
          action="suggest"
          initialValues={questionDetails}
          courseSubId={questionDetails.course_subject}
          topicOptionsParam={topics}
          subTopicOptionsParam={subtopics}
        />
      )}
    </>
  );
}
