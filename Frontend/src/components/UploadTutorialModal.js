import { Modal } from "antd";
import React, { useState } from "react";
import MaterialForm from "./MaterialForm";

function UploadTutorialModal({ isVisible, onClose, course_subject, subject,material  }) {
  const [open, setOpen] = useState(true);

  function handleClose() {
    console.log("Course Subject", course_subject, subject);
    setOpen(false);
  }
  console.log("props", isVisible);
  return (
    <>
      <Modal
        width={900}
        onCancel={onClose}
        open={isVisible}
        title={<div className="w-4/6"></div>}
        footer={null}
        className="mt-0"
        style={{ marginTop: "-50px" }}
      >
        <MaterialForm course_subject={course_subject} onClose={onClose} material={material} />
      </Modal>
    </>
  );
}

export default UploadTutorialModal;
