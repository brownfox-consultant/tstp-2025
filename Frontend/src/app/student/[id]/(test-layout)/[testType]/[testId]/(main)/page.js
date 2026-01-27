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

function Page() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { id, testType, testId } = useParams();
  const { exitFullScreen } = useFullScreen();
  const { userId } = useGlobalContext();

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
    const restoreTest = async () => {
      // IDOR Protection: Ensure user accessing the test matches logged-in user
      if (userId && String(userId) !== String(id)) {
        router.replace(`/student/${userId}/dashboard`);
        return;
      }

      if (questions.length === 0 && !isSectionCompleted) {
        const username = window?.sessionStorage.getItem("name");
        
        try {
          if (testType === "practice") {
            const storedPracticeIds = window?.sessionStorage.getItem("practice_question_ids");
            const storedTimer = window?.sessionStorage.getItem("timer");
            const storedAnswers = window.sessionStorage.getItem("practice_answers");
            const storedIndex = window.sessionStorage.getItem("practice_current_index");

            if (storedPracticeIds) {
              const parsedIds = JSON.parse(storedPracticeIds);
              dispatch(fetchMultipleQuestionDetails(parsedIds));
              dispatch(setTestDetails({
                testId: testId,
                time: JSON.parse(storedTimer),
                testType: "practice"
              }));

              if (storedAnswers) {
                dispatch(setAnswerMap(JSON.parse(storedAnswers)));
              }
              if (storedIndex) {
                dispatch(setCurrentQuestionIndex(Number(storedIndex)));
              }
            } else {
              throw new Error("No practice data");
            }
          } else {
            // Restore Full Length Test
            const test_submission_id = window?.sessionStorage.getItem("test_submission_id");
            if (test_submission_id) {
              await dispatch(testInProgress({ testId, test_submission_id, username })).unwrap();
              await dispatch(getQuestionForSection({ testId, test_submission_id })).unwrap();
            } else {
              throw new Error("No submission ID");
            }
          }
        } catch (error) {
          console.error("Auto-resume failed:", error);
          router.replace(
            testType === "practice"
              ? `/student/${id}/test/practice/create`
              : `/student/${id}/full/${testId}/begin`
          );
        } finally {
          setIsRestoring(false);
        }
      } else {
        setIsRestoring(false);
      }
    };

    restoreTest();
  }, [questions.length, isSectionCompleted, testType, testId, id, userId]);

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
