import { EditOutlined } from "@ant-design/icons";
import { Modal, Popover } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useState } from "react";
import "react-quill/dist/quill.snow.css";

import EditQuestionForm from "./EditQuestionForm";

function QuestionEditModal({
  data,
  courseSubId = null,
  updated,
  setUpdated,
  role,
  topicOptions,
  icon,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const [form] = useForm();

  let subTopicOptions = topicOptions?.find(
    (topic) => topic.name == data.topic
  )?.subtopics;

  return (
    <div>
      <Popover
        content={
          role == "admin"
            ? "Edit Question"
            : data.has_suggestion
            ? "Cannot edit question until existing suggested changes are approved or rejected"
            : "Suggest changes"
        }
      >
        <EditOutlined
          onClick={() => {
            if (role != "admin" && data.has_suggestion) {
            } else {
              setIsOpen(true);
            }
          }}
        />
      </Popover>
      <Modal
        open={isOpen}
        title={
          <div className="text-xl mb-5">
            {role == "admin" ? `Edit Question` : "Suggest changes to question"}
          </div>
        }
        onCancel={() => setIsOpen(false)}
        width={1200}
        footer={null}
      >
        <EditQuestionForm
          initialValues={data}
          action="edit"
          topicOptionsParam={topicOptions}
          subTopicOptionsParam={subTopicOptions}
          role={role}
          updated={updated}
          setUpdated={setUpdated}
          courseSubId={courseSubId}
          closeModal={() => setIsOpen(false)}
        />
      </Modal>
    </div>
  );
}

export default QuestionEditModal;
