import { raiseDoubt, raiseFeedback } from "@/app/services/authService";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Input, Modal, notification } from "antd";
import React, { useState } from "react";
const { TextArea } = Input;

function RaiseFeedback({ student }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = () => {
    setLoading(true);
    let payload = {
      student: student.id,
      description: value,
    };
    raiseFeedback(payload)
      .then((res) => {
        setValue();
        setOpen(false);
        notification.success({
          message: "Feedback raised.",
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
        Give Feedback
      </Button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title={`Give Feedback for ${student.name}`}
        okText="Submit"
        onOk={handleSubmit}
        okButtonProps={{ loading: loading }}
      >
        <TextArea
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write your feedback here"
        ></TextArea>
      </Modal>
    </div>
  );
}

export default RaiseFeedback;
