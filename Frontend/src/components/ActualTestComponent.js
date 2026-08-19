"use client";

import { Button, Col, Modal, Row, Steps, notification } from "antd";
import React, { useContext, useState, useEffect, Suspense } from "react";
import TestInfo from "./TestInfo";
import { useSelector } from "react-redux";
import { useParams, usePathname, useRouter } from "next/navigation";
import useFullScreen from "@/utils/useFullScreen";
import { useDispatch } from "react-redux";
import {
  testInProgress,
  getQuestionForSection,
  setTestRunning,
  clearSectionCompleted,
} from "@/lib/features/test/testSlice";

import BreakTimer from "./test-module/break-timer";

import TestLoading from "@/app/tstp/student/[id]/(test-layout)/[testType]/[testId]/loading";

let fsModalInstance = null;

const ActualTestComponent = () => {
  const params = useParams();
  const router = useRouter();
  const { id, testId, testType } = params;
  const pathname = usePathname();
  const [progressDataLoader, setProgressDataLoader] = useState(false);
  const currentArraySectionIndex = useSelector(
    (state) => state.test.currentArraySectionIndex
  );
  const courseName = useSelector((state) => state.test.courseName);
  const testName = useSelector((state) => state.test.name);
  const status = useSelector((state) => state.test.status);
  const questionsStatus = useSelector((state) => state.test.questionsStatus);
  const instructions = useSelector((state) => state.test.instructions);
  const isTestRunning = useSelector((state) => state.test.isTestRunning);
  const totalSections = useSelector((state) => state.test.totalSections);
  const breakTimer = useSelector((state) => state.test.breakTimer);
  const currentSectionName = useSelector(
    (state) => state.test.sectionOrderItems[currentArraySectionIndex]?.title
  );
  const [remainingBreak, setRemainingBreak] = useState(0);

const expiryTimestamp = React.useMemo(() => {
  return new Date(Date.now() + remainingBreak * 1000);
}, [remainingBreak]);

useEffect(() => {

  if (breakTimer <= 0) {
    setRemainingBreak(0);
    return;
  }

  const saved = localStorage.getItem("breakEndTime");

  if (saved) {

    const remaining = Math.max(
      Math.floor((Number(saved) - Date.now()) / 1000),
      0
    );

    if (remaining > 0) {
      setRemainingBreak(remaining);
      return;
    }

    localStorage.removeItem("breakEndTime");
  }

  const endTime = Date.now() + breakTimer * 1000;

  localStorage.setItem(
    "breakEndTime",
    endTime.toString()
  );

  setRemainingBreak(breakTimer);

}, [breakTimer]);

  // Prevent back navigation effectively — persists across refreshes
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





useEffect(() => {
  console.log("Timer effect started");

  const interval = setInterval(() => {
    const saved = localStorage.getItem("breakEndTime");

    console.log("Tick", saved);

    if (!saved) {
      console.log("No breakEndTime");
      return;
    }

    const remaining = Math.max(
      Math.floor((Number(saved) - Date.now()) / 1000),
      0
    );

    console.log("Remaining =", remaining);

    setRemainingBreak(remaining);

    if (remaining <= 0) {
      console.log("AUTO START");

      clearInterval(interval);

      localStorage.removeItem("breakEndTime");

      handleStart("AUTO");
    }
  }, 1000);

  return () => {
    console.log("Interval destroyed");
    clearInterval(interval);
  };
}, []);



  const { goFullScreen, isFullScreen } = useFullScreen();
  const dispatch = useDispatch();
  let d1 = new Date();

  useEffect(() => {
    // Only check fullscreen if we want to enforce it later, but not on the begin page immediately.
    // Fullscreen will be requested upon clicking 'Start'.
  }, []);

  useEffect(() => {
    (async () => {
      const test_submission_id =
        window?.sessionStorage.getItem("test_submission_id");
      const username = window?.sessionStorage.getItem("name");
      await dispatch(
        testInProgress({ testId, test_submission_id, username })
      ).unwrap();
    })();
  }, []);


  

 const handleStart = async (mode) => {
  console.log("handleStart called", mode);

  // Trigger fullscreen immediately synchronously on user click gesture
  if (mode !== "AUTO" && !isFullScreen) {
    goFullScreen();
  }

  const test_submission_id =
    window.sessionStorage.getItem("test_submission_id");

  try {
    console.log("Fetching next section...");
    await dispatch(
      getQuestionForSection({
        testId,
        test_submission_id,
      })
    ).unwrap();
    console.log("Next section fetched");
    dispatch(clearSectionCompleted());

    localStorage.removeItem("breakEndTime");
    setRemainingBreak(0);

    dispatch(setTestRunning(true));

    router.replace(`/tstp/student/${id}/test/${testId}/`);
  } catch (errorMsg) {
    Modal.error({
      title: "Section Load Failed",
      content: errorMsg,
    });
  }
};

  if (status == "idle") {
    console.log(
  "currentArraySectionIndex",
  currentArraySectionIndex,
  "currentSectionName",
  currentSectionName
);
console.log({
  breakTimer,
  remainingBreak,
  isTestRunning,
  currentArraySectionIndex,
  totalSections,
});
    return (
      <Suspense fallback={<TestLoading />}>
        <div className="w-full">
          <div>
            <div className="text-3xl font-bold mb-3">Test Details</div>
          </div>
        </div>
        <div className="grid grid-cols-2 px-2">
          <div className="col-span-2">Course: {courseName}</div>
          <div className="col-span-2">Test: {testName}</div>
        </div>
        <div className=" grid grid-cols-12 gap-6 w-full">
          <div className="md:col-span-5 col-span-12">
            <TestInfo />
          </div>
          <div className="hidden md:block w-0 border"></div>
          <div className="md:col-span-6 col-span-12 flex flex-col justify-between">
            <div className="flex-grow flex flex-col gap-5">
              <div className="text-2xl font-semibold mt-11 border-b">
                Instructions
              </div>
              <div dangerouslySetInnerHTML={{ __html: instructions }}></div>
            </div>
           
            <div className="w-full space-y-2 mb-10">
              <Button
                onClick={() => handleStart("MANUAL")}
                loading={progressDataLoader}
              >
                Start {currentSectionName}
              </Button>
              {remainingBreak > 0 && (
  <BreakTimer
    key={remainingBreak}
    expiryTimestamp={expiryTimestamp}
    onExpire={() => {
      localStorage.removeItem("breakEndTime");
    }}
  />
)}
              {/* <BreakTimer
                onExpire={() => alert("Hello")}
                expiryTimestamp={new Date(d1.getTime() + 1000 * 1000)}
              /> */}
            </div>
          </div>
        </div>
      </Suspense>
    );
  } else if (status == "error") {
    router.replace(`/tstp/student/${id}/dashboard`);
  } else {
    return <TestLoading />;
  }
};

export default ActualTestComponent;
