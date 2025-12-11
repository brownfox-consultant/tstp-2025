import Loading from "@/app/loading";
import PracticeTestForm from "@/components/PracticeTestForm";
import React, { Suspense } from "react";

function page() {
  return (
    <Suspense fallback={<Loading />}>
      <PracticeTestForm />
    </Suspense>
  );
}

export default page;
