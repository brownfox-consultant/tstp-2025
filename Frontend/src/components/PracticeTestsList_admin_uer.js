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

  const role = pathname.split("/")[1];
  console.log("role", role);
  useEffect(() => {
    const params = {
      page: current,
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
  }, [current, sortParams, debouncedSearchTerm, studentId]);

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
      width: 250,
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
      width: 130,
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
        const userId = pathname.split("/")[2];

        return (
          <Button
            type="link"
            onClick={() => {
              setPracticeTestId(record.id);
              setIsModalOpen(true);
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

  const itemRender = (_, type, originalElement) => {
    if (type === "prev") return <a>Previous</a>;
    if (type === "next") return <a>Next</a>;
    return originalElement;
  };

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

  return (
    <>
      {practiceTestReport ? (
        <PracticeTestReportComponent practice_test_id={practiceTestId} />
      ) : createTest ? (
        <PracticeTestForm />
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Search"
              onChange={handleSearchChange}
              className="h-10 rounded-lg border-gray-300 hover:border-gray-400 focus:border-gray-600 max-w-lg"
            />
            {/* {role === "student" && (
              <Button
                type="primary"
                onClick={() => {
                  setCreateTest(true); // ✅ Start Practice Test
                }}
              >
                Start Practice Test
              </Button>
            )} */}
          </div>

          <Table
            footer={() => (
              <div className="footer-container">
                <div className="flex justify-end">
                  Page {current} of {totalPages} (Total: {total} records)
                </div>
                <Pagination
                  className="size-changer"
                  current={current}
                  pageSize={10}
                  total={total}
                  itemRender={itemRender}
                  onChange={(page) => setCurrent(page)}
                  showSizeChanger={false}
                />
              </div>
            )}
            loading={tableLoading}
            dataSource={data}
            columns={colsMap[role]}
            pagination={false}
            rowClassName={(record, index) =>
              index % 2 === 0 ? "even-row" : "odd-row"
            }
            className="tablestyles mt-4"
            scroll={{ x: "max-content", y: 550 }}
            onChange={handleTableChange}
          />
        </>
      )}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width="88%"
        bodyStyle={{ maxHeight: "85vh", overflowY: "auto" }}
        centered
      >
        <PracticeTestReport
          practiceTestId={practiceTestId}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
}

export default PracticeTestsList;
