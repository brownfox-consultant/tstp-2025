"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Tabs,
  Table,
  Button,
  Space,
  Select,
  DatePicker,
  Input,
  Tag,
  Modal,
  Tooltip, 
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "@/app/constants/apiConstants";
import dayjs from "dayjs";
import Admin_Report_New from "@/components/report-module/Admin_Report_New";
import PracticeTestReport from "@/components/report-module/PracticeTestReport_admin_user";

const { RangePicker } = DatePicker;

const TestListPage = () => {
  // ==================== DATA FETCHING STATE ====================
  const [initialFullLengthData, setInitialFullLengthData] = useState([]);
  const [initialPracticeData, setInitialPracticeData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ==================== FILTER STATE ====================
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState(null);

  // ==================== MODAL STATE ====================
  const [showResultModal, setShowResultModal] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [testType, setTestType] = useState(null);

 const ResultSummary = ({ summary }) => {
  

  const items = [
    {
      label: "All",
      value: summary.total_questions,
      color: "#374151",
      bg: "#F9FAFB",
      icon: "📋",
    },
    {
      label: "Correct",
      value: summary.correct,
      color: "#16A34A",
      bg: "#F0FDF4",
      icon: "✔",
    },
    {
      label: "Incorrect",
      value:  summary.incorrect,
      color: "#DC2626",
      bg: "#FEF2F2",
      icon: "✖",
    },
    {
      label: "Blank",
      value: summary.blank,
      color: "#6B7280",
      bg: "#F3F4F6",
      icon: "○",
    },
    {
      label: "Marked",
      value: summary.marked,
      color: "#EA580C",
      bg: "#FFF7ED",
      icon: "⚑",
    },
  ];

  return (
    <div className="w-[430px] rounded-xl overflow-hidden bg-white shadow-xl border">
      <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
        <h3 className="text-white text-sm font-semibold">
          Question Summary
        </h3>
      </div>

      <div className="grid grid-cols-5 gap-3 p-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl p-3 text-center transition-all duration-200 hover:scale-105"
            style={{ background: item.bg }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold"
              style={{
                backgroundColor: item.color + "20",
                color: item.color,
              }}
            >
              {item.icon}
            </div>

            <div
              className="text-xl font-bold"
              style={{ color: item.color }}
            >
              {item.value}
            </div>

            <div className="text-xs text-gray-500 mt-1">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FullLengthScoreCard = ({ record  }) => {
  const score = record.total_score;
const total = record.total_marks;
const percentage = record.percentage;

  return (
    <div className="w-[360px] rounded-xl overflow-hidden bg-white">
      <div
        className="p-5 text-white"
        style={{
          background: "linear-gradient(135deg,#38bdf8,#0ea5e9)",
        }}
      >
        <div className="flex justify-between text-xs font-semibold uppercase">
          <span>Total Score</span>
          <span>{percentage}%</span>
        </div>

        <div className="mt-4 flex items-end gap-2">
          <span className="text-5xl font-bold">{score}</span>
          <span className="text-sm mb-1 opacity-90">
            OUT OF {total}
          </span>
        </div>

        <div className="mt-5 h-2 rounded-full bg-white/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="rounded-lg border p-3">
          <div className="text-xs text-gray-500 uppercase">
            English
          </div>
          <div className="text-2xl font-bold text-gray-400">{record.english_score}</div>
          <div className="text-xs text-gray-400">
            OUT OF 800
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="text-xs text-gray-500 uppercase">
            Math
          </div>
          <div className="text-2xl font-bold text-gray-400">{record.math_score}</div>
          <div className="text-xs text-gray-400">
            OUT OF 800
          </div>
        </div>
      </div>
    </div>
  );
};


  // ==================== FETCH DATA ====================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Full Length Tests
      const fullRes = await axios.get(
        `${BASE_URL}/api/result/recent/full-length/?limit=100`,
        { withCredentials: true }
      );
      const fullData = fullRes.data || [];
      setInitialFullLengthData(fullData);

      // Fetch Practice Tests
      const pracRes = await axios.get(
        `${BASE_URL}/api/result/recent/practice/?limit=100`,
        { withCredentials: true }
      );
      const pracData = pracRes.data || [];
      setInitialPracticeData(pracData);
    } catch (error) {
      console.error("Failed to fetch test list:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== FILTER LOGIC ====================
  const filterData = (data) => {
    return data.filter((item) => {
      let matchesSearch = true;
      let matchesDate = true;

      // Search by Test Name or Student Name
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        matchesSearch =
          (item.test_name || "").toLowerCase().includes(query) ||
          (item.student_name || "").toLowerCase().includes(query);
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        const itemDate = new Date(item.created_at);
        const startDate = dateRange[0].startOf("day").toDate();
        const endDate = dateRange[1].endOf("day").toDate();
        matchesDate = itemDate >= startDate && itemDate <= endDate;
      }

      return matchesSearch && matchesDate;
    });
  };

  // Apply filters with memoization
  const filteredFullLengthData = useMemo(
    () => filterData(initialFullLengthData),
    [initialFullLengthData, searchQuery, dateRange]
  );

  const filteredPracticeData = useMemo(
    () => filterData(initialPracticeData),
    [initialPracticeData, searchQuery, dateRange]
  );

  // ==================== HANDLERS ====================
  const handleViewResult = (record, type) => {
    if (type === "practice") {
      setSubmissionId(record.test_submission_id || record.id);
    } else {
      setSubmissionId(record.id);
    }
    setTestType(type);
    setShowResultModal(true);
  };

  const handleCloseModal = () => {
    setShowResultModal(false);
    setSubmissionId(null);
    setTestType(null);
  };

  const handleReset = () => {
    setSearchQuery("");
    setDateRange(null);
  };

  // ==================== TABLE COLUMNS ====================
  const getTableColumns = (type) => [
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => (
        <span className="text-gray-500">
          {date ? dayjs(date).format("MMM D, YYYY h:mm A") : "-"}
        </span>
      ),
    },
    {
      title: "Test Name",
      dataIndex: "test_name",
      key: "test_name",
      sorter: (a, b) => (a.test_name || "").localeCompare(b.test_name || ""),
      render: (text) => <span className="text-[#805830]">{text || "N/A"}</span>,
    },
    {
      title: "Student Name",
      dataIndex: "student_name",
      key: "student_name",
      sorter: (a, b) =>
        (a.student_name || "").localeCompare(b.student_name || ""),
      render: (text) => (
        <span className="font-medium text-[#2E2725]">{text || "N/A"}</span>
      ),
    },
    {
      title: "Course Name",
      dataIndex: "course_name",
      key: "course_name",
      render: (text) => (
        <span className="text-gray-600 font-medium">{text || "N/A"}</span>
      ),
    },
    {
      title: "Total Score",
      dataIndex: "total_score",
      key: "total_score",
      sorter: (a, b) => (a.total_score || 0) - (b.total_score || 0),
      render: (score, record) => (
  <Tooltip
  title={
  type === "practice" ? (
    <ResultSummary summary={record} />
  ) : (
    <FullLengthScoreCard record={record} />
  )
}
  color="#fff"
  overlayInnerStyle={{
    padding: 0,
    borderRadius: 12,
  }}
  overlayStyle={{
    boxShadow: "none",
  }}
>
    <Tag
      color={score >= 500 ? "green" : "red"}
      className="rounded-full px-3 cursor-pointer"
    >
      {score ?? "N/A"}
    </Tag>
  </Tooltip>
),
    },
    {
      title: "View Result",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewResult(record, type)}
          >
            View Result
          </Button>
        </Space>
      ),
    },
  ];

  // ==================== RENDER ====================
  return (
    <div>
      {/* Page Title */}
      <h1 className="text-2xl font-bold mb-6">Test List</h1>

      {/* Filter Section */}
      <div className="bg-white p-4 mb-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <Input
            placeholder="Search by Test or Student Name"
            style={{ width: 300 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <RangePicker
            className="w-64"
            value={dateRange}
            onChange={setDateRange}
          />
          <Button
            style={{
              backgroundColor: "#f59e0b",
              borderColor: "#f59e0b",
              color: "white",
            }}
            className="hover:!bg-amber-600 hover:!border-amber-600"
          >
            Apply
          </Button>
          <Button onClick={handleReset}>Reset</Button>
        </div>
      </div>

      {/* Tabs for Full Length and Practice Tests */}
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: "Full Length Test",
            children: (
              <Table
                columns={getTableColumns("fullLength")}
                dataSource={filteredFullLengthData}
                loading={loading}
                pagination={{
                  position: ["topRight", "bottomRight"],
                  defaultPageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "25", "50", "100"],
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`,
                }}
                bordered
                className="shadow-sm rounded-lg overflow-hidden"
                rowKey={(record) => record.id || record.test_submission_id}
              />
            ),
          },
          {
            key: "2",
            label: "Practice Test",
            children: (
              <Table
                columns={getTableColumns("practice")}
                dataSource={filteredPracticeData}
                loading={loading}
                pagination={{
                  position: ["topRight", "bottomRight"],
                  defaultPageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "25", "50", "100"],
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`,
                }}
                bordered
                className="shadow-sm rounded-lg overflow-hidden"
                rowKey={(record) => record.id || record.test_submission_id}
              />
            ),
          },
        ]}
        size="large"
        className="bg-white !px-4 !mb-0 !rounded-xl shadow-sm border border-gray-100"
      />

      {/* Test Result Modal */}
      <Modal
        open={showResultModal}
        onCancel={handleCloseModal}
        footer={null}
        width="100%"
        style={{ top: 30 }}
        destroyOnClose
        title="Test Report"
      >
        {testType === "practice" ? (
          <PracticeTestReport
            practiceTestId={submissionId}
            onClose={handleCloseModal}
          />
        ) : (
          <Admin_Report_New
            testSubmissionId={submissionId}
            onClose={handleCloseModal}
          />
        )}
      </Modal>
    </div>
  );
};

export default TestListPage;
