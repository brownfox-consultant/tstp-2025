import { getTestResult } from "@/app/services/authService";

import { Radio, Skeleton } from "antd";
import React, { useEffect, useState } from "react";
import ResultList from "./ResultList";

function ResultComponent({
  sections,
  course_subject,
  test_id,
  student_id,
  test_submission_id,
  isAdmin,
}) {
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0].id);
  const [skeletonLoading, setSkeletonLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [sectionwiseScore, setSectionwiseScore] = useState({});

  useEffect(() => {
    setSkeletonLoading(true);
    getTestResult({
      section_id: selectedSectionId,
      course_subject_id: course_subject,
      test_submission_id: test_submission_id,
    })
      .then(({ data }) => {
        setQuestions(data.questions);
        setSectionwiseScore({
          correct_count: data.correct_count,
          incorrect_count: data.incorrect_count,
        });
      })
      .finally(() => setSkeletonLoading(false));
  }, [selectedSectionId, course_subject]);

  return (
    <>
      <div className="flex justify-between">
        <Radio.Group
          value={selectedSectionId}
          onChange={(e) => {
            setSelectedSectionId(e.target.value);
          }}
          // defaultValue={sections[0].id}
          options={sections.map((section) => {
            return { label: `${section.name}`, value: section.id };
          })}
        ></Radio.Group>
        <div>
          <span className="mr-5">
            Correct:{" "}
            <span className="text-green-700">
              {sectionwiseScore.correct_count}
            </span>
          </span>
          <span>
            Incorrect:{" "}
            <span className="text-red-700">
              {sectionwiseScore.incorrect_count}
            </span>
          </span>
        </div>
      </div>
      <Skeleton loading={skeletonLoading}>
        <ResultList
          questions={questions}
          test_id={test_id}
          section={selectedSectionId}
          course_subject={course_subject}
          isAdmin={isAdmin}
        />
      </Skeleton>
    </>
  );
}

export default ResultComponent;
