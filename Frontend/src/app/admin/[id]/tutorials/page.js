"use client";

import MaterialsComponent from "@/components/MaterialsComponent";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

function page() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <>
      <div className="w-full">
        <div className="flex justify-between">
          <div className="text-xl font-bold mb-2">Tutorials List</div>
        </div>
        <MaterialsComponent />
      </div>
    </>
  );
}

export default page;
