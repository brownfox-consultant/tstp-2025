import { Button, Col, Modal, Row, Select, Steps, Input } from "antd";
import React, { useEffect, useState } from "react";
import DoubtStatusTag from "./DoubtStatusTag";
import Options from "./Options";
import { getUsersByRole, resolveIssue } from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import { CheckCircleTwoTone } from "@ant-design/icons";
const { TextArea } = Input;

function ViewIssueModal({ data, updated, setUpdated, role }) {
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
  let statusArray = ["RAISED", "RESOLVED"];

  let date = new Date(faculty_assigned_date);

  const handleResolve = () => {
    resolveIssue(id, { resolution: value })
      .then((res) => {
        setUpdated(!updated);
        Modal.success({
          title: "Issue resolved",
          onOk: () => {
            setOpen(false);
          },
        });
      })
      .catch((err) => console.log(err));
  };

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        View Details
      </Button>
      <Modal
        width={800}
        onCancel={() => setOpen(false)}
        open={open}
     
       title={
        <div className="w-full">
          <div className="text-xl mb-2">Status</div>
          <Steps
            className="w-full mt-5 ml-0"
            progressDot
            current={statusArray.findIndex((value) => value === status)}
            items={[
              {
                title: (
                  <div className="w-full text-left">
                    <DoubtStatusTag status="RAISED" />
                  </div>
                ),
              },
              {
                title: (
                  <div className="w-full text-right">
                    <DoubtStatusTag status="RESOLVED" />
                  </div>
                ),
              },
            ]}
          />
        </div>
      }  
     
     
        // title={
        //   <div className="w-4/6">
        //     <div className="text-xl">Status</div>
        //     <Steps
        //       className="mt-5 ml-0"
        //       progressDot
        //       current={statusArray.findIndex((value) => value == status)}
        //       items={[
        //         {
        //           title: <DoubtStatusTag status="RAISED" />,
        //         },
        //         {
        //           title: <DoubtStatusTag status="RESOLVED" />,
        //         },
        //       ]}
        //     />
        //   </div>
        // }
        footer={null}
      >
        <Row className="text-lg font-semibold mt-10">Issue:</Row>
        <Row className="">{description}</Row>

        {/* {status == "RAISED" && (
          <div className="mt-10">
            <Row className="text-lg font-semibold ">Assign to faculty</Row>
            <Row className="mt-1">
              <Select
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
        {status == "ASSIGNED_TO_FACULTY" && (
          <Row className="mt-10">
            <Row className="text-lg font-semibold">Updates</Row>
            <div className="w-full">
              Assigned to<span className="font-bold ml-1 mr-1">{faculty}</span>
              on {facultyAssignedDate}{" "}
            </div>
          </Row>
        )} */}

        {status == "RAISED" && role != "student" && (
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
    <Row className="mt-2 text-sm text-gray-500">
      Resolved by: <span className="font-semibold ml-1">{data?.resolved_by}</span>
    </Row>
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

export default ViewIssueModal;
