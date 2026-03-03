"use client";
import { Button, Modal, Select } from "antd";
import React, { useEffect, useState } from "react";
import DoubtStatusTag from "./DoubtStatusTag";
import Options from "./Options";
import {
  getUsersByRole,
  patchAssignFaculty,
  patchMarkResolve,
} from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import { CheckCircleTwoTone } from "@ant-design/icons";
import dayjs from "dayjs";
import MathContent from "./MathContent";
import EyeIcon from "../../public/icons/eye.svg";
import Image from "next/image";

function ViewDoubtModal({ data, updated, setUpdated, role = "admin" }) {
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

  const finalStatus = statusArray[currentIndex];

  useEffect(() => {
    if (open && role === "admin" && roles?.length > 0) {
      const facultyRoleId = roles.find((r) => r.name?.toLowerCase() === "faculty")?.id;
      
      if (!facultyRoleId) return; 

      getUsersByRole({ role: facultyRoleId }).then((res) => {
        if(res.data && res.data.results) {
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
    patchAssignFaculty(id, { faculty: selectedFaculty })
      .then((res) => {
        setUpdated(!updated);
        Modal.success({
          title: "Faculty assigned",
          onOk: () => {
            setOpen(false);
          },
        });
      })
      .catch((err) => console.log(err));
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
        <Image
          src={EyeIcon}
          alt="View Details Icon"
          width={18}
          height={18}
          className="mr-2"
        />
        <span>View Details</span>
      </Button>
      <Modal
        width={750}  // Reduced width
        onCancel={() => setOpen(false)}
        open={open}
        title={
          <div className="flex items-center border-b border-gray-100 pb-2 mb-2 gap-5">
            <h2 className="text-lg font-bold text-gray-800 m-0">Doubt Details</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Status:</span>
              <DoubtStatusTag status={finalStatus} />
            </div>
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
            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Related Question</h3>
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
               </div>
            </div>
          )}

          {["ASSIGNED_TO_FACULTY", "RAISED"].includes(status) && role === "admin" && (
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
                    className={`h-8 text-xs flex items-center gap-1 ${
                        value.trim().length > 0 
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
    </>
  );
}

export default ViewDoubtModal;
