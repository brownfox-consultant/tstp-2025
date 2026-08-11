"use client";

import { Tabs } from "antd";
import React from "react";
import UsersTab from "./users-tab";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "antd";
import TestList_admin_user from "../TestList_admin_user";
import PracticeTestsList_admin_uer from "@/components/PracticeTestsList_admin_uer";
import { ArrowLeftOutlined } from "@ant-design/icons";

function AdminUsersComponent() {
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const studentIdParam = searchParams.get("studentId");
  const studentNameParam = searchParams.get("studentName");
  const router = useRouter();
  const pathname = usePathname();

  const userTabItems = [
    {
      key: "all",
      label: "All Users",
      api: "/users/",
    },
    // {
    //   key: "registered",
    //   label: "Registered Students",
    //   api: "/student/registered/",
    // },
    {
      key: "upcoming",
      label: "Upcoming students subscriptions ",
      api: "/user/upcoming-subscription-or-free/",
    },
  ];

  if (actionParam === "viewStudentResults" && studentIdParam) {
    return (
      <div className="pb-10 animate-fadeIn">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-[#2E2725] m-0 flex items-center gap-2">
            Test Report - {studentNameParam || "Student"}
          </h1>
          <Button
            onClick={() => {
              const urlParams = new URLSearchParams(searchParams);
              urlParams.delete("action");
              urlParams.delete("studentId");
              urlParams.delete("studentName");
              router.push(`${pathname}?${urlParams.toString()}`);
            }}
            className="flex items-center gap-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all border-gray-200 hover:border-gray-300"
            size="large"
          >
            <ArrowLeftOutlined className="text-[15px]" /> Back to Users
          </Button>
        </div>

        <div className="bg-white px-4 md:px-6 pb-4 md:pb-6 pt-0 md:pt-0 rounded-2xl shadow-sm border border-gray-100 min-h-[70vh]">
          <Tabs
            defaultActiveKey="1"
            tabBarStyle={{ marginBottom: '8px' }}
            items={[
              {
                key: "2",
                label: "Full Length Tests",
                children: <TestList_admin_user studentId={studentIdParam} />,
              },
              {
                key: "1",
                label: "Practice Questions",
                children: (
                  <PracticeTestsList_admin_uer studentId={studentIdParam} />
                ),
              },
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col -mt-4">
      {/* <div className="flex items-center">
        <h1 className="text-2xl font-bold text-gray-800 m-0">Users</h1>
      </div> */}
      <div className="w-full">
        <Tabs
          defaultActiveKey="all"
          items={userTabItems.map((item) => {
            return {
              key: item.key,
              label: <div className="font-medium">{item.label}</div>,
              children: <UsersTab tabKey={item.key} api={item.api} />,
            };
          })}
        />
      </div>
    </div>
  );
}

export default AdminUsersComponent;
