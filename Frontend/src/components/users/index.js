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
    <div className="flex flex-col gap-2 mb-3">
      <div className="text-xl font-bold">Users</div>
      <div className="w-full">
        <Tabs
          defaultActiveKey="2"
          items={userTabItems.map((item) => {
            return {
              key: item.key,
              label: <div>{item.label}</div>,
              children: <UsersTab tabKey={item.key} api={item.api} />,
            };
          })}
        />
      </div>
    </div>
  );
}

export default AdminUsersComponent;
