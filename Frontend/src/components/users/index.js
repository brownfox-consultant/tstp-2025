"use client";

import { Tabs } from "antd";
import React from "react";
import UsersTab from "./users-tab";

function AdminUsersComponent() {
  const userTabItems = [
    {
      key: "all",
      label: "All Users",
      api: "/users/",
    },
    {
      key: "registered",
      label: "Registered Students",
      api: "/student/registered/",
    },
    {
      key: "upcoming",
      label: "Upcoming students subscriptions ",
      api: "/user/upcoming-subscription-or-free/",
    },

  ];
  return (
    <div className="flex flex-col gap-4 mb-3">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-800 m-0">Users</h1>
      </div>
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
