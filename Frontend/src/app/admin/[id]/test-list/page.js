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
  Pagination,
  Skeleton,
} from "antd";
import {
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LineOutlined,
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  HistoryOutlined,
  CheckOutlined,
  RightOutlined,
  DownOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { BASE_URL, GET_Students } from "@/app/constants/apiConstants";
import dayjs from "dayjs";
import Admin_Report_New from "@/components/report-module/Admin_Report_New";
import PracticeTestReport from "@/components/report-module/PracticeTestReport_admin_user";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const { RangePicker } = DatePicker;

const TestListPage = () => {
  const ResultSummary = ({ summary }) => {
    const items = [
      {
        label: "All",
        value: summary?.total_questions ?? 0,
        color: "#475569",
        bg: "#F8FAFC",
        icon: "📋",
      },
      {
        label: "Correct",
        value: summary?.correct ?? 0,
        color: "#16A34A",
        bg: "#F0FDF4",
        icon: "✔",
      },
      {
        label: "Incorrect",
        value: summary?.incorrect ?? 0,
        color: "#DC2626",
        bg: "#FEF2F2",
        icon: "✖",
      },
      {
        label: "Blank",
        value: summary?.blank ?? 0,
        color: "#64748B",
        bg: "#F1F5F9",
        icon: "○",
      },
      {
        label: "Marked",
        value: summary?.marked ?? 0,
        color: "#EA580C",
        bg: "#FFF7ED",
        icon: "⚑",
      },
    ];

    return (
      <div className="w-[330px] rounded-lg overflow-hidden bg-white border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="bg-blue-600 px-3 py-2 flex justify-between items-center text-white">
          <span className="text-xs font-semibold">
            Question Summary
          </span>
          <span
            className="text-xs font-semibold max-w-[130px] truncate opacity-95"
            title={summary?.student_name}
          >
            {summary?.student_name || "Student"}
          </span>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-5 gap-1 p-2 bg-white">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-lg py-1.5 px-0.5 text-center flex flex-col items-center justify-between"
              style={{ background: item.bg }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center mb-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: item.color + "20",
                  color: item.color,
                }}
              >
                {item.icon}
              </div>

              <div
                className="text-xs font-extrabold leading-none mb-1"
                style={{ color: item.color }}
              >
                {item.value}
              </div>

              <div
                className="text-[9px] font-semibold text-gray-500 truncate w-full px-0.5 leading-none"
                title={item.label}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const FullLengthScoreCard = ({ record }) => {
    return (
      <div className="w-[270px] rounded-lg overflow-hidden bg-white shadow-md border border-gray-200">
        {/* Header */}
        <div className="bg-sky-500 text-white px-3 py-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold uppercase">
              Total Score
            </span>
            <span className="text-xs font-semibold">
              {record.percentage}%
            </span>
          </div>

          <div className="mt-2 flex items-end gap-1">
            <span className="text-3xl font-bold">
              {record.total_score}
            </span>
            <span className="text-[11px] mb-1 opacity-90">
              / {record.total_marks}
            </span>
          </div>

          <div className="mt-2 h-1.5 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${record.percentage}%` }}
            />
          </div>
        </div>

        {/* Section Scores */}
        <div className="grid grid-cols-2 divide-x">
          <div className="p-3 text-center">
            <div className="text-[11px] uppercase text-gray-500">
              English
            </div>

            <div className="text-xl font-bold text-gray-800">
              {record.english_score}
            </div>

            <div className="text-[10px] text-gray-400">
              / 800
            </div>
          </div>

          <div className="p-3 text-center">
            <div className="text-[11px] uppercase text-gray-500">
              Math
            </div>

            <div className="text-xl font-bold text-gray-800">
              {record.math_score}
            </div>

            <div className="text-[10px] text-gray-400">
              / 800
            </div>
          </div>
        </div>
      </div>
    );
  };


  // ==================== DATA FETCHING STATE ====================
  const [initialFullLengthData, setInitialFullLengthData] = useState([]);
  const [initialPracticeData, setInitialPracticeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [activeTabKey, setActiveTabKey] = useState("fullLength"); //   
  const [expandedFullLengthKeys, setExpandedFullLengthKeys] = useState([]);
  const [expandedPracticeKeys, setExpandedPracticeKeys] = useState([]);
  const [flPage, setFlPage] = useState(1);
  const [flPageSize, setFlPageSize] = useState(10);
  const [prPage, setPrPage] = useState(1);
  const [prPageSize, setPrPageSize] = useState(10);
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelinePageSize, setTimelinePageSize] = useState(5);
  const [expandedTimelineKeys, setExpandedTimelineKeys] = useState([]);

  // ==================== FILTER STATE ====================
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState(null);

  // ==================== MODAL STATE ====================
  const [showResultModal, setShowResultModal] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [testType, setTestType] = useState(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const actionParam = searchParams.get("action");
  const submissionIdParam = searchParams.get("submissionId");
  const testTypeParam = searchParams.get("testType");

  // ==================== FETCH DATA ====================
  useEffect(() => {
    fetchData();
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(GET_Students, { withCredentials: true });
      setStudents(res.data || []);
    } catch (error) {
      console.error("Failed to fetch students list:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch both APIs concurrently for better performance
      const [fullRes, pracRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/result/recent/full-length/?limit=100`, { withCredentials: true }),
        axios.get(`${BASE_URL}/api/result/recent/practice/?limit=100`, { withCredentials: true })
      ]);

      setInitialFullLengthData(fullRes.data || []);
      setInitialPracticeData(pracRes.data || []);
    } catch (error) {
      console.error("Failed to fetch test list:", error);
    } finally {
      setLoading(false);
    }
  };


  // ==================== COMPUTED TRENDS ====================
  const fullLengthDataWithTrends = useMemo(() => {
    const dataCopy = [...initialFullLengthData];
    const groups = {};
    dataCopy.forEach(item => {
      const key = item.student_id || item.student_name || "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    Object.keys(groups).forEach(key => {
      // Sort ascending (chronological) to calculate trends
      groups[key].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      for (let i = 0; i < groups[key].length; i++) {
        if (i === 0) {
          groups[key][i].trend = { type: "first", text: "First Test", diff: 0, prevScore: 0 };
        } else {
          const currScore = parseInt(groups[key][i].total_score) || 0;
          const prevScore = parseInt(groups[key][i - 1].total_score) || 0;
          const diff = currScore - prevScore;
          if (diff > 0) {
            groups[key][i].trend = { type: "up", text: `+${diff}`, diff, prevScore };
          } else if (diff < 0) {
            groups[key][i].trend = { type: "down", text: `-${Math.abs(diff)}`, diff, prevScore };
          } else {
            groups[key][i].trend = { type: "flat", text: "0", diff, prevScore };
          }
        }
      }
    });
    return dataCopy;
  }, [initialFullLengthData]);

  const practiceDataWithTrends = useMemo(() => {
    const dataCopy = [...initialPracticeData];
    const groups = {};
    dataCopy.forEach(item => {
      const key = item.student_id || item.student_name || "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    Object.keys(groups).forEach(key => {
      // Sort ascending (chronological) to calculate trends
      groups[key].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      for (let i = 0; i < groups[key].length; i++) {
        if (i === 0) {
          groups[key][i].trend = { type: "first", text: "First Test", diff: 0, prevScore: 0 };
        } else {
          const currScore = parseInt(groups[key][i].correct ?? groups[key][i].total_score) || 0;
          const prevScore = parseInt(groups[key][i - 1].correct ?? groups[key][i - 1].total_score) || 0;
          const diff = currScore - prevScore;
          if (diff > 0) {
            groups[key][i].trend = { type: "up", text: `+${diff}`, diff, prevScore };
          } else if (diff < 0) {
            groups[key][i].trend = { type: "down", text: `-${Math.abs(diff)}`, diff, prevScore };
          } else {
            groups[key][i].trend = { type: "flat", text: "0", diff, prevScore };
          }
        }
      }
    });
    return dataCopy;
  }, [initialPracticeData]);

  const selectedStudentObj = useMemo(() => {
    if (!selectedStudent) return null;
    return students.find(s => s.id.toString() === selectedStudent.toString());
  }, [selectedStudent, students]);

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
        const itemDate = new Date(
          item.completion_date || item.created_at
        );
        const startDate = dateRange[0].startOf("day").toDate();
        const endDate = dateRange[1].endOf("day").toDate();
        matchesDate = itemDate >= startDate && itemDate <= endDate;
      }

      return matchesSearch && matchesDate;
    });
  };

  // Apply filters with memoization
  const filteredFullLengthData = useMemo(
    () => filterData(fullLengthDataWithTrends),
    [fullLengthDataWithTrends, searchQuery, dateRange]
  );

  const filteredPracticeData = useMemo(
    () => filterData(practiceDataWithTrends),
    [practiceDataWithTrends, searchQuery, dateRange]
  );

  // Client-side SEARCH-WITHIN-RESULTS (Local search)
  const displayedFullLength = useMemo(() => {
    let data = filteredFullLengthData;
    if (selectedStudentObj) {
      data = data.filter(item =>
        item.student_name === selectedStudentObj.name || item.student_id?.toString() === selectedStudentObj.id?.toString()
      );
    }
    if (localSearchQuery) {
      const q = localSearchQuery.toLowerCase();
      data = data.filter(item =>
        (item.test_name || "").toLowerCase().includes(q) ||
        (item.student_name || "").toLowerCase().includes(q) ||
        (item.course_name || "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [filteredFullLengthData, selectedStudentObj, localSearchQuery]);

  const displayedPractice = useMemo(() => {
    let data = filteredPracticeData;
    if (selectedStudentObj) {
      data = data.filter(item =>
        item.student_name === selectedStudentObj.name || item.student_id?.toString() === selectedStudentObj.id?.toString()
      );
    }
    if (localSearchQuery) {
      const q = localSearchQuery.toLowerCase();
      data = data.filter(item =>
        (item.test_name || "").toLowerCase().includes(q) ||
        (item.student_name || "").toLowerCase().includes(q) ||
        (item.course_name || "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [filteredPracticeData, selectedStudentObj, localSearchQuery]);

  // Combined timeline data for single student timeline view
  const combinedTimelineData = useMemo(() => {
    if (!selectedStudentObj) return [];

    const flFiltered = fullLengthDataWithTrends.filter(item =>
      item.student_name === selectedStudentObj.name || item.student_id?.toString() === selectedStudentObj.id?.toString()
    ).map(item => ({ ...item, timelineType: "fullLength" }));

    const prFiltered = practiceDataWithTrends.filter(item =>
      item.student_name === selectedStudentObj.name || item.student_id?.toString() === selectedStudentObj.id?.toString()
    ).map(item => ({ ...item, timelineType: "practice" }));

    return [...flFiltered, ...prFiltered].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }, [selectedStudentObj, fullLengthDataWithTrends, practiceDataWithTrends]);

  const displayedTimeline = useMemo(() => {
    let data = combinedTimelineData;
    if (localSearchQuery) {
      const q = localSearchQuery.toLowerCase();
      data = data.filter(item =>
        (item.test_name || "").toLowerCase().includes(q) ||
        (item.course_name || "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [combinedTimelineData, localSearchQuery]);

  // ==================== RENDERING HELPERS ====================
  const renderScoreTag = (score, record, type) => {
    if (score === undefined || score === null) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
          N/A
        </span>
      );
    }

    let colorClass = "";
    let scorePercent = 0;
    const isFL = type === "fullLength" || record.timelineType === "fullLength";

    if (isFL) {
      const totalMarks = record.total_marks || 1600;
      scorePercent = (score / totalMarks) * 100;
    } else {
      const totalQuestions = record.total_questions || 10;
      scorePercent = (score / totalQuestions) * 100;
    }

    if (scorePercent >= 80) {
      colorClass = "text-emerald-700";
    } else if (scorePercent >= 50) {
      colorClass = "text-amber-700";
    } else {
      colorClass = "text-rose-700";
    }

    const tooltipContent = (!isFL) ? (
      <ResultSummary summary={record} />
    ) : (
      <FullLengthScoreCard record={record} />
    );

    return (
      <Tooltip
        title={tooltipContent}
        color="#fff"
        overlayInnerStyle={{ padding: 0, borderRadius: 12 }}
        overlayStyle={{ boxShadow: "none" }}
      >
        <span
          onClick={(e) => e.stopPropagation()}
          className={`prevent-row-expand inline-flex items-center text-sm font-bold transition-all duration-200 cursor-pointer ${colorClass}`}
        >
          {score}
        </span>
      </Tooltip>
    );
  };

  const renderTrendIndicator = (trend) => {
    if (!trend || trend.type === "first") {
      return (
        <span
          onClick={(e) => e.stopPropagation()}
          className="prevent-row-expand text-[10px] text-gray-400 font-medium ml-2 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100 whitespace-nowrap cursor-default"
        >
          First Test
        </span>
      );
    }

    if (trend.type === "up") {
      return (
        <span
          onClick={(e) => e.stopPropagation()}
          className="prevent-row-expand inline-flex items-center text-[11px] text-emerald-600 font-bold ml-2 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 whitespace-nowrap cursor-default"
          title={`Improved by ${trend.diff} points`}
        >
          <ArrowUpOutlined className="mr-0.5 text-[9px]" /> {trend.text}
        </span>
      );
    }

    if (trend.type === "down") {
      return (
        <span
          onClick={(e) => e.stopPropagation()}
          className="prevent-row-expand inline-flex items-center text-[11px] text-rose-600 font-bold ml-2 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-100 whitespace-nowrap cursor-default"
          title={`Dropped from ${trend.prevScore} (fell by ${Math.abs(trend.diff)} points)`}
        >
          <ArrowDownOutlined className="mr-0.5 text-[9px]" /> {trend.text}
        </span>
      );
    }

    return (
      <span
        onClick={(e) => e.stopPropagation()}
        className="prevent-row-expand inline-flex items-center text-[11px] text-gray-500 font-semibold ml-2 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100 whitespace-nowrap cursor-default"
      >
        <LineOutlined className="mr-0.5 text-[9px]" /> {trend.text}
      </span>
    );
  };

  // ==================== HANDLERS ====================
  const handleViewResult = (record, type) => {
    let subId = "";
    let tType = "";
    if (type === "practice" || record.timelineType === "practice") {
      subId = record.test_submission_id || record.id;
      tType = "practice";
    } else {
      subId = record.id;
      tType = "fullLength";
    }
    const updatedSearchParams = new URLSearchParams(searchParams);
    updatedSearchParams.set("action", "viewResult");
    updatedSearchParams.set("submissionId", subId);
    updatedSearchParams.set("testType", tType);
    router.push(`${pathname}?${updatedSearchParams.toString()}`);
  };

  const handleCloseModal = () => {
    const updatedSearchParams = new URLSearchParams(searchParams);
    updatedSearchParams.delete("action");
    updatedSearchParams.delete("submissionId");
    updatedSearchParams.delete("testType");
    router.push(`${pathname}?${updatedSearchParams.toString()}`);
  };

  const handleReset = () => {
    setSearchQuery("");
    setDateRange(null);
    setSelectedStudent(null);
    setLocalSearchQuery("");
  };

  const handleTimelinePageChange = (page, pageSize) => {
    setTimelinePage(page);
    if (pageSize) setTimelinePageSize(pageSize);
  };

  const paginatedTimelineData = useMemo(() => {
    const startIndex = (timelinePage - 1) * timelinePageSize;
    return displayedTimeline.slice(startIndex, startIndex + timelinePageSize);
  }, [displayedTimeline, timelinePage, timelinePageSize]);

  // ==================== TABLE COLUMNS ====================
  const getTableColumns = (type) => [
    ...(type === "fullLength"
      ? [
        {
          title: "Completion Date",
          dataIndex: "completion_date",
          key: "completion_date",
          sorter: (a, b) =>
            new Date(a.completion_date || a.created_at) -
            new Date(b.completion_date || b.created_at),
          render: (_, record) => {
            const date = record.completion_date || record.created_at;

            return (
              <span className="text-gray-500 font-medium">
                {date ? dayjs(date).format("MMM D, YYYY h:mm A") : "-"}
              </span>
            );
          },
        },
      ]
      : [
        {
          title: "Date",
          dataIndex: "created_at",
          key: "created_at",
          sorter: (a, b) =>
            new Date(a.created_at) - new Date(b.created_at),
          render: (date) => (
            <span className="text-gray-500 font-medium">
              {date ? dayjs(date).format("MMM D, YYYY h:mm A") : "-"}
            </span>
          ),
        },
      ]),
    {
      title: "Test Name",
      dataIndex: "test_name",
      key: "test_name",
      sorter: (a, b) => (a.test_name || "").localeCompare(b.test_name || ""),
      render: (text) => <span className="text-[#805830] font-semibold">{text || "N/A"}</span>,
    },
    {
      title: "Student Name",
      dataIndex: "student_name",
      key: "student_name",
      sorter: (a, b) =>
        (a.student_name || "").localeCompare(b.student_name || ""),
      render: (text) => (
        <span className="font-semibold text-[#2E2725]">{text || "N/A"}</span>
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
        <div
          className="flex items-center prevent-row-expand"
          onClick={(e) => e.stopPropagation()}
        >
          {renderScoreTag(score, record, type)}
          {renderTrendIndicator(record.trend)}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-center">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            style={{ backgroundColor: "#f59e0b", borderColor: "#f59e0b", color: "white" }}
            className="hover:!bg-amber-600 hover:!border-amber-600 font-medium shadow-sm flex items-center gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              handleViewResult(record, type);
            }}
          >
            View Result
          </Button>
        </div>
      ),
      width: 130,
    },
  ];



  if (actionParam === "viewResult" && submissionIdParam) {
    return (
      <div className="pb-10 animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-[#2E2725] m-0 flex items-center gap-2">
            Test Report
          </h1>
          <Button
            onClick={handleCloseModal}
            className="flex items-center gap-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all border-gray-200 hover:border-gray-300"
            size="large"
          >
            ← Back to Test List
          </Button>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[70vh]">
          {testTypeParam === "practice" ? (
            <PracticeTestReport
              practiceTestId={submissionIdParam}
              onClose={handleCloseModal}
            />
          ) : (
            <Admin_Report_New
              testSubmissionId={submissionIdParam}
              onClose={handleCloseModal}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-[#2E2725] mb-2 flex items-center gap-2">

        Test List
      </h1>

      {/* Filter Section */}
      <div className="bg-white p-4 mb-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-3">
          {/* Student Selector Autocomplete */}
          <Select
            showSearch
            placeholder="Search student to view timeline..."
            optionFilterProp="children"
            style={{ width: 280 }}
            value={selectedStudent}
            onChange={(value) => {
              setSelectedStudent(value);
              setTimelinePage(1);
              setLocalSearchQuery("");
            }}
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={[
              { value: "", label: "All Students (Flat Table)" },
              ...students.map(s => ({ value: s.id.toString(), label: s.name }))
            ]}
            suffixIcon={<UserOutlined className="text-gray-400" />}
            className="h-10 text-sm hover:border-amber-400 focus:border-amber-500 rounded-lg"
          />

          <Input
            placeholder="Search by Test, Student, or Course..."
            style={{ width: 320 }}
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              setLocalSearchQuery(val);
            }}
            allowClear
            className="h-10 text-sm rounded-lg"
            prefix={<SearchOutlined className="text-gray-400 mr-1" />}
          />

          <RangePicker
            className="h-10 w-64 rounded-lg"
            value={dateRange}
            onChange={setDateRange}
          />
          <Button
            style={{
              backgroundColor: "#f59e0b",
              borderColor: "#f59e0b",
              color: "white",
            }}
            className="!h-10 hover:!bg-amber-600 hover:!border-amber-600 rounded-lg font-semibold flex items-center px-4"
            onClick={fetchData}
          >
            Apply Filters
          </Button>
          <Button onClick={handleReset} className="!h-10 rounded-lg flex items-center">Reset</Button>
        </div>
      </div>

      {/* Segmented Table Card View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        {selectedStudentObj && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 mb-4 bg-amber-50/60 border border-amber-100 rounded-xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f59e0b] text-white font-bold text-base flex items-center justify-center shadow-xs">
                {selectedStudentObj.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  {selectedStudentObj.name}
                  <span className="text-[10px] font-bold uppercase text-[#f59e0b] bg-white border border-amber-200 px-2 py-0.5 rounded-full">
                    Student Profile Filter
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Showing tests for this student ({displayedFullLength.length} Full Length, {displayedPractice.length} Practice)
                </p>
              </div>
            </div>
            <Button
              icon={<ClearOutlined />}
              size="small"
              className="hover:!text-amber-600 hover:!border-amber-600 rounded-lg flex items-center gap-1.5 text-xs font-semibold"
              onClick={() => {
                setSelectedStudent(null);
                setLocalSearchQuery("");
              }}
            >
              Clear Student Filter
            </Button>
          </div>
        )}
        {/* Modern Segmented Pill Switcher Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100">
          <div className="inline-flex items-center bg-gray-100/90 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTabKey("fullLength")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeTabKey === "fullLength"
                  ? "bg-[#f59e0b] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <span>Full Length Test</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTabKey === "fullLength"
                    ? "bg-white/25 text-white"
                    : "bg-gray-200 text-gray-700"
                  }`}
              >
                {displayedFullLength.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTabKey("practice")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeTabKey === "practice"
                  ? "bg-[#f59e0b] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <span>Practice Test</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTabKey === "practice"
                    ? "bg-white/25 text-white"
                    : "bg-gray-200 text-gray-700"
                  }`}
              >
                {displayedPractice.length}
              </span>
            </button>
          </div>
        </div>

        {/* Render Table based on Segmented Switcher selection */}
        {activeTabKey === "fullLength" ? (
          loading && displayedFullLength.length === 0 ? (
            <div className="bg-white rounded-xl p-4 mt-4 border border-gray-100 shadow-sm animate-pulse">
              {/* Header Skeleton */}
              <div className="flex gap-4 border-b border-gray-100 pb-4 mb-5">
                <Skeleton.Button active size="small" style={{ width: 100 }} />
                <Skeleton.Button active size="small" style={{ width: 160 }} />
                <Skeleton.Button active size="small" style={{ width: 220 }} />
                <Skeleton.Button active size="small" style={{ width: 120 }} />
                <Skeleton.Button active size="small" style={{ width: 120 }} />
                <Skeleton.Button active size="small" style={{ width: 80 }} />
              </div>
              {/* Rows Skeleton */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-4 mb-6 items-center">
                  <Skeleton.Button active size="small" style={{ width: 90, borderRadius: 16 }} />
                  <Skeleton.Input active size="small" style={{ width: 140 }} />
                  <Skeleton.Input active size="small" style={{ width: 200 }} />
                  <Skeleton.Input active size="small" style={{ width: 120 }} />
                  <Skeleton.Input active size="small" style={{ width: 120 }} />
                  <Skeleton.Button active size="small" style={{ width: 70, borderRadius: 16 }} />
                </div>
              ))}
            </div>
          ) : (
            <Table
              size="small"
              columns={getTableColumns("fullLength")}
              dataSource={displayedFullLength}
              expandable={{
                showExpandColumn: false,
                expandedRowRender: (record) => (
                  <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-6 animate-fadeIn">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-extrabold text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md tracking-wider">
                          Full Length Mock
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 pt-1">Student: <span className="font-bold text-gray-800">{record.student_name}</span></p>
                      <p className="text-xs text-gray-600">Test: <span className="font-bold text-gray-800">{record.test_name}</span></p>
                      <p className="text-xs text-gray-500">Submitted: <span className="font-medium text-gray-700">{dayjs(record.created_at).format("MMM D, YYYY h:mm A")}</span></p>
                    </div>
                    <div className="flex items-center gap-5 flex-wrap">
                      <FullLengthScoreCard record={record} />
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        style={{ backgroundColor: "#f59e0b", borderColor: "#f59e0b", color: "white" }}
                        className="hover:!bg-amber-600 hover:!border-amber-600 font-bold px-4 h-10 rounded-xl flex items-center gap-1.5 shadow-sm"
                        onClick={() => handleViewResult(record, "fullLength")}
                      >
                        View Full Report
                      </Button>
                    </div>
                  </div>
                ),
                rowExpandable: () => true,
                expandedRowKeys: expandedFullLengthKeys,
                onExpandedRowsChange: setExpandedFullLengthKeys,
              }}
              onRow={(record) => ({
                onClick: (e) => {
                  if (
                    e.target.closest("button") ||
                    e.target.closest(".ant-tag") ||
                    e.target.closest(".ant-tooltip") ||
                    e.target.closest(".ant-table-row-expand-icon") ||
                    e.target.closest(".prevent-row-expand")
                  ) return;
                  const key = record.id || record.test_submission_id;
                  if (expandedFullLengthKeys.includes(key)) {
                    setExpandedFullLengthKeys(expandedFullLengthKeys.filter(k => k !== key));
                  } else {
                    setExpandedFullLengthKeys([...expandedFullLengthKeys, key]);
                  }
                }
              })}
              pagination={{
                current: flPage,
                pageSize: flPageSize,
                onChange: (page, size) => {
                  setFlPage(page);
                  setFlPageSize(size);
                },
                position: ["topRight", "bottomRight"],
                showSizeChanger: true,
                pageSizeOptions: ["10", "25", "50", "100"],
                showTotal: (total, range) => {
                  let inputValue = "";
                  const totalPages = Math.ceil(total / flPageSize);
                  const handleGoToPage = () => {
                    const page = Number(inputValue);
                    if (page >= 1 && page <= totalPages) {
                      setFlPage(page);
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
              }}
              bordered
              rowClassName={() => "group cursor-pointer hover:bg-slate-50/50 transition-colors"}
              className="shadow-sm rounded-lg overflow-hidden mt-0 [&_.ant-table-tbody>tr>td]:!py-1 [&_.ant-table-thead>tr>th]:!py-1.5 [&_.ant-table-pagination-top]:!my-1.5 [&_.ant-table-pagination-top]:!mt-0"
              rowKey={(record) => record.id || record.test_submission_id}
            />
          )
        ) : (
          loading && displayedPractice.length === 0 ? (
            <div className="bg-white rounded-xl p-4 mt-4 border border-gray-100 shadow-sm animate-pulse">
              {/* Header Skeleton */}
              <div className="flex gap-4 border-b border-gray-100 pb-4 mb-5">
                <Skeleton.Button active size="small" style={{ width: 100 }} />
                <Skeleton.Button active size="small" style={{ width: 160 }} />
                <Skeleton.Button active size="small" style={{ width: 220 }} />
                <Skeleton.Button active size="small" style={{ width: 120 }} />
                <Skeleton.Button active size="small" style={{ width: 120 }} />
                <Skeleton.Button active size="small" style={{ width: 80 }} />
              </div>
              {/* Rows Skeleton */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-4 mb-6 items-center">
                  <Skeleton.Button active size="small" style={{ width: 90, borderRadius: 16 }} />
                  <Skeleton.Input active size="small" style={{ width: 140 }} />
                  <Skeleton.Input active size="small" style={{ width: 200 }} />
                  <Skeleton.Input active size="small" style={{ width: 120 }} />
                  <Skeleton.Input active size="small" style={{ width: 120 }} />
                  <Skeleton.Button active size="small" style={{ width: 70, borderRadius: 16 }} />
                </div>
              ))}
            </div>
          ) : (
            <Table
              size="small"
              columns={getTableColumns("practice")}
              dataSource={displayedPractice}
              expandable={{
                showExpandColumn: false,
                expandedRowRender: (record) => (
                  <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-6 animate-fadeIn">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md tracking-wider">
                          Practice Details
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 pt-1">Student: <span className="font-bold text-gray-800">{record.student_name}</span></p>
                      <p className="text-xs text-gray-600">Test: <span className="font-bold text-gray-800">{record.test_name}</span></p>
                      <p className="text-xs text-gray-500">Submitted: <span className="font-medium text-gray-700">{dayjs(record.created_at).format("MMM D, YYYY h:mm A")}</span></p>
                    </div>
                    <div className="flex items-center gap-5 flex-wrap">
                      <ResultSummary summary={record} />
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        style={{ backgroundColor: "#f59e0b", borderColor: "#f59e0b", color: "white" }}
                        className="hover:!bg-amber-600 hover:!border-amber-600 font-bold px-4 h-10 rounded-xl flex items-center gap-1.5 shadow-sm"
                        onClick={() => handleViewResult(record, "practice")}
                      >
                        View Full Report
                      </Button>
                    </div>
                  </div>
                ),
                rowExpandable: () => true,
                expandedRowKeys: expandedPracticeKeys,
                onExpandedRowsChange: setExpandedPracticeKeys,
              }}
              onRow={(record) => ({
                onClick: (e) => {
                  if (
                    e.target.closest("button") ||
                    e.target.closest(".ant-tag") ||
                    e.target.closest(".ant-tooltip") ||
                    e.target.closest(".ant-table-row-expand-icon") ||
                    e.target.closest(".prevent-row-expand")
                  ) return;
                  const key = record.id || record.test_submission_id;
                  if (expandedPracticeKeys.includes(key)) {
                    setExpandedPracticeKeys(expandedPracticeKeys.filter(k => k !== key));
                  } else {
                    setExpandedPracticeKeys([...expandedPracticeKeys, key]);
                  }
                }
              })}
              pagination={{
                current: prPage,
                pageSize: prPageSize,
                onChange: (page, size) => {
                  setPrPage(page);
                  setPrPageSize(size);
                },
                position: ["topRight", "bottomRight"],
                showSizeChanger: true,
                pageSizeOptions: ["10", "25", "50", "100"],
                showTotal: (total, range) => {
                  let inputValue = "";
                  const totalPages = Math.ceil(total / prPageSize);
                  const handleGoToPage = () => {
                    const page = Number(inputValue);
                    if (page >= 1 && page <= totalPages) {
                      setPrPage(page);
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
              }}
              bordered
              rowClassName={() => "group cursor-pointer hover:bg-slate-50/50 transition-colors"}
              className="shadow-sm rounded-lg overflow-hidden mt-0 [&_.ant-table-tbody>tr>td]:!py-1 [&_.ant-table-thead>tr>th]:!py-1.5 [&_.ant-table-pagination-top]:!my-1.5 [&_.ant-table-pagination-top]:!mt-0"
              rowKey={(record) => record.id || record.test_submission_id}
            />
          )
        )}
      </div>
    </div>
  );
};

export default TestListPage;
