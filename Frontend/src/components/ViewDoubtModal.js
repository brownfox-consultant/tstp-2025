"use client";
import { Button, Modal, Select, DatePicker, TimePicker } from "antd";
import React, { useEffect, useState } from "react";
import DoubtStatusTag from "./DoubtStatusTag";
import Options from "./Options";
import {
  getUsersByRole,
  patchAssignFaculty,
  patchMarkResolve,
  getAvailableFacultySlots,
  patchSetTimeSlot,
  createFacultySlot,
  deleteFacultySlot,
} from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import { CheckCircleTwoTone, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import MathContent from "./MathContent";
import EyeIcon from "../../public/icons/eye.svg";
import Image from "next/image";
import { EditOutlined } from "@ant-design/icons";
import { getSubjectTopics } from "@/app/services/authService";
import EditQuestionModal from "./EditQuestionModal";

function ViewDoubtModal({ data,
  updated,
  setUpdated,
  role = "admin",
  label = "View Details",
  iconType = "view" }) {
  const [open, setOpen] = useState(false);
  const {
    question,
    description,
    status,
    id,
    faculty,
    faculty_assigned_date,
    resolution,
  } = data;

  const [facultyData, setFacultyData] = useState([]);
  const [value, setValue] = useState("");
  const { roles } = useGlobalContext();
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  let statusArray = ["RAISED", "ASSIGNED_TO_FACULTY", "RESOLVED"];

  let date = new Date(faculty_assigned_date);
  let facultyAssignedDate = dayjs(date).format("MMM D, YYYY");

  const currentIndex = statusArray.findIndex((value) => value === status);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editQuestionData, setEditQuestionData] = useState(null);
  const [topicOptions, setTopicOptions] = useState([]);

  const finalStatus = statusArray[currentIndex];

  // --- Faculty time-slot state (single set — no duplicates) ---
  const [facultySlotOptions, setFacultySlotOptions] = useState([]);
  const [selectedFacultySlot, setSelectedFacultySlot] = useState(null);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotDate, setNewSlotDate] = useState(null);
  const [newSlotStart, setNewSlotStart] = useState(null);
  const [newSlotEnd, setNewSlotEnd] = useState(null);

  const refreshFacultySlots = () => {
    getAvailableFacultySlots({ faculty_id: data.faculty_id }).then((res) => {
      setFacultySlotOptions(
        res.data.map((s) => ({
          label: `${dayjs(s.date).format("MMM D")} · ${s.start_time}–${s.end_time}`,
          value: s.id,
        }))
      );
    });
  };

  // single effect — fetches slots when the modal opens for an assigned faculty
  useEffect(() => {
    if (!open || role !== "faculty" || status !== "ASSIGNED_TO_FACULTY") {
      setFacultySlotOptions([]);
      return;
    }
    refreshFacultySlots();
  }, [open, role, status]);

  const handleSetTimeSlot = () => {
    patchSetTimeSlot(id, { scheduled_slot: selectedFacultySlot })
      .then(() => {
        setUpdated(!updated);
        Modal.success({ title: "Time slot set", onOk: () => setOpen(false) });
      })
      .catch((err) => console.log(err));
  };

 const handleAddSlot = () => {
  if (!newSlotDate || !newSlotStart || !newSlotEnd) return;

  const startDateTime = newSlotDate
    .hour(newSlotStart.hour())
    .minute(newSlotStart.minute());

  if (startDateTime.isBefore(dayjs())) {
    Modal.error({ title: "Invalid slot", content: "That start time has already passed." });
    return;
  }
  if (!newSlotEnd.isAfter(newSlotStart)) {
    Modal.error({ title: "Invalid slot", content: "End time must be after start time." });
    return;
  }

  createFacultySlot({
    date: newSlotDate.format("YYYY-MM-DD"),
    start_time: newSlotStart.format("HH:mm"),
    end_time: newSlotEnd.format("HH:mm"),
  })
    .then(() => {
      refreshFacultySlots();
      setShowAddSlot(false);
      setNewSlotDate(null);
      setNewSlotStart(null);
      setNewSlotEnd(null);
    })
    .catch((err) => console.log(err));
};

  const handleDeleteSlot = (slotId) => {
    deleteFacultySlot(slotId)
      .then(() => {
        if (selectedFacultySlot === slotId) setSelectedFacultySlot(null);
        refreshFacultySlots();
      })
      .catch((err) => console.log(err));
  };
  // --- end faculty time-slot logic ---

  useEffect(() => {
    if (open && role === "admin" && roles?.length > 0) {
      const facultyRoleId = roles.find((r) => r.name?.toLowerCase() === "faculty")?.id;

      if (!facultyRoleId) return;

      getUsersByRole({ role: facultyRoleId }).then((res) => {
        if (res.data && res.data.results) {
          setFacultyData(
            res.data.results.map(({ name, id }) => ({
              label: name,
              value: id,
            }))
          );
        }
      }).catch(err => console.error(err));
    }
  }, [open, roles]);

  const handleAssgin = () => {
    patchAssignFaculty(id, {
      faculty: selectedFaculty,
    })
      .then(() => {
        setUpdated(!updated);
        Modal.success({ title: "Faculty assigned", onOk: () => setOpen(false) });
      })
      .catch((err) => console.log(err));
  };

  const handleEdit = async () => {
    const courseSubjectId =
      question?.course_subject || data.course_subject_id;

    try {
      const res = await getSubjectTopics(courseSubjectId);

      const topics = res.data.map((t) => ({
        ...t,
        label: t.name,
        value: t.id,
      }));

      setTopicOptions(topics);

      const topic = res.data.find((t) => t.name === question.topic);

      setEditQuestionData({
        ...question,
        topic: topic?.id,
        topic_name: topic?.name,
      });

      setIsEditModalOpen(true);

    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = () => {
    patchMarkResolve(id, { resolution: value })
      .then((res) => {
        setUpdated(!updated);
        Modal.success({
          title: "Doubt resolved",
          onOk: () => {
            setOpen(false);
          },
        });
      })
      .catch((err) => console.log(err));
  };

  return (
    <>
      <Button
        type="link"
        onClick={() => setOpen(true)}
        className="flex items-center hover:bg-gray-100 rounded-md px-2 border-0 shadow-none text-current"
      >

        {iconType === "edit" ? (
          <EditOutlined />
        ) : (
          <Image
            src={EyeIcon}
            alt="View Details Icon"
            width={18}
            height={18}
            className="mr-2"
          />
        )}

        <span>{label}</span>

      </Button>
      <Modal
        width={750}  // Reduced width
        onCancel={() => setOpen(false)}
        open={open}
        title={
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
            <div className="flex items-center gap-5">
              <h2 className="text-lg font-bold text-gray-800 m-0">
                Doubt Details
              </h2>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Status:</span>
                <DoubtStatusTag status={finalStatus} />
              </div>
            </div>

            {role === "admin" && status === "RAISED" && (
              <Button
                type="text"
                icon={<EditOutlined style={{ color: "#1890ff" }} />}
                onClick={handleEdit}
                style={{ marginRight: 20 }}
              >
                Edit Question
              </Button>
            )}
          </div>
        }
        footer={null}
        centered
        className="rounded-xl overflow-hidden [&_.ant-modal-content]:p-4"
        styles={{
          mask: { backdropFilter: 'blur(2px)' },
          body: { padding: 0 } // handled by tailwind classes inside
        }}
      >
        <div className="flex flex-col gap-3">

          {/* Section 1: Doubt Info */}
          <div className="bg-gray-50 p-3 rounded-md border border-gray-100 flex items-baseline gap-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Doubt Description : </h3>
            <p className="text-sm text-gray-800 leading-relaxed font-bold">{description}</p>
          </div>

          {/* Section 2: Question Context */}
          <div className="border border-gray-200 rounded-md p-3 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">
                Related Question
              </h3>

              {question?.srno && (
                <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded">
                  Sr No: {question.srno}
                </span>
              )}
            </div>
            <div className="text-sm scale-95 origin-top-left w-[105%] -mb-2">
              {/* Show passage first if exists */}
              {question?.reading_comprehension_passage && (
                <div className="mb-3 p-3 bg-gray-50 border rounded-md">
                  <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                    Passage
                  </h3>
                  <MathContent content={question?.reading_comprehension_passage} />
                </div>
              )}

              {/* Then show question */}
              <MathContent content={question?.description} />
              <div className="mt-2">
                <Options options={question?.options} />
              </div>
            </div>
          </div>

          {/* Section 3: Admin Actions (Assign / Resolve) */}
          {status === "RAISED" && role === "admin" && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-md p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-[#0071BC] mb-1.5 uppercase">Assign to Faculty</h3>
                  <Select
                    className="w-full"
                    value={selectedFaculty}
                    onChange={(value) => setSelectedFaculty(value)}
                    options={facultyData}
                    placeholder="Select Faculty member"
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </div>
                <div className="self-end">
                  <Button
                    type="primary"
                    disabled={selectedFaculty == null}
                    onClick={handleAssgin}
                    className="action-button"
                  >
                    Assign
                  </Button>
                </div>
              </div>
            </div>
          )}

          {status === "ASSIGNED_TO_FACULTY" && role === "admin" && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-yellow-700 mb-0.5 uppercase">Current Status</h3>
                <p className="text-xs text-gray-600 m-0">
                  Assigned to <span className="font-bold text-gray-900">{faculty}</span> on {facultyAssignedDate}
                </p>
                {data.scheduled_slot ? (
                  <p className="text-xs text-gray-600 m-0 mt-1">
                    Explanation scheduled: <span className="font-bold text-gray-900">
                      {dayjs(data.scheduled_slot.date).format("MMM D, YYYY")}, {data.scheduled_slot.start_time}–{data.scheduled_slot.end_time}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-orange-600 m-0 mt-1">No time slot booked yet</p>
                )}
              </div>
            </div>
          )}

          {status === "ASSIGNED_TO_FACULTY" && role === "faculty" && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-md p-3">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-bold text-[#0071BC] uppercase">
                  {data.scheduled_slot ? "Reschedule Explanation Slot" : "Pick a Time Slot"}
                </h3>
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setShowAddSlot(!showAddSlot)}
                >
                  Add Slot
                </Button>
              </div>

              {data.scheduled_slot && (
                <p className="text-xs text-gray-600 mb-2">
                  Currently scheduled: <span className="font-bold text-gray-900">
                    {dayjs(data.scheduled_slot.date).format("MMM D, YYYY")}, {data.scheduled_slot.start_time}–{data.scheduled_slot.end_time}
                  </span>
                </p>
              )}

              {showAddSlot && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-white border border-blue-100 rounded-md">
                  <DatePicker
                    size="small"
                    value={newSlotDate}
                    onChange={setNewSlotDate}
                    placeholder="Date"
                  />
                  <TimePicker
                    size="small"
                    value={newSlotStart}
                    onChange={setNewSlotStart}
                    format="HH:mm"
                    placeholder="Start"
                  />
                  <TimePicker
                    size="small"
                    value={newSlotEnd}
                    onChange={setNewSlotEnd}
                    format="HH:mm"
                    placeholder="End"
                  />
                  <Button
                    type="primary"
                    size="small"
                    disabled={!newSlotDate || !newSlotStart || !newSlotEnd}
                    onClick={handleAddSlot}
                  >
                    Save
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-3 mb-2">
                <Select
                  className="w-full"
                  value={selectedFacultySlot}
                  onChange={setSelectedFacultySlot}
                  options={facultySlotOptions}
                  placeholder="Select an available slot"
                  allowClear
                />
                <Button
                  type="primary"
                  disabled={selectedFacultySlot == null}
                  onClick={handleSetTimeSlot}
                >
                  {data.scheduled_slot ? "Update" : "Confirm"}
                </Button>
              </div>

              {facultySlotOptions.length > 0 && (
                <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                  {facultySlotOptions.map((s) => (
                    <div key={s.value} className="flex items-center justify-between text-xs text-gray-600 px-2 py-1 bg-white border border-gray-100 rounded">
                      <span>{s.label}</span>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteSlot(s.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          

          {["ASSIGNED_TO_FACULTY", "RAISED"].includes(status) && (role === "admin" || role === "faculty") && (
            <div className="mt-1">
              <h3 className="text-xs font-semibold text-gray-500 mb-1.5 uppercase">Resolution</h3>
              <textarea
                rows={3}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter detailed explanation or resolution..."
                className="w-full text-sm p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-colors"
              />
              <div className="flex justify-end mt-2">
                <Button
                  disabled={value.trim().length === 0}
                  icon={<CheckCircleTwoTone twoToneColor={value.trim().length > 0 ? "#fff" : "#52c41a"} />}
                  onClick={handleResolve}
                  className={`h-8 text-xs flex items-center gap-1 ${value.trim().length > 0
                      ? 'bg-green-600 hover:bg-green-700 text-white border-transparent'
                      : ''
                    }`}
                >
                  Mark as Resolved
                </Button>
              </div>
            </div>
          )}

          {status === "RESOLVED" && (
            <>
              <div className="bg-green-50/50 border border-green-100 rounded-md p-3">
                <h3 className="text-xs font-bold text-green-700 mb-1 uppercase">Resolution</h3>
                <p className="text-sm text-gray-800 m-0 leading-relaxed">{resolution}</p>

              </div>
              <div className="flex justify-end mt-2">
                <Button type="default" size="medium" className="action-button" onClick={() => setOpen(false)}>Close</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
      {editQuestionData && (
        <EditQuestionModal
          open={isEditModalOpen}
          setOpen={setIsEditModalOpen}
          editQuestionData={editQuestionData}
          setEditQuestionData={setEditQuestionData}
          topicOptions={topicOptions}
          role={role}
          updated={updated}
          setUpdated={setUpdated}

        />
      )}
    </>
  );
}

export default ViewDoubtModal;