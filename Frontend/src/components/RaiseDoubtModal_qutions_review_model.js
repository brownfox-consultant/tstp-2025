// components/RaiseDoubtModal.jsx
import React, { useState } from "react";
import { Modal, Input, notification } from "antd";
import { raiseDoubt } from "@/app/services/authService";

const { TextArea } = Input;

function RaiseDoubtModal({ open, onClose, question, section, course_subject, test }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim()) {
      return notification.warning({ message: "Please enter your doubt." });
    }

    setLoading(true);

    try {
      await raiseDoubt({
        question,
        section,
        course_subject,
        test,
        description: value,
      });

      notification.success({ message: "Doubt submitted successfully!" });
      setValue("");
      onClose(); // Close the modal after success
    } catch (error) {
      console.error("Error submitting doubt:", error);
      notification.error({ message: "Failed to raise doubt. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      title="Raise a Doubt"
      okText="Submit"
      okButtonProps={{ loading }}
    >
      <TextArea
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What is your doubt or concern about this question?"
      />
    </Modal>
  );
}

export default RaiseDoubtModal;
