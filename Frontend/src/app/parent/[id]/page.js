"use client";

import ProfileComponent from "@/components/ProfileComponent";

function page() {
  return (
    <div className="flex flex-col space-y-5 items-center">
      <ProfileComponent />
    </div>
  );

  // return <Tabs items={tabItems} defaultActiveKey="1" />;
}

export default page;
