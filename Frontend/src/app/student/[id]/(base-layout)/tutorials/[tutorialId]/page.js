"use client";

import ViewMaterial from "@/components/ViewMaterial";
import { LeftOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useRouter } from "next/navigation";
import React from "react";

function page() {
  const router = useRouter();
  return (
    <div className="w-full">
      <div className="flex justify-between">
        <div className="text-2xl font-semibold">
          <LeftOutlined onClick={() => router.back()} /> Tutorial
        </div>
      </div>
      <ViewMaterial />
    </div>
  );
}

export default page;
