import { raiseDoubt } from "@/app/services/authService";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Input, Modal, notification } from "antd";
import React, { useState } from "react";
const { TextArea } = Input;

function RaiseDoubtModal({ test, question, section, course_subject }) {
  console.log("test, question, section, course_subject",test, question, section, course_subject)
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
          message: "Doubt raised.",
        });
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        type="primary"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
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
