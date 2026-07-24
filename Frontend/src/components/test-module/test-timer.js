"use client";

import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTimer } from "react-timer-hook";
import {
  setTimeAsUp,
  toggleShowTime,
  setLastRecordedTime,
} from "@/lib/features/test/testSlice";
import { formatTimeToString } from "@/utils/utils";
import { ClockCircleOutlined } from "@ant-design/icons";
import { insideAuthInstance } from "@/lib/AxiosInstance";

import useNetworkStatus from "@/utils/useNetworkStatus";

export function TestTimer({ expiryTimestamp }) {
  const dispatch = useDispatch();

  const showTime = useSelector((state) => state.test.showTime);
  const testState = useSelector((state) => state.test);
  const isOnline = useNetworkStatus();

  const {
    totalSeconds,
    seconds,
    minutes,
    isRunning,
    pause,
    resume,
  } = useTimer({
    expiryTimestamp,
    onExpire: () => dispatch(setTimeAsUp()),
  });

  useEffect(() => {
    if (!isOnline) {
      pause();
    } else if (isOnline && !isRunning) {
      resume();
    }
  }, [isOnline]);

  const remainingRef = useRef(totalSeconds);

  useEffect(() => {
    remainingRef.current = totalSeconds;
  }, [totalSeconds]);

  useEffect(() => {
    if (isRunning) {
      dispatch(setLastRecordedTime());
    }
  }, [isRunning, dispatch]);

  useEffect(() => {
    if (!isRunning) return;

    console.log("Time Sync Started");

    const interval = setInterval(async () => {
      try {
        const totalDuration =
  testState.sectionOrderItems?.[
    testState.currentArraySectionIndex
  ]?.duration * 60;

        const elapsedTime = totalDuration - remainingRef.current;

        console.log("SYNC", {
          remaining: remainingRef.current,
          elapsed: elapsedTime,
        });
        console.log({
  submission: testState.testSubmissionId,
  courseSubject: testState.courseSubject,
  section: testState.sectionId,
  duration:
    testState.sectionOrderItems?.[
      testState.currentArraySectionIndex
    ]?.duration,
});

        await insideAuthInstance.post(
          `/test/${testState.testId}/sync-time/`,
          {
            test_submission_id: testState.testSubmissionId,
            course_subject_id: testState.courseSubject,
            section_id: testState.sectionId,
            time_taken: elapsedTime,
          }
        );
      } catch (err) {
        console.error(err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [
    
  isRunning,
  testState.testId,
  testState.testSubmissionId,
  testState.courseSubject,
  testState.sectionId,
  testState.currentArraySectionIndex,
  testState.sectionOrderItems,

  ]);

  useEffect(() => {
    const saveTime = () => {
      const totalDuration =
  testState.sectionOrderItems?.[
    testState.currentArraySectionIndex
  ]?.duration * 60;

      const elapsedTime = totalDuration - remainingRef.current;

      navigator.sendBeacon(
        `${process.env.NEXT_PUBLIC_API_URL}/api/test/${testState.testId}/sync-time/`,
        new Blob(
          [
            JSON.stringify({
              test_submission_id: testState.testSubmissionId,
              course_subject_id: testState.courseSubject,
              section_id: testState.sectionId,
              time_taken: elapsedTime,
            }),
          ],
          {
            type: "application/json",
          }
        )
      );
    };

    window.addEventListener("beforeunload", saveTime);
    window.addEventListener("pagehide", saveTime);

    return () => {
      window.removeEventListener("beforeunload", saveTime);
      window.removeEventListener("pagehide", saveTime);
    };
  }, [
    testState.testId,
    testState.testSubmissionId,
    testState.courseSubjectId,
    testState.sectionId,
    testState.sectionDuration,
  ]);

  return (
    <div className="flex flex-row items-center justify-center gap-2">
      <div className="text-lg">
        {showTime ? (
          <>
            <span>{formatTimeToString(minutes)}</span>:
            <span>{formatTimeToString(seconds)}</span>
          </>
        ) : (
          <ClockCircleOutlined />
        )}
      </div>

      <button
        onClick={() => dispatch(toggleShowTime(!showTime))}
        className="text-sm font-semibold border border-slate-200 px-3 py-1 rounded"
      >
        {showTime ? "Hide" : "Show"}
      </button>
    </div>
  );
}