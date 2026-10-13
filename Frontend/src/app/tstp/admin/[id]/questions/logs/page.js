"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  Spin,
  Card,
  Input,
  DatePicker,
  Button,
  Row,
  Col,
  Modal,
  Select,
  Statistic,
  Tag,
  Divider,
  message,
} from "antd";
import { BASE_URL } from "@/app/constants/apiConstants";
import dayjs from "dayjs";
import Loading from "@/app/loading";
import { getQuestionDetails } from "@/app/services/authService";
import { alphatbetArray } from "@/utils/utils";
import GridInOptions from "@/components/question-list/gridin-options";
import MathContent from "@/components/MathContent";
import { LeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { RangePicker } = DatePicker;

const EMPTY_FILTERS = {
  srno: "",
  name: "",
  dateRange: [],
};

export default function QuestionLogsPage() {
  const [logs, setLogs] = useState([]);
  const [dailyCount, setDailyCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [userOptions, setUserOptions] = useState([]);
  const router = useRouter();

  // Question review modal state
  const [showModal, setShowModal] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [modalData, setModalData] = useState({});
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [currentSrno, setCurrentSrno] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const handleBack = () => router.back();

  // activeFilters lets Reset fetch with empty filters immediately, without
  // waiting for React's asynchronous setFilters update.
  const fetchLogs = async (
    page = 1,
    pageSize = pagination.pageSize,
    activeFilters = filters
  ) => {
    try {
      setLoading(true);

      const params = {
        page: Number(page) || 1,
        page_size: Number(pageSize) || 50,
      };

      if (activeFilters.srno?.trim()) {
        params.srno = activeFilters.srno.trim();
      }

      if (activeFilters.name) {
        params.name = activeFilters.name;
      }

      if (activeFilters.dateRange?.length === 2) {
        params.start_date = activeFilters.dateRange[0].format("YYYY-MM-DD");
        params.end_date = activeFilters.dateRange[1].format("YYYY-MM-DD");
      }

      const response = await axios.get(
        `${BASE_URL}/api/question/logs-and-daily-count/`,
        {
          params,
          withCredentials: true,
        }
      );

      // Supports the backend response where logs and daily summary are inside
      // the paginated response's results object.
      const payload = response.data?.results || {};
      setLogs(Array.isArray(payload.logs) ? payload.logs : []);
      setDailyCount(payload.daily_question_count || null);

      setPagination({
        current: Number(page) || 1,
        pageSize: Number(pageSize) || 50,
        total: Number(response.data?.count) || 0,
      });
    } catch (error) {
      console.error("Failed to fetch question logs:", error);
      const detail = error?.response?.data?.detail;
      message.error(detail || "Failed to fetch question logs. Please check the API URL and backend logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, 50, EMPTY_FILTERS);
    // Run only once when this page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/api/user/content-developers-admins/`,
          { withCredentials: true }
        );
        setUserOptions(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!currentQuestionId) return;

    let cancelled = false;
    const loadQuestion = async () => {
      try {
        setModalLoading(true);
        const response = await getQuestionDetails(currentQuestionId);
        if (cancelled) return;
        const detail = response?.data?.detail || {};
        setModalData(detail);
        setSelectedOptions(detail.selected_options || []);
      } catch (error) {
        console.error("Failed to load question details:", error);
        if (!cancelled) {
          message.error("Could not load this question. It may have been deleted.");
          setModalData({});
        }
      } finally {
        if (!cancelled) setModalLoading(false);
      }
    };

    loadQuestion();
    return () => {
      cancelled = true;
    };
  }, [currentQuestionId]);

  const closeModal = () => {
    setShowModal(false);
    setModalData({});
    setCurrentQuestionId(null);
    setCurrentSrno(null);
    setSelectedOptions([]);
  };

  const columns = [
    {
      title: "Question Id",
      dataIndex: "srno",
      key: "srno",
      render: (value, record) => value ?? record.question_id_snapshot ?? "—",
    },
    { title: "User", dataIndex: "user", key: "user", render: (value) => value || "—" },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (action) => {
        const normalized = String(action || "").toUpperCase();
        let color = "default";
        let label = action || "Unknown";

        if (normalized === "ADD" || normalized === "ADDED") {
          color = "green";
          label = "Added";
        } else if (normalized === "EDIT" || normalized === "EDITED" || normalized === "UPDATE" || normalized === "UPDATED") {
          color = "blue";
          label = "Edited";
        } else if (normalized === "DELETE" || normalized === "DELETED") {
          color = "red";
          label = "Deleted";
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (value) => (value ? dayjs(value).format("DD MMM YYYY, hh:mm A") : "—"),
    },
    {
      title: "IP Address",
      dataIndex: "ip_address",
      key: "ip_address",
      render: (value) => value || "—",
    },
  ];

  const dailyColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "—"),
    },
    { title: "Total Added", dataIndex: "total_added", key: "total_added" },
    { title: "Total Updated", dataIndex: "total_updated", key: "total_updated" },
    { title: "Total Deleted", dataIndex: "total_deleted", key: "total_deleted", render: (value) => value ?? 0 },
    { title: "Total Suggestions", dataIndex: "total_suggestions", key: "total_suggestions", render: (value) => value ?? 0 },
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="m-0 text-2xl font-bold text-gray-800">Question Logs</h1>
        <button
          type="button"
          onClick={handleBack}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
        >
          <LeftOutlined className="text-sm" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      <Card style={{ marginBottom: 20 }} title="Filters">
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Input
              placeholder="Question Id"
              value={filters.srno}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, srno: event.target.value }))
              }
              onPressEnter={() => fetchLogs(1, pagination.pageSize)}
              style={{ width: 200 }}
            />
          </Col>
          <Col>
            <Select
              placeholder="Select User"
              allowClear
              style={{ width: 220 }}
              value={filters.name || undefined}
              onChange={(value) =>
                setFilters((previous) => ({ ...previous, name: value || "" }))
              }
              options={userOptions.map((user) => ({
                label: `${user.name} (${user.role})`,
                value: user.name,
              }))}
            />
          </Col>
          <Col>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) =>
                setFilters((previous) => ({ ...previous, dateRange: dates || [] }))
              }
            />
          </Col>
          <Col>
            <Button type="primary" onClick={() => fetchLogs(1, pagination.pageSize)}>
              Apply
            </Button>
          </Col>
          <Col>
            <Button
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                fetchLogs(1, pagination.pageSize, EMPTY_FILTERS);
              }}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {dailyCount && (
        <Card style={{ marginBottom: 20 }} title="Daily Summary">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Statistic title="Date Range" value={dailyCount.date_range || "—"} valueStyle={{ fontSize: 20 }} />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Statistic title="Total Added" value={dailyCount.total_added ?? 0} />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Statistic title="Total Updated" value={dailyCount.total_updated ?? 0} />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Statistic title="Total Deleted" value={dailyCount.total_deleted ?? 0} />
            </Col>
            <Col xs={12} sm={6} md={6}>
              <Statistic title="Total Suggestions" value={dailyCount.total_suggestions ?? 0} />
            </Col>
          </Row>
          <Divider />
          <Table
            rowKey="date"
            dataSource={dailyCount.day_wise || []}
            columns={dailyColumns}
            pagination={false}
            style={{ marginTop: 20 }}
            bordered
            scroll={{ x: true }}
          />
        </Card>
      )}

      <Card title="Logs">
        {loading ? (
          <div className="flex justify-center py-8"><Spin /></div>
        ) : (
          <Table
            rowKey={(record) => record.id ?? `${record.timestamp}-${record.action}-${record.srno ?? record.question_id_snapshot}`}
            dataSource={logs}
            columns={columns}
            bordered
            size="middle"
            scroll={{ x: true }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ["20", "50", "100"],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} logs`,
            }}
            onChange={(paginationInfo) => {
              // Pass numeric values, never the pagination object itself.
              fetchLogs(Number(paginationInfo.current) || 1, Number(paginationInfo.pageSize) || 50);
            }}
            onRow={(record) => ({
              onClick: () => {
                // Deleted questions no longer exist in the live Question table,
                // so do not call getQuestionDetails for their log entries.
                if (!record.question_id) {
                  if (String(record.action).toUpperCase() === "DELETE" || String(record.action).toUpperCase() === "DELETED") {
                    message.info("This question was deleted, so its live question details are no longer available here.");
                  }
                  return;
                }
                setCurrentQuestionId(record.question_id);
                setCurrentSrno(record.srno ?? record.question_id_snapshot ?? "—");
                setShowModal(true);
              },
              style: { cursor: record.question_id ? "pointer" : "default" },
            })}
          />
        )}
      </Card>

      <Modal
        width={modalData.question_type === "MCQ" ? "80rem" : "64rem"}
        open={showModal}
        title={`Reviewing Question (Question Id: ${currentSrno ?? "—"})`}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        {modalLoading || Object.keys(modalData).length === 0 ? (
          <Loading />
        ) : (
          <>
            <div className="flex w-full gap-8">
              {modalData.question_subtype === "READING_COMPREHENSION" && (
                <div className="mx-auto max-h-full flex-1 overflow-x-hidden overflow-y-scroll border">
                  <MathContent cls="p-4" content={modalData.reading_comprehension_passage} />
                </div>
              )}
              <div className="question-desc my-4 flex-1">
                <MathContent cls="px-2" content={modalData.description} />
              </div>
            </div>

            {modalData.question_type === "MCQ" && (
              <div>
                <div className="my-3 font-bold">Options:</div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-2 lg:grid-cols-2">
                  {modalData.options?.map(({ description, is_correct }, index) => {
                    const isSelected = (selectedOptions || []).includes(index);
                    let optionClass = "bg-white border-2 rounded-lg px-2 py-5";
                    if (is_correct) {
                      optionClass = "font-bold border-2 bg-green-200 rounded-lg px-2 py-5";
                    } else if (isSelected) {
                      optionClass = "font-bold border-2 bg-red-200 rounded-lg px-2 py-5";
                    }
                    return (
                      <div key={index} className="flex w-full items-center gap-1">
                        <div>{alphatbetArray[index]}.</div>
                        <div className="flex-1">
                          <MathContent cls={optionClass} content={description} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {modalData.question_type === "GRIDIN" && (
              <div>
                <div className="my-3 font-bold">Your Answer:</div>
                <span className="rounded-lg border-2 px-2 py-1">{selectedOptions}</span>
                <GridInOptions question={modalData} />
              </div>
            )}

            {modalData.explanation && (
              <>
                <div className="mb-2 mt-4 font-bold">Explanation:</div>
                <div className="mb-3 max-h-80 overflow-auto rounded-md border-2 bg-white p-2">
                  <MathContent cls="p-2" content={modalData.explanation} />
                </div>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
