"use client";

import ViewResultComponent from "@/components/ViewResultComponent";
import Report from "@/components/report-module";
import ReportNew from "@/components/report-module/Report_New";
import React from "react";

function page({ params }) {
  // return <ViewResultComponent />;
  return <ReportNew testSubmissionId={params.testId} />;
}

export default page;
