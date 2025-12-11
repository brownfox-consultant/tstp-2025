"use client";
import React, { useState } from "react";
import RaiseIssueModal from "./RaiseIssueModal";
import { usePathname } from "next/navigation";
import MeetingsList from "./MeetingsList";
import { Button, DatePicker, Modal } from "antd";
import TextArea from "antd/es/input/TextArea";
import dayjs from "dayjs";
import { scheduleMeeting } from "@/app/services/authService";

function MeetingsComponent() {
  const [updated, setUpdated] = useState(false);
  const pathname = usePathname();
  let role = pathname.split("/")[1];
  const [openModal, setOpenModal] = useState(false);

  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [meetingTimes, setMeetingTimes] = useState([""]); // changed from string to array
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const handleSchedule = () => {
    setScheduleLoading(true);

    // Filter out any empty entries just in case
    const validTimes = meetingTimes.filter((t) => t);

    scheduleMeeting({
      description: meetingAgenda,
      requested_times: validTimes, // changed to an array
    })
      .then((res) => {
        setUpdated(!updated);
        Modal.success({
          title: "Meeting request sent.",
          onOk: () => {
            setOpenModal(false);
            setMeetingAgenda("");
            setMeetingTimes([""]);
          },
        });
      })
      .finally(() => setScheduleLoading(false));
  };

  const handleDateChange = (index, dateString) => {
    const updatedTimes = [...meetingTimes];
    updatedTimes[index] = dateString;
    setMeetingTimes(updatedTimes);
  };

  const addDatePicker = () => {
    if (meetingTimes.length < 3) {
      setMeetingTimes([...meetingTimes, ""]);
    }
  };

  const removeDatePicker = (index) => {
    const updatedTimes = meetingTimes.filter((_, i) => i !== index);
    setMeetingTimes(updatedTimes);
  };

  return (
    <>
      <div className="text-xl flex justify-between font-semibold mb-2">
        Meetings List
        {role == "parent" && (
          <Button onClick={() => setOpenModal(true)}>Schedule a meeting</Button>
        )}
      </div>
      <MeetingsList updated={updated} setUpdated={setUpdated} />
      <Modal
        open={openModal}
        title="Schedule a meeting"
        okText="Schedule"
        onCancel={() => setOpenModal(false)}
        onOk={handleSchedule}
        okButtonProps={{ loading: scheduleLoading }}
        cancelButtonProps={{ hidden: true }}
      >
        <div>
          <label className="font-semibold mb-3">To Discuss:</label>
          <TextArea
            rows={4}
            value={meetingAgenda}
            onChange={(e) => setMeetingAgenda(e.target.value)}
            placeholder="What is your agenda for meeting?"
          />
        </div>
        <div className="mt-3">
          <label className="font-semibold mb-3">When (Max 3):</label>
          {meetingTimes.map((time, index) => (
            <div key={index} className="flex items-center mt-2">
              <DatePicker
                showTime={{ format: "HH:mm" }}
                disabledDate={(current) => current && current <= dayjs()}
                format="YYYY-MM-DD HH:mm"
                onChange={(value, dateString) =>
                  handleDateChange(index, dateString)
                }
                value={time ? dayjs(time) : null}
              />
              {meetingTimes.length > 1 && (
                <Button
                  danger
                  type="text"
                  onClick={() => removeDatePicker(index)}
                  className="ml-2"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          {meetingTimes.length < 3 && (
            <Button type="link" onClick={addDatePicker} className="mt-2">
              + Add another time
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
}

export default MeetingsComponent;
