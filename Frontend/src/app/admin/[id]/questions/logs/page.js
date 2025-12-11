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
} from "antd";
import { BASE_URL } from "@/app/constants/apiConstants";
import dayjs from "dayjs";
import Loading from "@/app/loading";
import { getQuestionDetails } from "@/app/services/authService";
import { alphatbetArray } from "@/utils/utils";
import GridInOptions from "@/components/question-list/gridin-options";
import MathContent from "@/components/MathContent";
import { LeftOutlined } from "@ant-design/icons";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const { RangePicker } = DatePicker;

export default function QuestionLogsPage() {
  const [logs, setLogs] = useState([]);
  const [dailyCount, setDailyCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    srno: "",
    name: "",
    dateRange: [],
  });
  const [userOptions, setUserOptions] = useState([]);
  const router = useRouter();
  // modal states
  const [showModal, setShowModal] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [modalData, setModalData] = useState({});
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [currentSrno, setCurrentSrno] = useState(null);
  const handleBack = () => router.back();
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.srno) params.srno = filters.srno;
      if (filters.name) params.name = filters.name;
      if (filters.dateRange.length === 2) {
        params.start_date = filters.dateRange[0].format("YYYY-MM-DD");
        params.end_date = filters.dateRange[1].format("YYYY-MM-DD");
      }

      const response = await axios.get(
        `${BASE_URL}/api/question/logs-and-daily-count/`,
        { params, withCredentials: true }
      );

      const results = response.data.results || {};
      setLogs(results.logs || []);
      setDailyCount(results.daily_question_count || null);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchLogs();
  }, []);


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/api/user/content-developers-admins/`,
          { withCredentials: true }
        );
        setUserOptions(response.data || []);
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentQuestionId) {
      getQuestionDetails(currentQuestionId).then((res) => {
        setModalData(res.data.detail);
        setSelectedOptions(res.data.detail.selected_options || []);
      });
    }
  }, [currentQuestionId]);

 const columns = [
  { title: "Question Id", dataIndex: "srno", key: "srno" },
  { title: "User", dataIndex: "user", key: "user" },
  {
    title: "Action",
    dataIndex: "action",
    key: "action",
    render: (action) => {
      const color = action === "Added" ? "green" : "blue";
      return <Tag color={color}>{action}</Tag>;
    },
  },
  {
    title: "Timestamp",
    dataIndex: "timestamp",
    key: "timestamp",
    render: (text) => dayjs(text).format("DD MMM YYYY, hh:mm A"),
  },
  {
    title: "IP Address",   // ✅ New column
    dataIndex: "ip_address",
    key: "ip_address",
   },
  
];


  return (
    <div style={{ padding: 20 }}>
      <div className="text-xl font-bold mb-5 flex align-middle">
        <LeftOutlined
          className="mr-2 text-base hover:font-extrabold cursor-pointer"
          onClick={handleBack}
        />
         <h1 className="text-2xl font-semibold mb-2">Question Logs</h1>
        </div>
     
      
      
      {/* Filters */}
      <Card style={{ marginBottom: 20 }} title="Filters">
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Input
              placeholder="Question Id"
              value={filters.srno}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, srno: e.target.value }))
              }
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
                setFilters((prev) => ({ ...prev, name: value || "" }))
              }
              options={userOptions.map((user) => ({
                label: `${user.name} (${user.role})`,
                value: user.name,
              }))}
            />
          </Col>
          <Col>
            <RangePicker
              onChange={(dates) =>
                setFilters((prev) => ({ ...prev, dateRange: dates || [] }))
              }
            />
          </Col>
          <Col>
            <Button type="primary" onClick={fetchLogs}>
              Apply
            </Button>
          </Col>
          <Col>
            <Button
              onClick={() => {
                setFilters({ srno: "", name: "", dateRange: [] });
                fetchLogs();
              }}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Daily Summary */}
      {dailyCount && (
        <Card style={{ marginBottom: 20 }} title="Daily Summary">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="Date Range" valueStyle={{ fontSize: "20px" }}  value={dailyCount.date_range} />
            </Col>
            <Col span={6}>
              <Statistic title="Total Added" value={dailyCount.total_added} />
            </Col>
            <Col span={6}>
              <Statistic title="Total Updated" value={dailyCount.total_updated} />
            </Col>
             <Col span={6}>
              <Statistic title="Total Suggestions" value={dailyCount.total_suggestions || 0} />
            </Col>
          </Row>

          <Divider />

          <Table
            rowKey="date"
            dataSource={dailyCount.day_wise || []}
            pagination={false}
            style={{ marginTop: 20 }}
            bordered
            columns={[
              {
                title: "Date",
                dataIndex: "date",
                key: "date",
                render: (text) => dayjs(text).format("DD MMM YYYY"),
              },
              { title: "Total Added", dataIndex: "total_added", key: "total_added" },
              {
                title: "Total Updated",
                dataIndex: "total_updated",
                key: "total_updated",
              },
              { title: "Total Suggestions", dataIndex: "total_suggestions", key: "total_suggestions" },
            ]}
          />
        </Card>
      )}

      {/* Logs Table */}
      <Card title="Logs">
        {loading ? (
          <Spin />
        ) : (
          <Table
            rowKey="id"
            dataSource={logs}
            columns={columns}
            bordered
            size="middle"
            onRow={(record) => ({
              onClick: () => {
                setCurrentQuestionId(record.question_id);
                setCurrentSrno(record.srno);
                setShowModal(true);
              },
            })}
          />
        )}
      </Card>

      
      {/* Reviewing Question Modal */}
      <Modal
        width={modalData.question_type === "MCQ" ? "80rem" : "64rem"}
        open={showModal}
        title={`Reviewing Question (Question Id: ${currentSrno})`}
        onCancel={() => {
          setShowModal(false);
          setModalData({});
            setCurrentQuestionId(null);
            setCurrentSrno(null);
          setSelectedOptions([]);
        }}
        footer={null}
      >
        {Object.keys(modalData).length === 0 ? (
          <Loading />
        ) : (
          <>
            <div className="w-full flex gap-8">
              {modalData.question_subtype === "READING_COMPREHENSION" && (
                <div className="overflow-x-hidden max-h-full overflow-y-scroll mx-auto flex-1 border">
                  <MathContent
                    cls={"p-4"}
                    content={modalData?.reading_comprehension_passage}
                  />
                </div>
              )}
              <div className="question-desc my-4 flex-1">
                <MathContent cls="px-2" content={modalData.description} />
              </div>
            </div>

            {modalData.question_type === "MCQ" && (
              <div>
                <div className="font-bold my-3">Options:</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2">
                  {modalData.options?.map(({ description, is_correct }, index) => (
                    <div key={index} className="flex w-full items-center gap-1">
                      <div>{alphatbetArray[index]}.</div>
                      <div className="flex-1">
                        {(selectedOptions ?? []).includes(index) && is_correct ? (
                          <MathContent
                            cls="font-bold border-2 bg-green-200 rounded-lg px-2 py-5"
                            content={description}
                          />
                        ) : (selectedOptions || []).includes(index) ? (
                          <MathContent
                            cls="font-bold border-2 bg-red-200 rounded-lg px-2 py-5"
                            content={description}
                          />
                        ) : is_correct ? (
                          <MathContent
                            cls="font-bold border-2 bg-green-200 rounded-lg px-2 py-5"
                            content={description}
                          />
                        ) : (
                          <MathContent
                            cls="bg-white border-2 rounded-lg px-2 py-5"
                            content={description}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modalData.question_type === "GRIDIN" && (
              <div>
                <div className="font-bold my-3">Your Answer:</div>
                <span className="border-2 rounded-lg px-2 py-1">
                  {selectedOptions}
                </span>
                <GridInOptions question={modalData} />
              </div>
            )}

            {modalData.explanation && (
              <>
                <div className="font-bold mt-4 mb-2">Explanation:</div>
                <div className="bg-white border-2 p-2 rounded-md max-h-80 overflow-auto mb-3">
                  <MathContent cls={"p-2"} content={modalData.explanation} />
                </div>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
