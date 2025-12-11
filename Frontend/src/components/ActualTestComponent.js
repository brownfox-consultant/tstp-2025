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
} from "@/lib/features/test/testSlice";

import BreakTimer from "./test-module/break-timer";

import TestLoading from "@/app/student/[id]/(test-layout)/[testType]/[testId]/loading";

const ActualTestComponent = () => {
  const params = useParams();
  const router = useRouter();
  const { id, testId } = params;
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

  const { goFullScreen, isFullScreen } = useFullScreen();
  const dispatch = useDispatch();
  let d1 = new Date();

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
  const test_submission_id = window?.sessionStorage.getItem("test_submission_id");

  try {
    await dispatch(
      getQuestionForSection({ testId, test_submission_id })
    ).unwrap(); // <-- unwrap gives direct errors from rejectWithValue

    if (questionsStatus === "idle") {
      router.replace(`/student/${id}/test/${testId}/`);
      dispatch(setTestRunning(true));
    }

    if (mode !== "AUTO" && !isFullScreen) {
      goFullScreen();
    }

  } catch (errorMsg) {
    Modal.error({
      title: "Section Load Failed",
      content: errorMsg, // e.g. "Not enough active questions. Required: 20, Available: 4"
    });
  }
};

  if (status == "idle") {
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
              {isTestRunning &&
                currentArraySectionIndex > 0 &&
                currentArraySectionIndex < totalSections && (
                  <BreakTimer
                    onExpire={() => handleStart("AUTO")}
                    expiryTimestamp={new Date(d1.getTime() + breakTimer * 1000)}
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
    router.replace(`/student/${id}/dashboard`);
  } else {
    return <TestLoading />;
  }
};

export default ActualTestComponent;
