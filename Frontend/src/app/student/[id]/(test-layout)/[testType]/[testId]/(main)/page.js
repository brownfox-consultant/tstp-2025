"use client";

import Question from "@/components/test-module/question";
import ReviewComponent from "@/components/test-module/review-component";
import TimeupModal from "@/components/test-module/timeup-modal";
import { saveAndMove } from "@/lib/features/test/testSlice";
import { useParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import TestLoading from "../loading";
import useFullScreen from "@/utils/useFullScreen";
import TestFeedbackModal from "@/components/test-module/test-feedback-modal";
import Loading from "@/app/student/[id]/(base-layout)/loading";
import TestFooter from "@/components/test-module/footer";
import TestHeader from "@/components/test-module/header";

function Page() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { id, testType, testId } = useParams();
  const { exitFullScreen } = useFullScreen();

  const questions = useSelector((state) => state.test.questions);
  const questionsStatus = useSelector((state) => state.test.questionsStatus);
  const isTimeUp = useSelector((state) => state.test.isTimeUp);
  const isTestCompleted = useSelector((state) => state.test.isTestCompleted);
  const isSectionCompleted = useSelector((state) => state.test.isSectionCompleted);
  const testSubmissionId = useSelector((state) => state.test.testSubmissionId);
  const isReviewPage = useSelector((state) => state.test.isReviewPage);

  // Redirect if questions are missing

  useEffect(() => {
  console.log("Redux state updated:");
  console.log("isTestCompleted:", isTestCompleted);
  console.log("isSectionCompleted:", isSectionCompleted);
}, [isTestCompleted, isSectionCompleted]);

  useEffect(() => {
    if (questions.length === 0 && !isSectionCompleted) {
      router.replace(
        testType === "practice"
          ? `/student/${id}/test/practice/create`
          : `/student/${id}/full/${testId}/begin`
      );
    }
  }, [questions, isSectionCompleted]);

  // Proper TIMEUP dispatch
  useEffect(() => {
    if (isTimeUp) {
      (async () => {
        await dispatch(
          saveAndMove({
            operation: "TIMEUP",
            questionIndex: -1,
          })
        ).unwrap();
      })();
    }
  }, [isTimeUp]);

  return (
    <Suspense fallback={<Loading />}>
      {questionsStatus === "idle" && (
        <div className="w-full h-screen mx-auto grid grid-cols-1 grid-rows-layout">
          <TestHeader />
          <main className="w-full max-h-full overflow-y-scroll py-10">
            {isReviewPage ? (
              <ReviewComponent />
            ) : (
              <>
                {questions.length !== 0 ? <Question /> : <TestLoading />}

                {/* TIMEUP Modal */}
                <TimeupModal openModal={isTimeUp} />
                
                  {/* Feedback Modal (conditionally triggered) */}
                  
                  {(() => {
  console.log("DEBUG → isTestCompleted:", isTestCompleted);
  console.log("DEBUG → isSectionCompleted:", isSectionCompleted);
  console.log("DEBUG → testSubmissionId:", testSubmissionId);
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
