import { raiseIssue } from "@/app/services/authService";
import { Button, Input, Modal, notification } from "antd";
import React, { useState } from "react";
const { TextArea } = Input;

function RaiseIssueModal({ updated, setUpdated }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = () => {
    setLoading(true);
    let payload = {
      description: value,
    };
    raiseIssue(payload)
      .then((res) => {
        setUpdated(!updated);
        setValue();
        setOpen(false);
        notification.success({
          message: "Issue raised.",
        });
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  };

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ marginTop: "25px" }}>
      <Button
        type="primary"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        Raise an issue
      </Button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title="Raise an issue"
        bodyStyle={{ height: "150px", overflowY: "auto" }}
        footer={[
          <div key="footer" style={{ display: "flex", width: "100%" }}>
            <Button
              key="cancel"
              onClick={() => setOpen(false)}
              style={{ flex: 1, marginRight: "8px" }}
            >
              Cancel
            </Button>
            <Button
              key="add"
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={!value}
              style={{ flex: 1 }}
            >
              Add
            </Button>
          </div>,
        ]}
      >
        <h3 className="mb-2">What is the issue?</h3>
        <TextArea
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          //placeholder="What is the issue?"
        ></TextArea>
      </Modal>
    </div>
  );
}

export default RaiseIssueModal;
