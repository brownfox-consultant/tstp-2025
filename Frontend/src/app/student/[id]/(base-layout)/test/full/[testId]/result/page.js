"use client";

// import ViewResultComponent from "@/components/ViewResultComponent";
// import Report from "@/components/report-module";
import ReportNew from "@/components/report-module/Report_New";
import React from "react";

function page({ params, searchParams }) {
  // Get test_submission_id from query parameter
  const testSubmissionId = searchParams?.test_submission_id;
  
  return <ReportNew testSubmissionId={testSubmissionId} />;
}

export default page;
