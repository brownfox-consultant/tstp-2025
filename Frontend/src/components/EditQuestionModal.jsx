"use client";

import React from "react";
import { Modal } from "antd";
import { EditOutlined, CloseOutlined } from "@ant-design/icons";
import EditQuestionForm from "./EditQuestionForm";

function EditQuestionModal({
  open,
  setOpen,
  editQuestionData,
  setEditQuestionData,
  topicOptions,
  role,
  updated,
  setUpdated,
}) {

  const handleClose = () => {
    setOpen(false);
    setEditQuestionData(null);
  };

  return (
    <Modal
      open={open}
      footer={null}
      width={1300}
      onCancel={handleClose}   // ⭐ IMPORTANT
      closable={false}
      destroyOnClose
      styles={{
        content: { borderRadius: "16px", overflow: "hidden" },
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <EditOutlined className="text-[#F59405] text-xl" />
          </div>

          <div>
            <h2 className="text-xl font-bold m-0">Edit Question</h2>
            <p className="text-gray-500 text-sm m-0">
              <p className="text-gray-500 text-sm m-0">
  Sr No: {editQuestionData?.srno} | Topic: {editQuestionData?.topic_name || editQuestionData?.topic}
</p>
            </p>
          </div>
        </div>

        <button
          onClick={handleClose}   // ⭐ IMPORTANT
          className="w-8 h-8 hover:bg-gray-200 flex items-center justify-center rounded-md"
        >
          <CloseOutlined />
        </button>
      </div>

      {/* Form */}
      <div className="p-4 max-h-[70vh] overflow-y-auto bg-gray-50">
        {editQuestionData && (
          <EditQuestionForm
            key={editQuestionData?.id}
            initialValues={editQuestionData}
            action="edit"
            topicOptionsParam={topicOptions}
            subTopicOptionsParam={
              topicOptions.find(
                (t) => t.id === editQuestionData.topic
              )?.subtopics || []
            }
            courseSubId={
              editQuestionData.course_subject ||
              editQuestionData.course_subject_id
            }
            role={role}
            updated={updated}
            setUpdated={setUpdated}
            closeModal={handleClose}   // ⭐ IMPORTANT
          />
        )}
      </div>
    </Modal>
  );
}

export default EditQuestionModal;