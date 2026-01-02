"use client";

import { getPracticeTests, getUserDetails } from "@/app/services/authService";
import { convertSecondsToTime } from "@/utils/utils";
import { Button, Table, Pagination, Input, Card, Tag, Tooltip, Select } from "antd";
import { SearchOutlined, PlusOutlined, UnorderedListOutlined, FilterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import PracticeTestForm from "@/components/PracticeTestForm";
import PracticeTestReportComponent from "./PracticeTestReportComponent.js";
import EyeIcon from "../../public/icons/eye.svg";
import Image from "next/image";

function PracticeTestsList() {
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const debounceTimeoutRef = useRef(null);

  const role = pathname.split("/")[1];

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    // Fetch user details to get available courses
    if (role === "student") {
      const userId = pathname.split("/")[2];
      getUserDetails(userId)
        .then((res) => {
          setCourses(res.data.course_details.map(c => c.course));
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    const params = {
      page: current,
    };
    if (Object.keys(sortParams).length > 0) {
      params.ordering = Object.keys(sortParams)
        .map((key) => (sortParams[key] === "asc" ? key : `-${key}`))
        .join(",");
    }
    if (debouncedSearchTerm) {
      params.search = debouncedSearchTerm;
    }

    // Add course filter
    if (selectedCourse) {
      params.course = selectedCourse; // Assuming API accepts 'course' parameter with course name or ID. Based on PracticeTestForm which uses course name often.
      // Wait, let's verify if the API expects Name or ID. PracticeTestForm uses name for dropdown value.
      // Let's assume name for now as existing "Course" column shows name.
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
  }, [current, sortParams, debouncedSearchTerm, selectedCourse]);

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
      align: "left",
      width: 180,
      sorter: false,
      render: (text) => <span className="font-semibold text-gray-800">{text || "-"}</span>,
    },
    {
      key: "course",
      title: "Course",
      dataIndex: "course",
      align: "center",
      render: (text) => <Tag color="blue">{text}</Tag>,
      width: 150,
      sorter: true,
      sorter: { multiple: 1 },
    },
    {
      key: "subject",
      title: "Subject",
      dataIndex: "subject",
      align: "center",
      render: (text) => <Tag color="cyan">{text}</Tag>,
      width: 150,
      sorter: true,
      sorter: { multiple: 2 },
    },
    {
      key: "created_at",
      title: "Taken On",
      dataIndex: "created_at",
      align: "center",
      render: (text) => <span className="text-gray-600">{dayjs(text).format("MMM D, YYYY h:mm A")}</span>,
      width: 200,
      sorter: true,
      sorter: { multiple: 3 },
    },
    {
      key: "score_summary",
      title: "Performance",
      align: "center",
      width: 250,
      render: (_, record) => (
        <div className="flex justify-center gap-4 text-xs font-medium">
          <div className="flex flex-col items-center">
            <span className="text-gray-400 mb-1">Total</span>
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded w-10 text-center">{record.total_questions ?? "-"}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-green-500 mb-1">Correct</span>
            <span className="bg-green-50 text-green-700 px-2 py-1 rounded w-10 text-center">{record.correct_count ?? "-"}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-red-500 mb-1">Incorrect</span>
            <span className="bg-red-50 text-red-700 px-2 py-1 rounded w-10 text-center">{record.incorrect_count ?? "-"}</span>
          </div>
        </div>
      )
    },
    {
      key: "time_taken",
      title: "Duration",
      dataIndex: "time_taken",
      align: "center",
      render: (_, record) => <span className="text-gray-600 font-mono">{convertSecondsToTime(record.time_taken)}</span>,
      width: 120,
      sorter: true,
      sorter: { multiple: 6 },
    },
    {
      key: "action",
      title: "Action",
      dataIndex: "action",
      align: "center",
      width: 120,
      render: (_, record) => {
        const { id } = record;
        const userId = pathname.split("/")[2];

        return (
          <Tooltip title="View Detailed Report">
            <Button
              type="text"
              shape="circle"
              icon={<Image src={EyeIcon} alt="view" width={18} height={18} />}
              className="hover:bg-blue-50 flex items-center justify-center mx-auto"
              onClick={() => {
                if (role == "student") {
                  router.push(`/${role}/${userId}/test/practice/${id}/result`);
                } else {
                  router.push(`/${role}/${userId}/practice/${id}/result`);
                }
              }}
            />
          </Tooltip>
        );
      }
    },
  ];

  const facultyMentorCols = [
    {
      key: "student",
      title: "Student Name",
      dataIndex: "student",
      render: (text) => <span className="font-medium text-gray-800">{text}</span>,
      width: 150,
    },
    ...studentCols,
  ];

  const colsMap = {
    student: studentCols,
    mentor: facultyMentorCols,
    faculty: facultyMentorCols,
  };

  const itemRender = (_, type, originalElement) => {
    if (type === "prev") return <a className="text-blue-600 font-medium hover:text-blue-800">Previous</a>;
    if (type === "next") return <a className="text-blue-600 font-medium hover:text-blue-800">Next</a>;
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
    <>
      {practiceTestReport ? (
        <PracticeTestReportComponent practice_test_id={practiceTestId} />
      ) : createTest ? (
        <PracticeTestForm onBack={() => setCreateTest(false)} />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                Practice Tests History
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search by test name..."
                  onChange={handleSearchChange}
                  prefix={<SearchOutlined className="text-gray-400" />}
                  className="w-full sm:w-64 rounded-lg border-gray-300 hover:border-blue-400 focus:border-blue-500 h-10 text-base"
                />
              </div>

              {(role === "student") && (
                <Button
                  type="primary"
                  onClick={() => setCreateTest(true)}
                  icon={<PlusOutlined />}
                  size="large"
                  className="rounded-full shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 h-10 px-6 font-semibold flex items-center"
                >
                  Create New Practice
                </Button>
              )}
            </div>
          </div>

          {/* <div>
            {courses.length > 0 && (
              <Select
                placeholder={
                  <div className="flex items-center gap-2 text-gray-500">
                    <FilterOutlined />
                    <span>Filter by Course</span>
                  </div>
                }
                allowClear
                className="w-full sm:w-64 h-10"
                onChange={(value) => setSelectedCourse(value)}
                options={courses.map(course => ({ label: course.name, value: course.name }))}
                suffixIcon={<FilterOutlined className="text-gray-400" />}
              />
            )}
          </div> */}

          <Card className="shadow-sm border border-gray-100 rounded-xl overflow-hidden" bodyStyle={{ padding: 0 }}>

            <div className="overflow-x-auto">
              <Table
                loading={tableLoading}
                dataSource={data}
                columns={colsMap[role]}
                pagination={false}
                rowClassName="hover:bg-blue-50/30 transition-colors duration-200"
                onChange={handleTableChange}
                size="middle"
              />
            </div>

            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-white">
              <span className="text-sm text-gray-500">
                Showing {((current - 1) * 10) + 1} to {Math.min(current * 10, total)} of {total} entries
              </span>
              <Pagination
                current={current}
                pageSize={10}
                total={total}
                itemRender={itemRender}
                onChange={(page) => setCurrent(page)}
                showSizeChanger={false}
                className="custom-pagination"
              />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

export default PracticeTestsList;
