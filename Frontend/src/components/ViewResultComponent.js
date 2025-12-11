import { getTestDetails, getTestResult } from "@/app/services/authService";
import ResultComponent from "@/components/ResultComponent";
import { LeftOutlined } from "@ant-design/icons";
import { Skeleton, Tabs } from "antd";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

function ViewResultComponent({
  studentId = null,
  studentName = null,
  isAdmin = false,
  testSubmissionId = null,
}) {
  const [subjectTabs, setSubjectTabs] = useState([]);
  const [loadingSkeleton, setLoadingSkeleton] = useState(false);
  const [testTitle, setTestTitle] = useState("");
  const { id, testId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    setLoadingSkeleton(true);
    getTestDetails(testId).then(({ data }) => {
      setTestTitle(data.name);
      setSubjectTabs(
        data.subject.map((subject) => {
          return {
            label: subject.name,
            key: subject.course_subject,
            children: (
              <ResultComponent
                sections={subject.sections}
                course_subject={subject.course_subject}
                test_id={testId}
                student_id={studentId || id}
                isAdmin={isAdmin}
                test_submission_id={
                  testSubmissionId || searchParams.get("test_submission_id")
                }
              />
            ),
          };
        })
      );
      setLoadingSkeleton(false);
    });
  }, []);
  return (
    <Skeleton loading={loadingSkeleton}>
      <div className="my-2 text-xl">
        <LeftOutlined
          onClick={() => router.back()}
          className="mr-2 text-base hover:font-extrabold"
        />
        {testTitle}
      </div>
      {studentName && (
        <div className="text-base mb-2">Student Name: {studentName}</div>
      )}
      <Tabs defaultActiveKey="1" size="large" items={subjectTabs}></Tabs>
    </Skeleton>
  );
}

export default ViewResultComponent;
