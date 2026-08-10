"use client";

import { getPracticeTests, getUserDetails } from "@/app/services/authService";
import { convertSecondsToTime } from "@/utils/utils";
import { Button, Table, Pagination, Input, Card, Tag, Tooltip, Select } from "antd";
import { SearchOutlined, PlusOutlined, UnorderedListOutlined, FilterOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import PracticeTestForm from "@/components/PracticeTestForm";
import PracticeTestReportComponent from "./PracticeTestReportComponent.js";
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
  const [pageSize, setPageSize] = useState(10);
  


  const role = pathname.split("/")[1];

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const inProgressTest = data?.find(
  (item) => item.status === "IN_PROGRESS"
);

  // Highlight function to highlight search term
  const highlightText = (text, search) => {
    if (!search || !text) return text;
    
    const parts = String(text).split(new RegExp(`(${search})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <span key={index} style={{ backgroundColor: '#fff59d', fontWeight: '600' }}>
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

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
    page_size: pageSize,
  };

  if (Object.keys(sortParams).length > 0) {
    params.ordering = Object.keys(sortParams)
      .map((key) => (sortParams[key] === "asc" ? key : `-${key}`))
      .join(",");
  }

  if (debouncedSearchTerm) {
    params.search = debouncedSearchTerm;
  }

  if (selectedCourse) {
    params.course = selectedCourse;
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
}, [current, pageSize, sortParams, debouncedSearchTerm, selectedCourse]);


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
      width: 80,
      sorter: false,
      render: (text, record) => {
        const { id } = record;
        const userId = pathname.split("/")[2];
        
        return (
          <button
            onClick={() => {
              if (role === "student") {
                router.push(`/${role}/${userId}/test/practice/${id}/result`);
              } else {
                router.push(`/${role}/${userId}/practice/${id}/result`);
              }
            }}
            className="font-semibold  hover:text-blue-600 hover:underline cursor-pointer text-left transition-colors duration-200 bg-transparent text-blue-600"
          >
            {highlightText(text || "-", debouncedSearchTerm)}
          </button>
        );
      },
    },
    {
      key: "course",
      title: "Course",
      dataIndex: "course",
      align: "center",
      render: (text) => <Tag color="blue">{text}</Tag>,
      width: 110,
      sorter: false,
    },
    {
      key: "subject",
      title: "Subject",
      dataIndex: "subject",
      align: "center",
      render: (text) => <Tag color="cyan">{text}</Tag>,
      width: 110,
      sorter: false,
    },
    {
      key: "created_at",
      title: "Taken On",
      dataIndex: "created_at",
      align: "center",
      render: (text) => <span className="text-gray-600">{dayjs(text).format("MMM D, YYYY h:mm A")}</span>,
      width: 170,
      sorter: false,
    },
    {
      key: "score_summary",
      dataIndex: "performance",
      title: "Performance",
      align: "center",
      sorter: false,
      width: 140,
    render: (_, record) => {
  if (record.status === "IN_PROGRESS") {
    return (
      <Tag color="processing">
        Test In Progress
      </Tag>
    );
  }

  return (
    <div className="flex justify-center gap-3 text-xs font-medium">
      <div className="flex flex-col items-center">
        <span className="text-gray-400 mb-1">Total</span>
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded w-10 text-center">
          {record.total_questions ?? "-"}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-green-500 mb-1">Correct</span>
        <span className="bg-green-50 text-green-700 px-2 py-1 rounded w-10 text-center">
          {record.correct_count ?? "-"}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-red-500 mb-1">Incorrect</span>
        <span className="bg-red-50 text-red-700 px-2 py-1 rounded w-10 text-center">
          {record.incorrect_count ?? "-"}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-yellow-500 mb-1">Skipped</span>
        <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded w-10 text-center">
          {record.skipped_count ?? "-"}
        </span>
      </div>
    </div>
  );
}

    },
    {
  key: "time_taken",
  title: "Duration",
  dataIndex: "time_taken",
  align: "center",
  width: 80,
  sorter: false,
  render: (_, record) => {
    if (record.status === "IN_PROGRESS") {
      return (
        <span className="text-gray-400">
          -
        </span>
      );
    }

    return (
      <span className="text-gray-600 font-mono">
        {convertSecondsToTime(record.time_taken)}
      </span>
    );
  },
},
    {
      key: "action",
      title: "Action",
      dataIndex: "action",
      align: "center",
      fixed: 'right',
      width: 50,
      render: (_, record) => {
  const { id, status } = record;
  const userId = pathname.split("/")[2];

  if (status === "IN_PROGRESS") {
    return (
      <Button
        type="primary"
        size="small"
        onClick={() =>
          router.push(
            `/${role}/${userId}/practice/${id}/info`
          )
        }
      >
        Continue
      </Button>
    );
  }

  return (
    <Tooltip title="View Detailed Report">
      <Button
        type="text"
        shape="circle"
        icon={<EyeOutlined />}
        className="hover:bg-blue-50 flex items-center justify-center mx-auto"
        onClick={() => {
          if (role === "student") {
            router.push(
              `/${role}/${userId}/test/practice/${id}/result`
            );
          } else {
            router.push(
              `/${role}/${userId}/practice/${id}/result`
            );
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

  const applySorter = (s) => {
    if (!s.order) return;

    // 🔥 CUSTOM LOGIC FOR PERFORMANCE COLUMN
    if (s.field === "performance") {
      if (s.order === "descend") {
        // ↓ Best performance → max correct
        sortObj["correct_count"] = "desc";
      } else if (s.order === "ascend") {
        // ↑ Worst performance → max incorrect
        sortObj["incorrect_count"] = "desc";
      }
      return;
    }

    // ✅ Normal sorting
    sortObj[s.field] = s.order === "ascend" ? "asc" : "desc";
  };

  if (Array.isArray(sorter)) {
    sorter.forEach(applySorter);
  } else {
    applySorter(sorter);
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
          <div className="flex flex-col flex-wrap sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="lg:text-2xl text-xl font-bold text-gray-800 flex items-center gap-2">
                Practice Tests History
              </h1>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
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
  icon={
    inProgressTest ? (
      <UnorderedListOutlined />
    ) : (
      <PlusOutlined />
    )
  }
  onClick={() => {
    const userId = pathname.split("/")[2];

    if (inProgressTest) {
      router.push(
        `/${role}/${userId}/practice/${inProgressTest.id}/info`
      );
    } else {
      setCreateTest(true);
    }
  }}
>
  {inProgressTest
    ? "Continue Practice"
    : "Create New Practice"}
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
                scroll={{ x: 1000 }}
              />
            </div>

            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-white">
              <span className="text-sm text-gray-500">
                Showing {((current - 1) * pageSize) + 1} to {Math.min(current * pageSize, total)} of {total} entries
              </span>
              <Pagination
  current={current}
  pageSize={pageSize}
  total={total}
  itemRender={itemRender}
  onChange={(page, size) => {
    setCurrent(page);
    setPageSize(size);
  }}
  showSizeChanger
  pageSizeOptions={[10, 20, 50, 100]}
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
