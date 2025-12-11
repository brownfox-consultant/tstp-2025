"use client";

import { saveAndMove, sectionComplete } from "@/lib/features/test/testSlice";
import { CloseSquareOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TestFeedbackModal from "./test-feedback-modal";

function ExitExamModal({ openModal, setOpenModal }) {
  // const [openModal, setOpenModal] = useState(false);
  const { id, testType, testId } = useParams();
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const [hasRedirected, setHasRedirected] = React.useState(false);
  const [showFeedback, setShowFeedback] = React.useState(false);

   const { 
    isSectionCompleted, 
    isTestCompleted, 
    testSubmissionId, 
    currentArraySectionIndex, 
    totalSections 
    } = useSelector((state) => state.test);

  const handleFeedbackClose = () => {
    if (hasRedirected) return;
    setHasRedirected(true);
    setShowFeedback(false);
    router.replace(
      `/student/${id}/test/full/${testId}/result?test_submission_id=${testSubmissionId}`
    );
  };
  
  <TestFeedbackModal
    modalOpen={showFeedback}
    test_submission_id={testSubmissionId}
    onClose={handleFeedbackClose}
  />

  async function handleExit() {
  try {
    await dispatch(
      saveAndMove({ operation: "EXIT", questionIndex: -1 })
    ).unwrap();

    await dispatch(sectionComplete({ via: "EXIT" })).unwrap();

    // Open feedback modal instead of redirecting immediately
    setShowFeedback(true);
  } catch (error) {
    console.log("Exit Error", error);
  }

  setOpenModal(false);
}

 return (
  <div>
    <div
      type="text"
      className="flex flex-col gap-2 justify-center text-sm items-center cursor-pointer p-2 rounded hover:bg-black/5"
      onClick={() => setOpenModal(true)}
    >
      <CloseSquareOutlined />
      Exit Exam
    </div>
    <Modal
      style={{
        top: "calc(50% - 100px)",
      }}
      open={openModal}
      onCancel={() => setOpenModal(false)}
      onOk={handleExit}
      okText="Ok"
      title="Are you sure you want to leave the exam?"
    >
      {testType == "practice"
        ? "You won't be able to resume this test again."
        : "You won't be able to answer this section again."}
    </Modal>

    {/* Feedback Modal should be rendered here */}
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
