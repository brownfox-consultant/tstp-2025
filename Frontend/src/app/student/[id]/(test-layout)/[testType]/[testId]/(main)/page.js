"use client";

import Question from "@/components/test-module/question";
import ReviewComponent from "@/components/test-module/review-component";
import TimeupModal from "@/components/test-module/timeup-modal";
import { saveAndMove, testInProgress, getQuestionForSection, fetchMultipleQuestionDetails, setTestDetails, setAnswerMap, setCurrentQuestionIndex } from "@/lib/features/test/testSlice";
import { useGlobalContext } from "@/context/store";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import TestLoading from "../loading";
import useFullScreen from "@/utils/useFullScreen";
import TestFeedbackModal from "@/components/test-module/test-feedback-modal";
import Loading from "@/app/student/[id]/(base-layout)/loading";
import TestFooter from "@/components/test-module/footer";
import TestHeader from "@/components/test-module/header";
import { useRef } from "react";

function Page() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { id, testType, testId } = useParams();
  const { exitFullScreen } = useFullScreen();
  const { userId } = useGlobalContext();
  const hasRestored = useRef(false);

  const questions = useSelector((state) => state.test.questions);
  const questionsStatus = useSelector((state) => state.test.questionsStatus);
  const isTimeUp = useSelector((state) => state.test.isTimeUp);
  const isTestCompleted = useSelector((state) => state.test.isTestCompleted);
  const isSectionCompleted = useSelector((state) => state.test.isSectionCompleted);
  const testSubmissionId = useSelector((state) => state.test.testSubmissionId);
  const isReviewPage = useSelector((state) => state.test.isReviewPage);
  const answerMap = useSelector((state) => state.test.answerMap);
  const currentQuestionIndex = useSelector((state) => state.test.currentQuestionIndex);
  const [isRestoring, setIsRestoring] = useState(true); // Internal state to track restoration progress

  // Redirect if questions are missing

  useEffect(() => {
    // console.log("Redux state updated:");
    // console.log("isTestCompleted:", isTestCompleted);
    // console.log("isSectionCompleted:", isSectionCompleted);
  }, [isTestCompleted, isSectionCompleted]);

  // Handle Practice state saving
  useEffect(() => {
    if (testType === "practice" && !isRestoring && questions.length > 0) {
      window.sessionStorage.setItem("practice_answers", JSON.stringify(answerMap));
      window.sessionStorage.setItem("practice_current_index", currentQuestionIndex);
    }
  }, [answerMap, currentQuestionIndex, testType, isRestoring, questions.length]);

  useEffect(() => {
  if (hasRestored.current) return;

  hasRestored.current = true;

  const restoreTest = async () => {
    if (userId && String(userId) !== String(id)) {
      router.replace(`/student/${userId}/dashboard`);
      return;
    }

    const username = window.sessionStorage.getItem("name");

    try {
      const test_submission_id =
        window.sessionStorage.getItem("test_submission_id");

      if (!test_submission_id) {
        throw new Error("No submission ID");
      }

      await dispatch(
        testInProgress({
          testId,
          test_submission_id,
          username,
        })
      ).unwrap();

      await dispatch(
        getQuestionForSection({
          testId,
          test_submission_id,
        })
      ).unwrap();
    } finally {
      setIsRestoring(false);
    }
  };

  restoreTest();
}, []);

  useEffect(() => {
  if (!isTimeUp) return;

  const finishSection = async () => {
    // 1. Save last answer
    await dispatch(
      saveAndMove({
        operation: "TIMEUP",
        questionIndex: -1,
      })
    ).unwrap();

    // 2. Skip section AFTER save
    await dispatch(
      sectionComplete({
        via: "TIMEUP",
      })
    ).unwrap();
  };

  finishSection();
}, [isTimeUp]);

  return (
    <Suspense fallback={<Loading />}>
      {isRestoring ? (
        <TestLoading />
      ) : questionsStatus === "idle" && (
        <div className="w-full h-screen mx-auto grid grid-cols-1 grid-rows-layout">
          <TestHeader />
          <main className="w-full max-h-full overflow-y-scroll py-3 lg:py-10 px-3">
            {isReviewPage ? (
              <ReviewComponent />
            ) : (
              <>
                {questions.length !== 0 ? <Question /> : <TestLoading />}

                {/* TIMEUP Modal */}
                <TimeupModal openModal={isTimeUp} />

                {/* Feedback Modal (conditionally triggered) */}

                {(() => {
                  // console.log("DEBUG → isTestCompleted:", isTestCompleted);
                  // console.log("DEBUG → isSectionCompleted:", isSectionCompleted);
                  // console.log("DEBUG → testSubmissionId:", testSubmissionId);
                  return testSubmissionId && (
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
                  );
                })()}
              </>
            )}
          </main>
          <TestFooter />
        </div>
      )}
    </Suspense>
  );
}

export default Page;
