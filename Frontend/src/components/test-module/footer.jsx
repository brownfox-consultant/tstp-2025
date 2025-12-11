import { Button, Dropdown } from "antd";
import React, { useEffect, useState } from "react";
import SectionMapDropdown from "./section-map-dropdown";
import { useSelector, useDispatch } from "react-redux";
import {
  saveAndMove,
  sectionComplete,
  setTestRunning,
} from "@/lib/features/test/testSlice";
import { useParams, useRouter } from "next/navigation";
import useFullScreen from "@/utils/useFullScreen";
import { useHotkeys } from "react-hotkeys-hook";
import Report from "@/components/report-module";
import ReportNew from "../report-module/Report_New";
import TestFeedbackModal from "@/components/test-module/test-feedback-modal";
import { Modal} from "antd";


function TestFooter() {
  const router = useRouter();
  const { id, testType, testId } = useParams();
  const [showResult, setShowResult] = useState(false);
  const [submissionId, setSubmissionId] = useState();
  const username = useSelector((state) => state.test.username);
  const questions = useSelector((state) => state.test.questions);
  const isReviewPage = useSelector((state) => state.test.isReviewPage);
  const { exitFullScreen } = useFullScreen();
  const [finishTriggered, setFinishTriggered] = useState(false);
  const isSectionCompleted = useSelector(
    (state) => state.test.isSectionCompleted
  );
  const isTestCompleted = useSelector((state) => state.test.isTestCompleted);
  const currentQuestionIndex = useSelector(
    (state) => state.test.currentQuestionIndex
  );
  const isTimeUp = useSelector((state) => state.test.isTimeUp);
  const testSubmissionId = useSelector((state) => state.test.testSubmissionId);

  const totalQuestionsCount = questions.length;

  const dispatch = useDispatch();

  useEffect(() => {
    if (questions.length == 0 && !isSectionCompleted) {
      router.replace(
        testType == "practice"
          ? `/student/${id}/test/practice/create`
          : `/student/${id}/test/${testId}/begin`
      );
      return;
    }
  }, [questions, isSectionCompleted]);

  async function handleClick(type, toIndex = null) {
    await dispatch(
      saveAndMove({
        operation: type,
        questionIndex: toIndex,
      })
    ).unwrap();
  }


  

 async function handleFinish() {
  if (testType == "practice") {
    console.log("practice");
  } else {
    if (!isTimeUp) {
      Modal.warning({
        title: "⏳ Time is not over",
        content: (
          <div style={{ fontSize: "18px", textAlign: "center" }}>
            Please wait until the timer finishes to submit the test.
          </div>
        ),
        centered: true, // ✅ Center the modal
        width: 500, // ✅ Make it larger
        okText: "Okay",
        okButtonProps: {
          style: { fontSize: "16px", padding: "6px 20px" }, // ✅ Larger button
        },
      });
      return;
    }
  }

  try {
    await dispatch(sectionComplete({ via: "FINISH" })).unwrap();
    setFinishTriggered(true);
  } catch (error) {
    console.log("Exit Error", error);
  }
}


useEffect(() => {
  if (!finishTriggered) return;

  const timer = setTimeout(() => {
    if (isTestCompleted && isSectionCompleted) {
      if (testType == "practice") {
        exitFullScreen();
        router.replace(`/student/${id}/test/practice/${testId}/result`);
      } else {
        exitFullScreen();
        window.sessionStorage.setItem("test_submission_id", testSubmissionId);
        setSubmissionId(testSubmissionId);
      }
    } else if (isSectionCompleted) {
      router.replace(`/student/${id}/test/${testId}/begin`);
    }
    setFinishTriggered(false);
  }, 500); // 0.5 second delay for Redux state update

  return () => clearTimeout(timer);
}, [finishTriggered, isTestCompleted, isSectionCompleted]);



  useHotkeys("alt+b", () => {
    if (currentQuestionIndex != 0) handleClick("PREV");
  });

  useHotkeys("alt+n", () => {
    if (!isReviewPage) handleClick("NEXT");
  });

  useHotkeys("alt+f", () => {
    if (isReviewPage) handleFinish();
  });

  return (
    <>
      {showResult ? (
        <ReportNew testSubmissionId={submissionId} />
      ) : (
        <>
          <footer className="w-full h-16 bg-neutral-100 grid grid-cols-3 row-span-1 border-t-2 border-dashed border-black px-10">
            <div className="user-name h-fit  my-auto">{username}</div>
            <div className="section-map text-center h-fit my-auto">
              <SectionMapDropdown onChangeQuestion={handleClick} />
            </div>
            <div className="test-navigation text-end h-fit my-auto">
              <Button
                disabled={
                  isReviewPage ? isReviewPage : currentQuestionIndex == 0
                }
                onClick={() => handleClick("PREV")}
                className="mx-1"
                shape="round"
                type="primary"
              >
                Back
              </Button>
              {currentQuestionIndex == totalQuestionsCount - 1 &&
              isReviewPage ? (
                <Button
                  onClick={handleFinish}
                  className="mx-1"
                  shape="round"
                      type="primary"
                      // disabled={!isTimeUp}
                >
                  Finish
                </Button>
              ) : (
                <Button
                  disabled={isReviewPage}
                  onClick={() => handleClick("NEXT")}
                  className="mx-1"
                  shape="round"
                  type="primary"
                >
                  Next
                </Button>
              )}
              </div>
              {testType !== "practice" && (
  <TestFeedbackModal
    modalOpen={isTestCompleted && isSectionCompleted}
    test_submission_id={testSubmissionId}
    onClose={() => {
      exitFullScreen();
      if (testType === "practice") {
        router.replace(`/student/${id}/test/practice/${testId}/result`);
      } else {
        router.replace(
          `/student/${id}/test/full/${testId}/result?test_submission_id=${testSubmissionId}`
        );
      }
    }}
  />
)}
          </footer>
        </>
      )}
    </>
  );
}

export default TestFooter;
