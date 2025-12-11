"use client";
import ActualTestComponent from "@/components/ActualTestComponent";
import { Suspense } from "react";
import TestLoading from "../../loading";

function page() {
  return (
    <Suspense fallback={<TestLoading />}>
      <div className="w-100 py-10 px-48">
        <ActualTestComponent />
      </div>
    </Suspense>
  );
}

export default page;
