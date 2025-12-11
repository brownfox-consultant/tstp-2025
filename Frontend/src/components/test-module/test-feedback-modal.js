import { postTestFeedback } from "@/app/services/authService";
import { Modal, Radio ,notification} from "antd";
import TextArea from "antd/es/input/TextArea";
import React, { useState } from "react";

function TestFeedbackModal({ test_submission_id, modalOpen = false, onClose }) {
  const [rating, setRating] = useState();
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit() {
    setLoading(true);
    let payload = {
      test_submission: test_submission_id,
      rating,
      description: feedback,
    };
    console.log("payload", payload);
    postTestFeedback(payload)
      .then((res) => {
        setRating(undefined);
        setFeedback("");
        notification.success({
          message: "Thank you for your feedback!",
        });
      })
      .catch((err) => console.log(err))
      .finally(() => {
        setLoading(false);
        onClose();
      });
  }
  return (
    <div>
      <Modal
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => onClose()}
        okButtonProps={{
          loading: loading,
        }}
        cancelText="Skip now"
        okText="Submit"
        title="Tell us what you think"
      >
        <p className="my-2">How was your experience taking the test today?</p>
        <Radio.Group
  value={rating}
  onChange={(e) => {
    setRating(e.target.value);
  }}
>
  {Array.from({ length: 10 }).map((_, index) => (
    <Radio.Button key={index} value={index + 1}>
      {index + 1}
    </Radio.Button>
  ))}
</Radio.Group>
        <p className="mt-4 mb-2">
          How was your experience taking the Digital SAT Diagnostic Test Today ?
        </p>
        <TextArea
          rows={4}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Type your feedback here..."
        ></TextArea>
      </Modal>
    </div>
  );
}

export default TestFeedbackModal;
