import { Button, Col, Modal, Row, Select, Steps, Input } from "antd";
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
const { TextArea } = Input;
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
  console.log("question",question)
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
  if (open && role === "admin") {
    const facultyRoleId = roles.find((r) => r.name === "faculty")?.id;
    if (!facultyRoleId) return; // optional safeguard

    getUsersByRole({ role: facultyRoleId }).then((res) => {
      setFacultyData(
        res.data.results.map(({ name, id }) => ({
          label: name,
          value: id,
        }))
      );
    });
  }
}, [open]);


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
        style={{ display: "flex", alignItems: "center" }}
      >
        <Image
          src={EyeIcon}
          alt="View Details Icon"
          width={20}
          height={20}
          style={{ marginRight: "8px", verticalAlign: "middle" }}
        />
        <span style={{ verticalAlign: "middle" }}>View Details</span>
      </Button>
      <Modal
        width={1000}
        onCancel={() => setOpen(false)}
        open={open}
        title={
          <div className="w-4/6">
            <div className="text-lg text-gray-400">
              Status <DoubtStatusTag status={finalStatus} />
            </div>
            {/*  <Steps
              className="mt-5"
              progressDot
              current={statusArray.findIndex((value) => value == status)}
              items={[
                {
                  title: <DoubtStatusTag status="RAISED" />,
                },
                {
                  title: <DoubtStatusTag status="ASSIGNED_TO_FACULTY" />,
                },
                {
                  title: <DoubtStatusTag status="RESOLVED" />,
                },
              ]}
            /> */}
          </div>
        }
        footer={null}
      >
        <Row className="text-lg font-semibold mt-10">Doubt</Row>
        <Row className="">{description}</Row>

        <Row className="text-lg font-semibold mt-5">Question:</Row>
        <Row className="">
          <Col span={24}>
            <MathContent content={question?.description} />
            <div className="mt-4" />
            <Options options={question?.options} />
          </Col>
        </Row>

        {status == "RAISED" && role == "admin" && (
          <div className="mt-10">
            <Row className="text-lg font-semibold ">Assign to faculty</Row>
            <Row className="mt-1">
              <Select
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                className=""
                placeholder="Select Faculty"
                value={selectedFaculty}
                onChange={setSelectedFaculty}
                options={facultyData}
              />
              <Button
                disabled={selectedFaculty == null}
                onClick={handleAssgin}
                className="ml-3"
                type="primary"
              >
                Assign
              </Button>
            </Row>
          </div>
        )}
        {status == "ASSIGNED_TO_FACULTY" && role == "admin" && (
          <Row className="mt-10">
            <Row className="text-lg font-semibold">Updates</Row>
            <div className="w-full">
              Assigned to<span className="font-bold ml-1 mr-1">{faculty}</span>
              on {facultyAssignedDate}{" "}
            </div>
          </Row>
        )}

        {["ASSIGNED_TO_FACULTY", "RAISED"].includes(status) &&
          role == "admin" &&
          role == "admin" && (
            <Row className="mt-10">
              <Row className="text-lg font-semibold ">Resolution</Row>
              <TextArea
                rows={4}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Explanation"
              ></TextArea>
              <div className="w-full flex justify-center">
                <Button
                  disabled={value.length == 0}
                  icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                  onClick={handleResolve}
                  className="mt-3"
                >
                  Mark as resolved
                </Button>
              </div>
            </Row>
          )}

        {status == "RESOLVED" && (
          <>
            <Row className="text-lg font-semibold mt-10">Resolution</Row>
            <Row className="">{resolution}</Row>
            <div className="w-full flex justify-center">
              <Button
                type="primary"
                className="mt-3"
                onClick={() => setOpen(false)}
              >
                Ok
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

export default ViewDoubtModal;
