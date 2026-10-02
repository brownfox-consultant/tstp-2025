"use client";

import React from "react";
import { Tabs } from "antd";
import { useSearchParams, useRouter } from "next/navigation";
import TestList from "@/components/TestList";
import PracticeTestsList from "@/components/PracticeTestsList";

function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = searchParams.get("tab") || "full-length";

  const items = [
    {
      key: "full-length",
      label: "Full Length Tests",
      children: <TestList />,
    },
    {
      key: "practice",
      label: "Practice Questions",
      children: <PracticeTestsList />,
    },
  ];

  const handleTabChange = (key) => {
    router.replace(`?tab=${key}`);
  };

  return (
    <div className="w-full">
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={items}
        size="large"
        className="test-practice-tabs"
      />
    </div>
  );
}

export default Page;