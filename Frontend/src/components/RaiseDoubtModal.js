
import { raiseDoubt } from "@/app/services/authService";
import { Button, Input, Modal, notification } from "antd";
import React, { useState } from "react";

const { TextArea } = Input;

function RaiseDoubtModal({
  test,
  question,
  section,
  course_subject,
  onSuccess,
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim()) {
      notification.warning({
        message: "Please enter your doubt.",
      });
      return;
    }

    setLoading(true);

    const payload = {
      test,
      question,
      description: value.trim(),
      course_subject,
      section,
    };

    try {
      await raiseDoubt(payload);

      setValue("");
      setOpen(false);

      notification.success({
        message: "Doubt submitted successfully!",
      });

      // Refresh question details in ReportTable.
      if (typeof onSuccess === "function") {
        await onSuccess();
      }
    } catch (err) {
      console.error("Failed to submit doubt:", err);

      notification.error({
        message: "Failed to submit doubt",
        description:
          err?.response?.data?.detail ||
          "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        type="primary"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        style={{
          backgroundColor: "#f97316",
          borderColor: "#f97316",
        }}
      >
        Raise a doubt
      </Button>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title="Raise a doubt"
        okText="Submit"
        onOk={handleSubmit}
        confirmLoading={loading}
        okButtonProps={{
          disabled: !value.trim(),
        }}
      >
        <TextArea
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What is your doubt?"
        />
      </Modal>
    </div>
  );
}

export default RaiseDoubtModal;
