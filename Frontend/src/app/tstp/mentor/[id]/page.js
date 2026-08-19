"use client";

import ProfileComponent from "@/components/ProfileComponent";

function page() {
  // const tabItems = [
  //   {
  //     label: (
  //       <span>
  //         <ProfileOutlined /> Profile
  //       </span>
  //     ),
  //     key: 1,
  //     children: <ProfileComponent />,
  //   },
  //   {
  //     label: (
  //       <span>
  //         <LockOutlined /> Change Password
  //       </span>
  //     ),
  //     key: 2,
  //     children: <ChangePassword />,
  //   },
  // ];
  return (
    <div className="flex flex-col space-y-5 items-center">
      <ProfileComponent />
    </div>
  );

  // return <Tabs items={tabItems} defaultActiveKey="1" />;
}

export default page;
