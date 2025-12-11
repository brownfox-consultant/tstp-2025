import { Modal } from "antd";
import React from "react";

function PreviewQuestionModal({ visible, onClose, questionData }) {
  if (!questionData) return null;

  const {
    description,
    reading_comprehension_passage,
    directions,
    options = [],
    explanation,
  } = questionData;

  const optionLabels = ["A", "B", "C", "D", "E", "F"];

  return (
    <Modal
      title={<span className="font-semibold text-lg">Preview Question</span>}
      open={visible}
      onCancel={onClose}
      footer={null}
      width="65%" // ✅ reduced modal width
      bodyStyle={{
        backgroundColor: "#f8fafc",
        maxHeight: "85vh",
        overflowY: "auto",
        padding: "2rem",
      }}
    >
      <div className="max-w-3xl mx-auto bg-white shadow-sm border border-gray-200 rounded-xl p-8 text-gray-900">
        {/* Reading Passage */}
        {reading_comprehension_passage && (
          <div className="mb-8">
            <div
              className="text-gray-800 leading-relaxed space-y-2 text-[15px]"
            dangerouslySetInnerHTML={{
  __html: reading_comprehension_passage.replace(/\n/g, "<br />"),
}}

            />
          </div>
        )}

        {/* Directions */}
        {directions && (
          <div className="mb-8">
            <h4 className="text-base font-semibold mb-2 text-blue-700">
              Directions:
            </h4>
            <div
              className="p-3 border-l-4 border-blue-500 bg-blue-50 rounded-md text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: directions }}
            />
          </div>
        )}

        {/* Question */}
        <div className="mb-6">
          <p
            className="text-gray-900 text-[16px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>

        {/* Options Section */}
        {options.length > 0 && (
          <div className="space-y-3 w-[90%] mx-auto">
            {options.map((opt, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 border border-gray-300 rounded-lg px-4 py-2 hover:shadow transition bg-gray-50`}
              >
                {/* Option label A., B., C. */}
                <div className="font-bold text-[15px] text-gray-800">
                  {optionLabels[idx] + "."}
                </div>

                {/* Option text */}
                <div
                  className="flex-1 text-[15px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: opt.description }}
                />

                {/* Correct indicator */}
                {opt.is_correct && (
                  <div className="ml-2 text-green-600 font-semibold">
                    (Correct)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Explanation */}
        {explanation && (
          <div className="mt-8">
            <h4 className="text-base font-semibold mb-2 text-green-700">
              Explanation:
            </h4>
            <div
              className="p-3 border-l-4 border-green-500 bg-green-50 rounded-md text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: explanation }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

export default PreviewQuestionModal;
