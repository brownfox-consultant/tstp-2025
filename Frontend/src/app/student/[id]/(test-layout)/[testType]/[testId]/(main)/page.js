"use client";

import Question from "@/components/test-module/question";
import ReviewComponent from "@/components/test-module/review-component";
import TimeupModal from "@/components/test-module/timeup-modal";
import { saveAndMove, testInProgress,sectionComplete, getQuestionForSection, fetchMultipleQuestionDetails, setTestDetails, setAnswerMap, setCurrentQuestionIndex } from "@/lib/features/test/testSlice";
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
import NetworkOfflineModal from "@/components/test-module/network-offline-modal";
import { useRef } from "react";

function Page() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { id, testType, testId } = useParams();
  const { exitFullScreen } = useFullScreen();
  const { userId } = useGlobalContext();
  const hasRestored = useRef(false);

  // Prevent back navigation effectively — active from mount (including after refresh)
  useEffect(() => {
    if (testType === "practice") {
      return; // Allow going back in practice mode
    }

    // Push an initial guard entry
    window.history.pushState({ backGuard: true }, null, window.location.href);
    
    const handlePopState = (e) => {
      // Re-push the guard entry so the next back-press is also blocked
      window.history.pushState({ backGuard: true }, null, window.location.href);
      // Auto-enter fullscreen if not already in fullscreen
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [testType]);

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

  if (testType === "practice") {
    setIsRestoring(false);
    return;
  }

  const username = window.sessionStorage.getItem("name");
  const test_submission_id =
    window.sessionStorage.getItem("test_submission_id");

  if (!test_submission_id) {
    setIsRestoring(false);
    return;
  }

  try {
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
    await dispatch(
      saveAndMove({
        operation: "TIMEUP",
        questionIndex: -1,
      })
    ).unwrap();

   if (testType === "practice") {
  

  router.replace(
    `/student/${id}/test/practice/${testId}/result`
  );

  return;
}

await dispatch(
  sectionComplete({
    via: "TIMEUP",
  })
).unwrap();
  };

  finishSection();
}, [isTimeUp, testType]);

  return (
    <Suspense fallback={<Loading />}>
      <NetworkOfflineModal />
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
                  return (
  testType !== "practice" &&
  testSubmissionId && (
    <TestFeedbackModal
      modalOpen={isTestCompleted && isSectionCompleted}
      test_submission_id={testSubmissionId}
      onClose={() => {
        exitFullScreen();

        router.replace(
          `/student/${id}/test/full/${testId}/result?test_submission_id=${testSubmissionId}`
        );
      }}
    />
  )
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
