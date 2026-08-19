"use client";
import ActualTestComponent from "@/components/ActualTestComponent";
import { Suspense } from "react";
import TestLoading from "../../loading";

function page() {
  return (
    <Suspense fallback={<TestLoading />}>
      <div className="max-w-7xl mx-auto p-10">
        <ActualTestComponent />
      </div>
    </Suspense>
  );
}

export default page;
