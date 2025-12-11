"use client";

import { Tabs } from "antd";
import React from "react";
import TestsTab from "./tests-tab.js";
import { useSearchParams } from "next/navigation";
import  { useEffect, useState } from "react";

function StudentTestsComponent() {

  const searchParams = useSearchParams();
  const [activeKey, setActiveKey] = useState("full");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "self") {
      setActiveKey("self");
    } else {
      setActiveKey("full");
    }
    console.log(activeKey)
  }, [searchParams]);

  const testsTabItems = [
    {
      key: "full",
      label: "Full Length Tests",
      api: "/users/",
    },
    {
      key: "self",
      label: "Practice Questions",
      api: "/student/registered/",
    },
  ];
  return (
    <div className="flex flex-col gap-2 mb-3">
      <div className="text-xl font-bold">Tests</div>
      <div className="w-full">
      <Tabs
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key)}
          items={testsTabItems.map((item) => ({
            key: item.key,
            label: <div>{item.label}</div>,
            children: <TestsTab tabKey={item.key} api={item.api} />,
          }))}
        />
      </div>
    </div>
  );
}

export default StudentTestsComponent;
