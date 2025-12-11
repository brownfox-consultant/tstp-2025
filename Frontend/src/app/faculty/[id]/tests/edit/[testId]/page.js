"use client";
import { getTestDetails } from "@/app/services/authService";
import TestDetails from "@/components/TestDetails";
import { Button, Skeleton } from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

function page() {
  const { id, testId } = useParams();
  const router = useRouter();
  const [testDetails, setTestDetails] = useState(null);
  const [updated, setUpdated] = useState(false);
  const [testReady, setTestReady] = useState(false);
  useEffect(() => {
    getTestDetails(testId).then((res) => {
      setTestDetails(res.data);
      window.sessionStorage.setItem(
        `test-${res.data.id}`,
        JSON.stringify(res.data)
      );
    });
  }, [updated]);
  return (
    <Skeleton loading={!testDetails}>
      <TestDetails
        testDetails={testDetails}
        updated={updated}
        setUpdated={setUpdated}
        testReady={testReady}
        setTestReady={setTestReady}
      />
    </Skeleton>
  );
}

export default page;
