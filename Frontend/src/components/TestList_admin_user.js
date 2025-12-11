"use client";

import { getTestsList } from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import { resetTestSlice } from "@/lib/features/test/testSlice";
import useFullScreen from "@/utils/useFullScreen";
import { WarningOutlined } from "@ant-design/icons";
import { Button, Popover, Table, Pagination, Input, Modal } from "antd";
import dayjs from "dayjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import ReportNew from "./report-module/Report_New";
import Admin_Report_New from "./report-module/Admin_Report_New";
import EyeIcon from "../../public/icons/eye.svg";
import Image from "next/image";
import { getTestResult } from "@/app/services/authService";

function TestList_admin_user({ studentId }) {
  const [testsData, setTestsData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [testLoading, setTestLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
    const studentIdFromParam = searchParams.get("student_id");
    const [scoreMap, setScoreMap] = useState({});


  const role = pathname.split("/")[1];
  const { setTestRunning, setCollapsed } = useGlobalContext();
  const { isFullScreen, goFullScreen, exitFullScreen } = useFullScreen();

  const [showResultModal, setShowResultModal] = useState(false);
  const [submissionId, setSubmissionId] = useState();
  const dispatch = useDispatch();
  const [pageSize, setPageSize] = useState(10);
  const [sortParams, setSortParams] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    setTestRunning(false);
    setCollapsed(false);
    if (isFullScreen) exitFullScreen();
  }, []);

  useEffect(() => {
    setTableLoading(true);
    const params = {
      page: current,
    };
    if (studentId) {
      params.student_id = studentId;
    }
    if (studentIdFromParam) params.student_id = studentIdFromParam;
    if (Object.keys(sortParams).length > 0) {
      params.ordering = Object.keys(sortParams)
        .map((key) => (sortParams[key] === "asc" ? key : `-${key}`))
        .join(",");
    }
    if (debouncedSearchTerm) {
      params.search = debouncedSearchTerm;
    }

    getTestsList(params)
      .then((res) => {
        const sortedResults = res.data.results.map((test, index) => ({
          ...test,
          key: index,
        }));

        setTestsData(sortedResults);
        setCurrent(res.data.current_page);
        setTotal(res.data.count);
        setTotalPages(res.data.total_pages);

        window.sessionStorage.removeItem("course_subject_index");
        window.sessionStorage.removeItem("section_index");
        window.sessionStorage.removeItem("question_index");
        window.sessionStorage.removeItem("remaining_time");
      })
      .finally(() => setTableLoading(false));
  }, [current, sortParams, debouncedSearchTerm, studentIdFromParam]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(value);
    }, 1000);
    setCurrent(1);
  };

  const columns = [
    {
      title: <div className="flex items-center">Test name</div>,
      key: "name",
      dataIndex: "name",
      render: (text) => <>{text}</>,
      sorter: true,
      width: 100,
      align: "center",
      sorter: { multiple: 1 },
    },
    {
      title: <div className="flex items-center justify-center">Course name</div>,
      key: "course_name",
      dataIndex: "course_name",
      align: "center",
      sorter: true,
      width: 100,
      sorter: { multiple: 2 },
    },
    {
  title: <div className="flex items-center justify-center">Assigned date</div>,
  key: "assigned_date",
  dataIndex: "assigned_date",
  align: "center",
  render: (_, record) =>
    record.assigned_date
      ? dayjs(record.assigned_date).format("MMM D, YYYY h:mm A")
      : record.created_at
      ? dayjs(record.created_at).format("MMM D, YYYY h:mm A")
      : "-",
  sorter: true,
  width: 200,
  sorter: { multiple: 3 },
},
    {
      title: <div className="flex items-center justify-center">Test taken on</div>,
      key: "completion_date",
      dataIndex: "completion_date",
      align: "center",
      render: (text) =>
        text ? dayjs(new Date(text)).format("MMM D, YYYY h:mm A") : "-",
      width: 200,
      },
    {
  title: <div className="flex items-center justify-center">Score</div>,
  key: "score",
  dataIndex: "test_submission_id",
  align: "center",
  render: (submissionId, record) => {
    if (record.status !== "COMPLETED") return "-";

    const score = scoreMap[submissionId];

    if (score === undefined) {
      // Trigger async score fetch
      getTestResult({ test_submission_id: submissionId }).then((res) => {
        const totalScore = res.data.subjects?.reduce((acc, s) => acc + (s.subject_score || 0), 0);
        setScoreMap((prev) => ({ ...prev, [submissionId]: totalScore }));
      });

      return "Loading...";
    }

    return <>{score}</>;
  },
  width: 100,
},
    {
      title: " ",
      align: "center",
      key: "val",
      render: (_, record) => {
        if (!record.can_take_test && record.status !== "COMPLETED") return "-";

        if (record.status === "COMPLETED") {
          return (
            <Button
              type="link"
              onClick={() => {
                setSubmissionId(record.test_submission_id);
                setShowResultModal(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              <Image
                src={EyeIcon}
                alt="View Result Icon"
                width={20}
                height={20}
                style={{ marginRight: "8px" }}
              />
              <span>View Result</span>
            </Button>
          );
        }

        if (record.status === "EXPIRED") {
          return (
            <Popover content="Duration to take the test has expired. Please contact the Admin to reassign the Test.">
              <WarningOutlined
                twoTonecolor="#EB2F96"
                className="text-xl cursor-pointer"
              />
            </Popover>
          );
        }

        // ✅ Disable Start/Continue for admin viewing another student
        if (role === "student" && !studentIdFromParam) {
          return (
            <Button
              key={record.test_submission_id}
              type="primary"
              onClick={() => handleTestClick(record, record.status)}
            >
              {record.status === "YET_TO_START"
                ? "Start Test"
                : "Continue Test"}
            </Button>
          );
        }

        return "-";
      },
      width: 200,
    },
  ];

  function handleTestClick(record, status) {
    window.sessionStorage.setItem("test_submission_id", record.test_submission_id);
    dispatch(resetTestSlice());
    if (status === "IN_PROGRESS") {
      setTestLoading(true);
      router.push(`full/${record.id}/begin`);
      goFullScreen();
    } else if (status === "YET_TO_START") {
      router.push(`full/${record.id}/begin`);
    }
  }

  const itemRender = (_, type, originalElement) => {
    if (type === "prev") return <a>Previous</a>;
    if (type === "next") return <a>Next</a>;
    return originalElement;
  };

  const handleTableChange = (pagination, filters, sorter) => {
    let sortObj = {};
    if (Array.isArray(sorter)) {
      sorter.forEach((s) => {
        if (s.order === "ascend") sortObj[s.field] = "asc";
        else if (s.order === "descend") sortObj[s.field] = "desc";
      });
    } else {
      if (sorter.order === "ascend") sortObj[sorter.field] = "asc";
      else if (sorter.order === "descend") sortObj[sorter.field] = "desc";
    }
    setSortParams(sortObj);
  };

  return (
    <div className="mt-3">
      <Input
        placeholder={`Search`}
        onChange={handleSearchChange}
        style={{
          marginBottom: 8,
          height: "40px",
          fontSize: "18px",
          backgroundImage: `url('/icons/search.svg')`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "10px center",
          paddingLeft: "40px",
          backgroundSize: "20px",
          width: "25%",
        }}
      />

      <Table
        footer={() => (
          <div className="footer-container">
            <div className="flex justify-end mr-5">
              Page {current} of {totalPages} (Total: {total} records)
            </div>
            <Pagination
              className="size-changer"
              current={current}
              pageSize={pageSize}
              total={total}
              itemRender={itemRender}
              onChange={(page) => {
                setCurrent(page);
              }}
            />
          </div>
        )}
        dataSource={testsData}
        loading={tableLoading}
        columns={columns}
        rowKey="key"
        scroll={{ x: "max-content", y: 480 }}
        pagination={false}
        rowClassName={(record, index) =>
          index % 2 === 0 ? "even-row" : "odd-row"
        }
        className="tablestyles mt-4"
        onChange={handleTableChange}
      />

      {/* ✅ Modal for Result */}
      {showResultModal && (
        <Modal
          open={showResultModal}
          onCancel={() => setShowResultModal(false)}
          footer={null}
          width="100%"
          style={{ top: 30 }}
          destroyOnClose
          title="Test Report"
        >
          <Admin_Report_New testSubmissionId={submissionId}
          onClose={() => setShowResultModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}

export default TestList_admin_user;
