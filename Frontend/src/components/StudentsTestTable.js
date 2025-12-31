import {
  getTestAssignedStudents,
  reassignExpiredTest,
} from "@/app/services/authService";
import { Button, Modal, Table, Tag } from "antd";
import dayjs from "dayjs";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ViewResultModal from "./ViewResultModal";
import { deleteTestAssignment } from "@/app/services/authService";
import {
  UserAddOutlined,
  TeamOutlined,
  ReloadOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  ExclamationCircleFilled,
  MinusCircleFilled
} from "@ant-design/icons";

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

  // Status configuration with colors and icons
  const statusConfig = {
    YET_TO_START: {
      label: "Yet To Start",
      color: "default",
      icon: <MinusCircleFilled className="text-gray-400" />,
      bgClass: "bg-gray-50 text-gray-600 border-gray-200"
    },
    COMPLETED: {
      label: "Completed",
      color: "success",
      icon: <CheckCircleFilled className="text-green-500" />,
      bgClass: "bg-green-50 text-green-700 border-green-200"
    },
    // IN_PROGRESS: { 
    //   label: "In Progress", 
    //   color: "processing",
    //   icon: <ClockCircleFilled className="text-blue-500" />,
    //   bgClass: "bg-blue-50 text-blue-700 border-blue-200"
    // },
    EXPIRED: {
      label: "Expired",
      color: "error",
      icon: <ExclamationCircleFilled className="text-red-500" />,
      bgClass: "bg-red-50 text-red-700 border-red-200"
    },
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (text) => (
        <span className="font-medium text-gray-800">{text}</span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      render: (text) => (
        <span className="text-gray-600">{text}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      align: "center",
      render: (text) => {
        const config = statusConfig[text] || statusConfig.YET_TO_START;
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.bgClass}`}>
            {config.icon}
            {config.label}
          </span>
        );
      },
    },
    {
      title: "Assigned Date",
      dataIndex: "assigned_date",
      align: "center",
      render: (text) => {
        return text ? (
          <span className="text-gray-600">{dayjs(text).format("MMM D, YYYY h:mm A")}</span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      title: "Completion Date",
      dataIndex: "completion_date",
      align: "center",
      render: (text) => {
        let date = new Date(text);
        return text ? (
          <span className="text-gray-600">{dayjs(date).format("MMM D, YYYY")}</span>
        ) : (
          <span className="text-gray-400">-</span>
        );
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
              <button
                onClick={() => handleReassign(record.test_submission_id)}
                disabled={actionLoadingId === record.test_submission_id}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all duration-300 disabled:opacity-50"
              >
                <ReloadOutlined className={actionLoadingId === record.test_submission_id ? "animate-spin" : ""} />
                Reassign
              </button>
            ) : record.status === "YET_TO_START" ? (
              <button
                onClick={() => handleDelete(record.test_submission_id)}
                disabled={actionLoadingId === record.test_submission_id}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-sm font-medium transition-all duration-300 disabled:opacity-50"
              >
                <DeleteOutlined />
                Delete
              </button>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </>
        );
      },
    }
  ];

  // Calculate stats
  const completedCount = studentsData.filter(s => s.status === "COMPLETED").length;
  const inProgressCount = studentsData.filter(s => s.status === "IN_PROGRESS").length;
  const yetToStartCount = studentsData.filter(s => s.status === "YET_TO_START").length;

  return (
    <div className="space-y-4">    
      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Table
          title={() => (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left Side: Title */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <TeamOutlined className="text-indigo-600 text-lg" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Assigned Students</h3>
                    <p className="text-sm text-gray-500">{total} students assigned</p>
                  </div>
                </div>

                {/* Right Side: Action Button */}
                {(testReady || testDetails?.format_type === "DYNAMIC") &&
                  role === "admin" && (
                    <button
                      onClick={() => router.push(`/admin/${id}/tests/add/${testId}`)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 w-full md:w-auto justify-center"
                    >
                      <UserAddOutlined />
                      Add Students
                    </button>
                  )}
              </div>

              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total */}
                <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <TeamOutlined className="text-blue-600 text-sm" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</span>
                  </div>
                  <span className="text-lg font-bold text-gray-800">{total}</span>
                </div>

                {/* Completed */}
                <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                      <CheckCircleFilled className="text-green-600 text-sm" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completed</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{completedCount}</span>
                </div>

                {/* Yet to Start */}
                <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                      <MinusCircleFilled className="text-gray-500 text-sm" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Yet to Start</span>
                  </div>
                  <span className="text-lg font-bold text-gray-600">{yetToStartCount}</span>
                </div>
              </div>
            </div>
          )}
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
      </div>
    </div>
  );
}

export default StudentsTestTable;
