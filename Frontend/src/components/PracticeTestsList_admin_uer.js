"use client";

import { getPracticeTests } from "@/app/services/authService";
import { convertSecondsToTime } from "@/utils/utils";
import { Button, Table, Pagination, Input, Modal } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState, useRef } from "react";
import PracticeTestForm from "@/components/PracticeTestForm";
import PracticeTestReportComponent from "./PracticeTestReportComponent.js";
import PracticeTestReport from "./report-module/PracticeTestReport_admin_user.js";
import EyeIcon from "../../public/icons/eye.svg";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function PracticeTestsList({ studentId }) {
  const router = useRouter();
  const [data, setData] = useState();
  const [tableLoading, setTableLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [practiceTestReport, setPracticeTestReport] = useState(false);
  const [practiceTestId, setPracticeTestId] = useState();
  const [createTest, setCreateTest] = useState(false);
  const pathname = usePathname();
  const [sortParams, setSortParams] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const debounceTimeoutRef = useRef(null);
  const searchParams = useSearchParams();
  const studentIdFromParam = searchParams.get("student_id");

  const actionParam = searchParams.get("action");
  const subActionParam = searchParams.get("subAction");
  const reportPracticeTestIdParam = searchParams.get("reportPracticeTestId");

  const role = pathname.split("/")[2];
  console.log("role", role);
  useEffect(() => {
    const params = {
      page: current,
      page_size: pageSize,
    };

    if (studentId || studentIdFromParam) {
      params.student_id = studentId || studentIdFromParam;
    }

    if (Object.keys(sortParams).length > 0) {
      params.ordering = Object.keys(sortParams)
        .map((key) => (sortParams[key] === "asc" ? key : `-${key}`))
        .join(",");
    }

    if (debouncedSearchTerm) {
      params.search = debouncedSearchTerm;
    }

    setTableLoading(true);
    getPracticeTests(params)
      .then((res) => {
        const { results, count, current_page, total_pages } = res.data;
        setCurrent(current_page);
        setTotal(count);
        setData(results);
        setTotalPages(total_pages);
      })
      .finally(() => setTableLoading(false));
  }, [current, pageSize, sortParams, debouncedSearchTerm, studentId]);

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

  const studentCols = [
    {
      key: "test_name",
      title: "Test Name",
      dataIndex: "test_name",
      align: "center",
      render: (text) => <span className="text-[#805830] font-semibold">{text || "N/A"}</span>,
      width: 150,
      sorter: true,
      sorter: { multiple: 0 },
    },
    {
      key: "course",
      title: "Course name",
      dataIndex: "course",
      align: "center",
      render: (text) => <>{text}</>,
      width: 150,
      sorter: true,
      sorter: { multiple: 1 },
    },
    {
      key: "subject",
      title: "Subject",
      dataIndex: "subject",
      align: "center",
      render: (text) => <>{text}</>,
      width: 130,
      sorter: true,
      sorter: { multiple: 2 },
    },
    {
      key: "created_at",
      title: "Test taken on",
      dataIndex: "created_at",
      align: "center",
      render: (text) => <>{dayjs(text).format("MMM D, YYYY h:mm A")}</>,
      width: 180,
      sorter: true,
      sorter: { multiple: 3 },
    },
    {
      key: "correct_count",
      title: "Correct Count",
      dataIndex: "correct_count",
      align: "center",
      render: (_, record) => <>{record.correct_count ?? "-"}</>,
      width: 140,
      sorter: true,
      sorter: { multiple: 4 },
    },
    {
      key: "incorrect_count",
      title: "Incorrect Count",
      dataIndex: "incorrect_count",
      align: "center",
      render: (_, record) => <>{record.incorrect_count ?? "-"}</>,
      width: 150,
      sorter: true,
      sorter: { multiple: 5 },
    },
    {
      key: "time_taken",
      title: "Duration",
      dataIndex: "time_taken",
      align: "center",
      render: (_, record) => <>{convertSecondsToTime(record.time_taken)}</>,
      width: 120,
      sorter: true,
      sorter: { multiple: 6 },
    },
    {
      key: "action",
      title: "",
      dataIndex: "action",
      align: "center",
      render: (_, record) => {
        const { id } = record;
        const userId = pathname.split("/")[3];

        return (
          <Button
            type="link"
            onClick={() => {
              const urlParams = new URLSearchParams(searchParams);
              urlParams.set("subAction", "viewPracticeTestReportAdmin");
              urlParams.set("reportPracticeTestId", record.id);
              router.push(`${pathname}?${urlParams.toString()}`);
            }}
            style={{ display: "flex", alignItems: "center" }}
          >
            <Image
              src={EyeIcon}
              alt="View Result Icon"
              width={20}
              height={20}
              style={{ marginRight: "8px", verticalAlign: "middle" }}
            />
            <span style={{ verticalAlign: "middle" }}>View Result</span>
          </Button>
        );
      },
    },
  ];

  const facultyMentorCols = [
    {
      key: "student",
      title: "Student",
      dataIndex: "student",
      render: (text) => <>{text}</>,
    },
    ...studentCols,
  ];

  const colsMap = {
    student: studentCols,
    mentor: facultyMentorCols,
    faculty: facultyMentorCols,
    admin: facultyMentorCols,
  };

  // const itemRender = (_, type, originalElement) => {
  //   if (type === "prev") return <a>Previous</a>;
  //   if (type === "next") return <a>Next</a>;
  //   return originalElement;
  // };

  const handleTableChange = (pagination, filters, sorter) => {
    let sortObj = {};

    if (Array.isArray(sorter)) {
      sorter.forEach((s) => {
        if (s.order === "ascend") {
          sortObj[s.field] = "asc";
        } else if (s.order === "descend") {
          sortObj[s.field] = "desc";
        }
      });
    } else {
      if (sorter.order === "ascend") {
        sortObj[sorter.field] = "asc";
      } else if (sorter.order === "descend") {
        sortObj[sorter.field] = "desc";
      }
    }

    setSortParams(sortObj);
  };

  const handleCloseModal = () => {
    const urlParams = new URLSearchParams(searchParams);
    urlParams.delete("subAction");
    urlParams.delete("reportPracticeTestId");
    router.push(`${pathname}?${urlParams.toString()}`);
  };

  if (actionParam === "viewStudentResults" && subActionParam === "viewPracticeTestReportAdmin" && reportPracticeTestIdParam) {
    return (
      <div className="animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#2E2725] m-0 flex items-center gap-2">
            Practice Test Report
          </h2>
          <Button
            onClick={handleCloseModal}
            className="flex items-center gap-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all border-gray-200 hover:border-gray-300"
            size="middle"
          >
            ← Back to Tests
          </Button>
        </div>

        <div className="bg-white p-2 rounded-2xl">
          <PracticeTestReport
            practiceTestId={reportPracticeTestIdParam}
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
    pageSizeOptions: ['10','25', '50', '100'],
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
    <>
      <div className="flex flex-col md:flex-row justify-between items-center mb-3 gap-4">
        {/* Search */}
        <Input
          placeholder="Search by course, subject..."
          onChange={handleSearchChange}
          className="h-10 rounded-lg border-gray-300 hover:border-gray-400 focus:border-gray-600 max-w-sm"
        />

        {/* Create Test Button - Only show on Practice Tests tab */}
        {role === "student" && !studentId && (
          <Button
            type="primary"
            onClick={() => setCreateTest(true)}
            className="h-10 px-6 font-semibold shadow-sm"
          >
            Create New Practice Test
          </Button>
        )}
      </div>

      {createTest ? (
        <PracticeTestForm
          setCreateTest={setCreateTest}
          setData={setData}
          setCurrent={setCurrent}
        />
      ) : practiceTestReport ? (
        <PracticeTestReportComponent
          setPracticeTestReport={setPracticeTestReport}
          practiceTestId={practiceTestId}
        />
      ) : (
        <>
          <Table
            pagination={paginationConfig}
            loading={tableLoading}
            dataSource={data}
            columns={colsMap[role]}
            size="small"
            // rowClassName={(record, index) =>
            //   index % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-gray-100 transition-colors"
            // }
            className="border border-gray-200 rounded-lg overflow-hidden"
            scroll={{ x: "max-content" }}
            onChange={handleTableChange}
          />
        </>
      )}
    </>
  );
}

export default PracticeTestsList;
