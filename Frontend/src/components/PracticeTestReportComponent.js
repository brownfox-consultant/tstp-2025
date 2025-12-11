"use client";

import PracticeTestReport from "@/components/report-module/practice-test-report";

import React, { useEffect, useState } from "react";

function PracticeTestReportComponent({ practice_test_id }) {
  return <PracticeTestReport practice_test_id={practice_test_id} />;
}

export default PracticeTestReportComponent;
