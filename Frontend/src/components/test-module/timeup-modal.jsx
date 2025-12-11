"use client";

import {
  sectionComplete,
  setTestAsCompleted,
} from "@/lib/features/test/testSlice";
import { CloseSquareOutlined, LoadingOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import TestFeedbackModal from "./test-feedback-modal";

function TimeupModal({ openModal }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id, testType, testId } = useParams();
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [sectionCompletedOnce, setSectionCompletedOnce] = React.useState(false);
  const [hasRedirected, setHasRedirected] = React.useState(false);

  const {
    isSectionCompleted,
    isTestCompleted,
    testSubmissionId,
    currentArraySectionIndex,
    totalSections,
  } = useSelector((state) => state.test);

  const isPractice = testType === "practice";

  const handleFeedbackClose = () => {
    if (hasRedirected) return;
    setHasRedirected(true);
    setShowFeedback(false);
    router.replace(
      `/student/${id}/test/full/${testId}/result?test_submission_id=${testSubmissionId}`
    );
  };

  useEffect(() => {
    if (!openModal || sectionCompletedOnce) return;

    const completeSection = async () => {
      try {
        await dispatch(sectionComplete({ via: "TIMEUP" })).unwrap();
        if (currentArraySectionIndex === totalSections - 1) {
          dispatch(setTestAsCompleted());
        }
        setSectionCompletedOnce(true);
      } catch (error) {
        console.error("Error during section completion:", error);
      }
    };

    completeSection();
  }, [openModal, sectionCompletedOnce]);

  useEffect(() => {
    if (isSectionCompleted && isTestCompleted) {
      if (isPractice) {
        // ✅ Skip feedback for practice
        router.replace(`/student/${id}/test/practice/${testId}/result`);
      } else {
        setShowFeedback(true);
      }
    }
  }, [isSectionCompleted, isTestCompleted]);

  useEffect(() => {
    if (!openModal || isTestCompleted) return;

    const timer = setTimeout(() => {
      if (isPractice) {
        if (isSectionCompleted && !isTestCompleted) {
          router.replace(`/student/${id}/test/practice/${testId}/result`);
        }
      } else {
        if (isSectionCompleted && !isTestCompleted) {
          // router.replace(`/student/${id}/test/full/${testId}/`);
          router.replace(`/student/${id}/test/${testId}/begin`);
        }
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isSectionCompleted, isTestCompleted, openModal]);

  return (
    <div>
      {!(isSectionCompleted && isTestCompleted) ? (
        <Modal
          style={{ top: "calc(50% - 100px)" }}
          open={openModal}
          closable={false}
          footer={null}
        >
          <div className="flex flex-col justify-center items-center gap-5">
            {isPractice
              ? "Time up for the practice. Saving the responses..."
              : "Time for this section is up. Saving the response for this section..."}
            <LoadingOutlined spin style={{ fontSize: "40px" }} />
          </div>
        </Modal>
      ) : (
        !isPractice && (
          <TestFeedbackModal
            modalOpen={showFeedback}
            test_submission_id={testSubmissionId}
            onClose={handleFeedbackClose}
          />
        )
      )}
    </div>
  );
}

export default TimeupModal;
