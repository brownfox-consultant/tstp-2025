import React from "react";
import FullLengthTestTable from "./full-length-test.js";
import SelfPracticeTestTable from "./self-practice-test.js";

function TestsTab({ tabKey, api }) {
  return (
    <>
      {" "}
      {tabKey == "full" && <FullLengthTestTable tabKey={tabKey} api={api} />}
      {tabKey == "self" && <SelfPracticeTestTable tabKey={tabKey} api={api} />}
    </>
  );
}

export default TestsTab;
