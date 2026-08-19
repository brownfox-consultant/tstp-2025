"use client";

import { getTestsList } from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import { resetTestSlice } from "@/lib/features/test/testSlice";
import useFullScreen from "@/utils/useFullScreen";
import { WarningOutlined, ArrowLeftOutlined } from "@ant-design/icons";
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


  const role = pathname.split("/")[2];
  const { setTestRunning, setCollapsed } = useGlobalContext();
  const { isFullScreen, goFullScreen, exitFullScreen } = useFullScreen();

  const [submissionId, setSubmissionId] = useState();
  const dispatch = useDispatch();
  const [pageSize, setPageSize] = useState(10);
  const [sortParams, setSortParams] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const debounceTimeoutRef = useRef(null);

  const actionParam = searchParams.get("action");
  const subActionParam = searchParams.get("subAction");
  const reportSubmissionIdParam = searchParams.get("reportSubmissionId");

  useEffect(() => {
    setTestRunning(false);
    setCollapsed(false);
    if (isFullScreen) exitFullScreen();
  }, []);

  useEffect(() => {
    setTableLoading(true);
    const params = {
      page: current,
      page_size: pageSize,
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
  }, [current, pageSize, sortParams, debouncedSearchTerm, studentIdFromParam]);

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
      title: <div className="flex items-center justify-center">Test name</div>,
      key: "name",
      dataIndex: "name",
      render: (text) => <>{text}</>,
      sorter: true,
      width: 140,
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
      width: 180,
      sorter: { multiple: 3 },
    },
    {
      title: <div className="flex items-center justify-center">Test taken on</div>,
      key: "completion_date",
      dataIndex: "completion_date",
      align: "center",
      render: (text) =>
        text ? dayjs(new Date(text)).format("MMM D, YYYY h:mm A") : "-",
      width: 180,
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
      width: 80,
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
                const urlParams = new URLSearchParams(searchParams);
                urlParams.set("subAction", "viewTestReportAdmin");
                urlParams.set("reportSubmissionId", record.test_submission_id);
                router.push(`${pathname}?${urlParams.toString()}`);
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

        // Disable Start/Continue for admin viewing another student
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

  const handleCloseModal = () => {
    const urlParams = new URLSearchParams(searchParams);
    urlParams.delete("subAction");
    urlParams.delete("reportSubmissionId");
    router.push(`${pathname}?${urlParams.toString()}`);
  };

  if (subActionParam === "viewTestReportAdmin" && reportSubmissionIdParam) {
    return (
      <div className="animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#2E2725] m-0 flex items-center gap-2">
            Test Report Details
          </h2>
          <Button
            onClick={handleCloseModal}
            className="flex items-center gap-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all border-gray-200 hover:border-gray-300"
            size="middle"
          >
             <ArrowLeftOutlined className="text-sm" /> Back to Tests
          </Button>
        </div>

        <div className="bg-white p-2 rounded-2xl">
          <Admin_Report_New
            testSubmissionId={reportSubmissionIdParam}
            onClose={handleCloseModal}
          />
        </div>
      </div>
    );
  }

  const paginationConfig = {
    current: current,
    total: total,
    pageSize: pageSize,
    showSizeChanger: true,
    pageSizeOptions: ['15', '25', '50', '100'],
    position: ["bottomRight"],
    onChange: (page, size) => {
      setCurrent(page);
      setPageSize(size);
    },
    showTotal: (total, range) => {
      let inputValue = "";
      const totalPages = Math.ceil(total / pageSize);
      const handleGoToPage = () => {
        const page = Number(inputValue);
        if (page >= 1 && page <= totalPages) {
          setCurrent(page);
        }
      };
      return (
        <div className="flex items-center gap-2">
          <span>
            Showing {range[0]}–{range[1]} of {total}
          </span>
          <span>| Go to page:</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            size="small"
            style={{ width: 70 }}
            onChange={(e) => (inputValue = e.target.value)}
            onPressEnter={handleGoToPage}
          />
          <Button type="primary" size="small" onClick={handleGoToPage}>
            Go
          </Button>
        </div>
      );
    },
  };

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <Input
          placeholder="Search Full Length Test"
          onChange={handleSearchChange}
          className="h-10 rounded-lg border-gray-300 hover:border-gray-400 focus:border-gray-600 max-w-sm"
        />
      </div>

      <Table
        size="small"
        dataSource={testsData}
        loading={tableLoading}
        columns={columns}
        rowKey="key"
        scroll={{ x: "max-content" }}
        pagination={paginationConfig}
        className="[&_.ant-table-thead>tr>th]:!bg-gray-100 [&_.ant-table-thead>tr>th]:!text-gray-700 border border-gray-200 rounded-lg overflow-hidden"
        onChange={handleTableChange}
      />
    </div>
  );
}

export default TestList_admin_user;
