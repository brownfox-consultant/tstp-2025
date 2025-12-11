import {
  getTestAssignedStudents,
  reassignExpiredTest,
} from "@/app/services/authService";
import { Button, Modal, Table } from "antd";
import dayjs from "dayjs";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ViewResultModal from "./ViewResultModal";
import { deleteTestAssignment } from "@/app/services/authService";

function StudentsTestTable({ testReady, testDetails = {} }) {
  const [studentsData, setStudentsData] = useState([]);
  const [current, setCurrent] = useState();
  const [updated, setUpdated] = useState(false);
  const [total, setTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { id, testId } = useParams();
  const router = useRouter();
  const role = usePathname().split("/")[1];
  const [actionLoadingId, setActionLoadingId] = useState(null);

  
  function handleReassign(test_submission_id) {
  setActionLoadingId(test_submission_id);
  reassignExpiredTest(test_submission_id)
    .then(() => {
      setUpdated(!updated);
      Modal.success({ title: "Reassigned!" });
    })
    .finally(() => setActionLoadingId(null));
}


  useEffect(() => {
    setTableLoading(true);
    getTestAssignedStudents(testId, current)
      .then((res) => {
        const { results, count, current_page } = res.data;
        setStudentsData(results);
        setCurrent(current_page);
        setTotal(count);
      })
      .finally(() => setTableLoading(false));
  }, [current, updated]);

  function handleDelete(test_submission_id) {
  Modal.confirm({
    title: "Are you sure you want to delete this assignment?",
    okText: "Yes",
    okType: "danger",
    cancelText: "No",
    onOk() {
      setActionLoadingId(test_submission_id);
      deleteTestAssignment(test_submission_id)
        .then(() => {
          Modal.success({ title: "Deleted!" });
          setUpdated(!updated); // refresh table
        })
        .finally(() => setActionLoadingId(null));
    },
  });
}



  const statusMap = {
    YET_TO_START: "Yet To Start",
    COMPLETED: "Completed",
    IN_PROGRESS: "In Progress",
    EXPIRED: "Expired",
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      // render: ({ name }) => <div>{name}</div>,
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Status",
      dataIndex: "status",
      align: "center",
      render: (text) => {
        return <>{statusMap[text]}</>;
      },
    },
    {
  title: "Assigned Date",
  dataIndex: "assigned_date",
  align: "center",
  render: (text) => {
    return text ? dayjs(text).format("MMM D, YYYY h:mm A") : "-";
  },
},
    // {
    //   title: "Expiration Date",
    //   dataIndex: "expiration_date",
    //   align: "center",
    //   render: (text) => {
    //     let date = new Date(text);
    //     return text ? dayjs(date).format("MMM D, YYYY") : "-";
    //   },
    // },
    {
      title: "Completion Date",
      dataIndex: "completion_date",
      align: "center",
      render: (text) => {
        let date = new Date(text);
        return text ? dayjs(date).format("MMM D, YYYY") : "-";
      },
    },
    {
  title: "Action",
  dataIndex: "action",
  align: "center",
  render: (_, record) => {
    return (
      <>
        {record.status === "COMPLETED" ? (
          <ViewResultModal
            studentId={record.student_id}
            studentName={record.name}
            testSubmissionId={record.test_submission_id}
          />
        ) : record.status === "EXPIRED" ? (
          <Button
  type="primary"
  onClick={() => handleReassign(record.test_submission_id)}
  loading={actionLoadingId === record.test_submission_id}
>
  Reassign Test
</Button>
        ) : record.status === "YET_TO_START" ? (
          <Button
  danger
  onClick={() => handleDelete(record.test_submission_id)}
  loading={actionLoadingId === record.test_submission_id}
>
  Delete
</Button>
        ) : (
          "-"
        )}
      </>
    );
  },
}

  ];

  return (
    <Table
      title={({ currentPageData }) => {
        return (
          <div className="text-xl font-bold flex justify-between">
            Assigned Students List
            {(testReady || testDetails.format_type == "DYNAMIC") &&
              role == "admin" && (
                <Button
                  onClick={() =>
                    router.push(`/admin/${id}/tests/add/${testId}`)
                  }
                  type="primary"
                >
                  Add Students
                </Button>
              )}
          </div>
        );
      }}
      columns={columns}
      loading={tableLoading}
      pagination={{
        showSizeChanger: false,
        onShowSizeChange: false,
        total: total,
        pageSize: 15,
        onChange: (page) => setCurrent(page),
      }}
      dataSource={studentsData.map((student) => {
        return {
          name: student.name,
          key: student.id,
          ...student,
        };
      })}
      scroll={{ x: "max-content" }}
    />
  );
}

export default StudentsTestTable;
