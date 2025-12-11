import { Button, Modal } from "antd";
import React, { useState } from "react";
import Report from "./report-module";
import ReportNew from "./report-module/Report_New";

function ViewResultModal({ studentId, studentName, testSubmissionId }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} type="primary">
        View Result
      </Button>
      <Modal
        width={1300}
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        style={{ top: "20px" }}
        bodyStyle={{
          padding: "1rem",
          overflowY: "auto", // Enable vertical scrolling
          maxHeight: "700px", // Set maximum height for the content area
        }}
      >
        {/* <ViewResultComponent
          studentId={studentId}
          studentName={studentName}
          isAdmin={true}
          testSubmissionId={testSubmissionId}
        /> */}
        <ReportNew testSubmissionId={testSubmissionId} isAdmin={true} />
      </Modal>
    </>
  );
}

export default ViewResultModal;
