"use client";

import { saveAndMove, sectionComplete } from "@/lib/features/test/testSlice";
import { CloseSquareOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TestFeedbackModal from "./test-feedback-modal";
import { insideAuthInstance } from "@/lib/AxiosInstance";


function ExitExamModal({ openModal, setOpenModal }) {
  const { id, testType, testId } = useParams();
  const dispatch = useDispatch();
  const router = useRouter();

  const [showFeedback, setShowFeedback] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  const { testSubmissionId } = useSelector((state) => state.test);

  const handleFeedbackClose = () => {
    if (hasRedirected) return;

    setHasRedirected(true);
    setShowFeedback(false);

    const test_submission_id =
      window?.sessionStorage.getItem("test_submission_id") ||
      testSubmissionId;

    router.replace(
      `/tstp/student/${id}/test/full/${testId}/result?test_submission_id=${test_submission_id}`
    );
  };

  const handleExit = async () => {
  try {
    // Save current answer before exiting
    await dispatch(
      saveAndMove({
        operation: "EXIT",
        questionIndex: -1,
      })
    ).unwrap();

    // Exit the test
    if (testType === "practice") {
  await insideAuthInstance.post(
    `/practice/${testId}/exit-test/`
  );

  router.replace(
    `/tstp/student/${id}/test/practice/${testId}/result`
  );

  return;
}

// Full Test
await insideAuthInstance.post(
  `/test/${testId}/exit-test/`,
  {
    test_submission_id: testSubmissionId,
  }
);

setShowFeedback(true);

  } catch (error) {
    console.error("Exit Test Error:", error);
    Modal.error({
      title: "Exit Failed",
      content: "Unable to exit the test. Please try again.",
    });
  } finally {
    setOpenModal(false);
  }
};

  return (
    <div>
      <div
        className="flex h-14 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded p-1 text-xs leading-tight text-center cursor-pointer hover:bg-black/5"
        onClick={() => setOpenModal(true)}
      >
        <span className="flex h-5 items-center justify-center text-sm leading-none"><CloseSquareOutlined /></span>
        <span className="flex min-h-5 items-center justify-center">Exit Exam</span>
      </div>

      <Modal
        style={{ top: "calc(50% - 100px)" }}
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onOk={handleExit}
        okText="Ok"
        title="Are you sure you want to leave the exam?"
      >
        {testType === "practice"
          ? "You won't be able to resume this test again."
          : "You won't be able to answer this section again."}
      </Modal>

      {/* Feedback Modal */}
      {testType !== "practice" && (
        <TestFeedbackModal
          modalOpen={showFeedback}
          test_submission_id={testSubmissionId}
          onClose={handleFeedbackClose}
        />
      )}
    </div>
  );
}

export default ExitExamModal;
