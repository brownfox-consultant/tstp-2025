"use client";

import { saveAndMove, sectionComplete } from "@/lib/features/test/testSlice";
import { CloseSquareOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TestFeedbackModal from "./test-feedback-modal";

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
      `/student/${id}/test/full/${testId}/result?test_submission_id=${test_submission_id}`
    );
  };

  const handleExit = async () => {
    try {
      await dispatch(
        saveAndMove({ operation: "EXIT", questionIndex: -1 })
      ).unwrap();

      await dispatch(sectionComplete({ via: "EXIT" })).unwrap();

      // Show feedback modal instead of instant redirect
      if (testType !== "practice") {
        setShowFeedback(true);
      } else {
        handleFeedbackClose();
      }
    } catch (error) {
      console.log("Exit Error", error);
    }

    setOpenModal(false);
  };

  return (
    <div>
      <div
        className="flex flex-row gap-2 justify-center text-sm items-center cursor-pointer p-2 rounded hover:bg-black/5"
        onClick={() => setOpenModal(true)}
      >
        <CloseSquareOutlined />
        Exit Exam
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
