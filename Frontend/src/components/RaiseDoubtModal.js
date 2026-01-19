import { raiseDoubt } from "@/app/services/authService";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Input, Modal, notification } from "antd";
import React, { useState } from "react";
const { TextArea } = Input;

function RaiseDoubtModal({ test, question, section, course_subject }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = () => {
    setLoading(true);
    let payload = {
      test,
      question,
      description: value,
      course_subject,
      section,
    };
    raiseDoubt(payload)
      .then((res) => {
        setValue();
        setOpen(false);
        notification.success({
          message: "Doubt submitted successfully!",
        });
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
      >
        Raise a doubt
      </button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title="Raise a doubt"
        okText="Submit"
        onOk={handleSubmit}
        okButtonProps={{ loading: loading }}
      >
        <TextArea
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What is your doubt?"
        ></TextArea>
      </Modal>
    </div>
  );
}

export default RaiseDoubtModal;
