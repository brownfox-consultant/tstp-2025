"use client";

import { getPracticeResults } from "@/app/services/authService";
import Options from "@/components/Options";
import useFullScreen from "@/utils/useFullScreen";
import {
  CaretRightOutlined,
  CheckOutlined,
  CloseOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import { Collapse, Skeleton } from "antd";
import { useParams, useRouter,usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import MathContent from "./MathContent";


function PracticeTestResult() {
  const { practice_test_id, id } = useParams();
  const router = useRouter();
  const [resultDetails, setResultDetails] = useState();
  const [skeletonLoading, setSkeletonLoading] = useState(false);
  const { goFullScreen, isFullScreen, exitFullScreen } = useFullScreen();
  const pathname = usePathname();
  const role = pathname.split("/")[1];
  useEffect(() => {
    // if (isFullScreen) {
    // exitFullScreen();
    // }
    setSkeletonLoading(true);
    getPracticeResults(practice_test_id)
      .then(({ data }) => {
        setResultDetails(data);
        console.log("data",data)
      })
      .finally(() => setSkeletonLoading(false));
  }, []);

  return (
    <>
      
      <div className="text-xl font-semibold mb-5 flex align-middle">
        <LeftOutlined
          onClick={() => router.push(`/${role}/${id}/practice`)}
          className="mr-2 text-base hover:font-extrabold"
        />{" "}
        Result
      </div>
      <div className="mb-3 text-lg">
  <span className="mr-5">
    Correct:{" "}
    <span className="text-green-700">
      {resultDetails?.section_correct_count ?? "-"}
    </span>
  </span>
  <span>
    Incorrect:{" "}
    <span className="text-red-700">
      {resultDetails?.section_incorrect_count ?? "-"}
    </span>
  </span>
</div>
      <Skeleton loading={skeletonLoading}>
        {/* <ResultList
          questions={resultDetails?.questions}
          test_id={test_id}
          section={selectedSectionId}
          course_subject={course_subject}
          isAdmin={isAdmin}
        /> */}
        <Collapse
  className="test-result-collapse mt-5"
  expandIcon={({ isActive }) => (
    <CaretRightOutlined rotate={isActive ? 90 : 0} />
  )}
  items={resultDetails?.questions_data?.map((question, index) => {
    const isCorrect = question.result === true;
    const hasMarked = Array.isArray(question.selected_options) && question.selected_options.length > 0;

    return {
      key: question.question_id,
      showArrow: true,
      label: (
        <div className="py-5 flex justify-between">
          <div className="w-4/5 font-bold">
            Q{question?.sr_no}: Topic - {question?.topic}
          </div>
          <span className="uppercase text-xs font-semibold">
            {hasMarked && isCorrect ? (
              <span className="text-green-600 text-xl">
                <CheckOutlined />
              </span>
            ) : hasMarked ? (
              <span className="text-red-600 text-xl">
                <CloseOutlined />
              </span>
            ) : (
              <span className="text-gray-600">Unattempted</span>
            )}
          </span>
        </div>
      ),
      children: (
        <div className="text-sm text-gray-700">
          <p><strong>Question ID:</strong> {question.question_id}</p>
          <p><strong>Time Spent:</strong> {question.total_time} seconds</p>
          <p><strong>Marked:</strong> {question.marked ? "Yes" : "No"}</p>
          <p><strong>Skipped:</strong> {question.is_skipped ? "Yes" : "No"}</p>
          <p><strong>Selected Options:</strong> {question.selected_options.join(", ") || "None"}</p>
        </div>
      ),
      style: {
        border: "none",
        borderRadius: "8px",
      },
    };
  })}
  bordered={false}
/>

      </Skeleton>
    </>
  );
}

export default PracticeTestResult;
