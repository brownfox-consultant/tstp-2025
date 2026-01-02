import { Button, Col, Modal, Row, Skeleton } from "antd";
import React, { useEffect, useState } from "react";
import {
  approveSuggestion,
  getSuggestionForQuestion,
  rejectSuggestion,
} from "@/app/services/authService";
import SuggestionStatusTag from "./SuggestionStatusTag";
import SuggestionComponent from "./SuggestionComponent";
import SuggestionComponent_S from "./SuggestionComponent_S";

function ViewSuggestionModal({
  questionId,
  data,
  updated,
  setUpdated,
  icon,
  role,
}) {
  const [open, setOpen] = useState(false);
  const [suggestionData, setSuggestionData] = useState(data || {});

  const handleApprove = () => {
    approveSuggestion(suggestionData.id)
      .then((res) => {
        setUpdated(!updated);
        Modal.success({
          title: "Suggestion approved",
          onOk: () => {
            setOpen(false);
            setSuggestionData({});
          },
        });
      })
      .catch((err) => console.log(err));
  };

  const handleReject = () => {
    rejectSuggestion(suggestionData.id)
      .then((res) => {
        setUpdated(!updated);
        Modal.success({
          title: "Suggestion rejected",
          onOk: () => {
            setOpen(false);
          },
        });
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    if (open) {
      if (
        !data &&
        (suggestionData == undefined || Object.keys(suggestionData).length == 0)
      ) {
        getSuggestionForQuestion(questionId).then((res) => {
          setSuggestionData(res.data);
        });
      } else if (data) {
        setSuggestionData(data);
      }
    }
  }, [open, data]);

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      {React.cloneElement(icon, { onClick: () => setOpen(true), className: "cursor-pointer" })}
      <Modal
        width={1400}
        className="top-5"
        onCancel={handleClose}
        open={open}
        title={
          <div className="flex items-center gap-3 pb-2">
            <span className="text-base font-medium text-gray-700">
              Status:
            </span>
            <SuggestionStatusTag status={suggestionData?.status} />
          </div>
        }
        footer={null}
      >
        {suggestionData && (
          <Skeleton loading={Object.keys(suggestionData).length == 0}>
            {/* Side by Side Comparison */}
            <Row gutter={[20, 20]}>
              <Col xs={24} lg={12}>
                <SuggestionComponent
                  title="Question"
                  data={suggestionData.question}
                />
              </Col>
              <Col xs={24} lg={12}>
                <SuggestionComponent
                  title="Suggestion"
                  data={suggestionData.suggestion}
                />
              </Col>
            </Row>

            {/* Action Buttons */}
            <div className="flex justify-center mt-6 pt-4">
              {suggestionData?.status == "IN_REVIEW" && role == "admin" ? (
                <div className="flex gap-3">
                  <Button
                    onClick={handleApprove}
                    type="primary"
                    size="large"
                    className="min-w-[120px] h-11 rounded-lg font-medium bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={handleReject}
                    danger
                    size="large"
                    className="min-w-[120px] h-11 rounded-lg font-medium"
                  >
                    Reject
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setOpen(false)}
                  type="primary"
                  size="large"
                  className="min-w-[100px] h-11 rounded-lg font-medium bg-amber-500 border-amber-500 hover:bg-amber-600 hover:border-amber-600"
                >
                  Ok
                </Button>
              )}
            </div>
          </Skeleton>
        )}
      </Modal>
    </>
  );
}

export default ViewSuggestionModal;
