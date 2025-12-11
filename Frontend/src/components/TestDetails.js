import { Descriptions, Tabs } from "antd";
import React from "react";

import { usePathname, useRouter } from "next/navigation";
import { LeftOutlined } from "@ant-design/icons";

import StudentsTestTable from "./StudentsTestTable";
import TestSubjectInfo from "./TestSubjectInfo";

function TestDetails({
  testDetails,
  updated,
  setUpdated,
  testReady,
  setTestReady,
}) {
  const router = useRouter();
  const role = usePathname().split("/")[1];
  const generalTabItems = [
    {
      key: "1",
      label: "Subjects",
      children: (
        <TestSubjectInfo
          testDetails={testDetails}
          setTestReady={setTestReady}
          updated={updated}
          setUpdated={setUpdated}
        />
      ),
    },
    {
      key: "2",
      label: "Students",
      children: (
        <StudentsTestTable testDetails={testDetails} testReady={testReady} />
      ),
    },
  ];

  const mentorTabItems = [
    {
      key: "2",
      label: "Students",
      children: <StudentsTestTable testReady={testReady} />,
    },
  ];

  let tabItems = role == "mentor" ? mentorTabItems : generalTabItems;

  const items = [
    {
      key: "1",
      label: "Course Name",
      children: testDetails["course_name"],
    },
    // {
    //   key: "2",
    //   label: "Test Type",
    //   children: (
    //     <span className="capitalize">
    //       {testDetails["test_type"].toLowerCase()}
    //     </span>
    //   ),
    // },
    {
      key: "3",
      label: "Test Format",
      children: (
        <span className="capitalize">
          {testDetails["format_type"].toLowerCase()}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="text-xl font-bold flex align-middle">
        <LeftOutlined
          className="mr-2 text-base hover:font-extrabold cursor-pointer"
          onClick={() => router.back()}
        />{" "}
        {testDetails["name"]}
      </div>
      <Descriptions className="mt-3" items={items} />
      <Tabs items={tabItems} defaultActiveKey=""></Tabs>
    </>
  );
}

export default TestDetails;
