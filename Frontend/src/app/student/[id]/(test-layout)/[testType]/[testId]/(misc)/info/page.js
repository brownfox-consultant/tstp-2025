"use client";
import { Button } from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import TestLoading from "../../loading";
import { useSelector } from "react-redux";
import Loading from "@/app/(auth)/loading";

function page() {
  const router = useRouter();
  const { id, testId, testType } = useParams();
  console.log("id, testId", id, testId, testType);
  const questionsStatus = useSelector((state) => state.test.questionsStatus);
  const currentArraySectionIndex = useSelector(
    (state) => state.currentArraySectionIndex
  );
  const instructions = useSelector((state) => state.test.instructions);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // 2.5 seconds

    return () => clearTimeout(timer); // Clear the timer if the component unmounts
  }, []);

  if (isLoading) {
    return <TestLoading />; // Show your loading component
  }

  return (
    <Suspense fallback={<TestLoading />}>
      <div className=" h-screen p-10">
        <div className="mx-auto min-w-min max-w-6xl border p-5 flex flex-col h-full justify-between place-items-center">
          <div className=" flex-grow flex flex-col justify-center gap-5">
            <div className="text-3xl font-bold text-center">Instructions</div>
            <div dangerouslySetInnerHTML={{ __html: instructions }}></div>
          </div>
          <Button
            className="w-fit"
            onClick={() =>
              router.replace(`/student/${id}/${testType}/${testId}`)
            }
            loading={questionsStatus !== "idle"}
          >
            {currentArraySectionIndex == 0 ? "Start Test" : "Continue Test"}
          </Button>
        </div>
      </div>
    </Suspense>
  );
}

export default page;
