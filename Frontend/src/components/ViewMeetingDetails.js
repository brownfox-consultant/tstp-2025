import { approveMeeting } from "@/app/services/authService";
import { Button, Col, DatePicker, Modal, Row } from "antd";
import dayjs from "dayjs";
import React, { useState } from "react";

function ViewMeetingDetails({ data, updated, setUpdated }) {
  const [open, setOpen] = useState(false);
  const [meetingTime, setMeetingTime] = useState(null);

  const handleApprove = () => {
    if (!meetingTime) {
      Modal.error({ title: "Please select a time to approve." });
      return;
    }

    approveMeeting(data.id, {
      approved_time: dayjs(meetingTime).format("YYYY-MM-DD HH:mm"),
    }).then(() => {
      Modal.success({ title: "Meeting approved" });
      setUpdated(!updated);
      setOpen(false);
    });
  };

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        View Details
      </Button>
      <Modal
        onCancel={() => setOpen(false)}
        open={open}
        okText="Approve"
        onOk={handleApprove}
        title="Meeting Details"
      >
        <Row className="mb-3">
          <Col md={12} sm={24}>
            Meeting Request From:
          </Col>
          <Col md={12} sm={24} className="font-bold">
            {data.requested_by}
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={12} sm={24}>
            Requested Times:
          </Col>
          <Col md={12} sm={24} className="font-bold">
            {(data.requested_times || []).map((time, i) => (
              <div key={i}>{dayjs(time).format("D MMM, YYYY - HH:mm A")}</div>
            ))}
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={12} sm={24}>
            Approve Time:
          </Col>
          <Col md={12} sm={24}>
            <DatePicker
              value={meetingTime ? dayjs(meetingTime) : null}
              showTime={{
                format: "HH:mm",
              }}
              disabledDate={(current) => current && current <= dayjs()}
              format="YYYY-MM-DD HH:mm"
              onChange={(value) => setMeetingTime(value)}
            />
          </Col>
        </Row>
      </Modal>
    </>
  );
}

export default ViewMeetingDetails;
