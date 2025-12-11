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
            // setSuggestionData({});
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
    // setSuggestionData({});
    setOpen(false);
  }

  return (
    <>
      {/* <button onClick={() => setOpen(true)}>{icon}</button> */}
      {React.cloneElement(icon, { onClick: () => setOpen(true) })}
      <icon onClick={() => setOpen(true)} />
      <Modal
        width={1400}
        // style={{ top: 10}}
        onCancel={handleClose}
        open={open}
        title={
          <div className="w-4/6">
            <div className="text-xl flex align-middle">
              <p>Status: </p>
              <p className="ml-2">
                <SuggestionStatusTag status={suggestionData?.status} />
              </p>
            </div>
          </div>
        }
        footer={null}
      >
        {suggestionData && (
          <Skeleton loading={Object.keys(suggestionData).length == 0}>
            <Row gutter={[16, 16]}>
              <Col lg={12}>
                <SuggestionComponent
                  title="Question"
                  data={suggestionData.question}
                />
              </Col>
              <Col lg={12}>
                <SuggestionComponent
                  title="Suggestion"
                  data={suggestionData.suggestion}
                
                />
              </Col>
            </Row>
            {suggestionData?.status == "IN_REVIEW" && role == "admin" ? (
              <Row className="mt-10">
                <div className="w-full flex justify-center mt-3">
                  <Button
                    onClick={handleApprove}
                    className="mr-3"
                    type="primary"
                  >
                    Approve
                  </Button>
                  <Button onClick={handleReject} danger>
                    Reject
                  </Button>
                </div>
              </Row>
            ) : (
              <Row justify="center" className="mt-3">
                <Button onClick={() => setOpen(false)} type="primary">
                  Ok
                </Button>
              </Row>
            )}
          </Skeleton>
        )}
      </Modal>
    </>
  );
}

export default ViewSuggestionModal;
