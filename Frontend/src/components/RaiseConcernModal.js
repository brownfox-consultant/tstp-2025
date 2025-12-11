import { raiseConcern, raiseIssue } from "@/app/services/authService";
import { Button, Input, Modal, notification } from "antd";
import React, { useState } from "react";
const { TextArea } = Input;

function RaiseConcernModal({ updated, setUpdated }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = () => {
    setLoading(true);
    let payload = {
      description: value,
    };
    raiseConcern(payload)
      .then((res) => {
        setUpdated(!updated);
        setValue();
        setOpen(false);
        notification.success({
          message: "Concern raised.",
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
        Raise a concern
      </Button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title="Raise a concern"
        okText="Submit"
        onOk={handleSubmit}
        okButtonProps={{ loading: loading, disabled: !value }}
      >
        <TextArea
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What is your concern?"
        ></TextArea>
      </Modal>
    </div>
  );
}

export default RaiseConcernModal;
