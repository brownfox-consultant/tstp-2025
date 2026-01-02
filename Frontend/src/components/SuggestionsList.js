import { getSuggestionsList } from "@/app/services/authService";
import { Input, Table, Button, Modal } from "antd";
import React, { useEffect, useState } from "react";
import ViewSuggestionModal from "./ViewSuggestionModal";
import SuggestionStatusTag from "./SuggestionStatusTag";
import dayjs from "dayjs";
import { EyeTwoTone, EditOutlined, ReloadOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons";
import { usePathname } from "next/navigation";
import MathContent from "./MathContent";
import AdvancedSearchModal1 from "./AdvancedSearchModal1"; // adjust path if needed

const { Search } = Input;

function SuggestionsList() {
  const [suggestionsData, setSuggestionsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [skeletonLoading, setSkeletonLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const role = usePathname().split("/")[1];
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [sorterState, setSorterState] = useState(null); // ✅ added this to track sorting
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editQuestionUrl, setEditQuestionUrl] = useState("");

  // ✅ Map frontend column key → backend field
  const SORT_FIELD_MAP = {
    srno: "question__srno",
    course: "question__course__name",
    created_by: "created_by__name",
    created_at: "created_at",
    status: "status",
    difficulty: "question__difficulty",
    question: "question__description",
  };

  const applyAdvancedFilters = async (filters) => {
    setAdvancedFilters(filters);
  };

  // ✅ Fetch data (runs on filters, sorting, or pagination)
  useEffect(() => {
    const fetchData = async () => {
      setSkeletonLoading(true);

      const params = { page: current, size: pageSize };

      // include filters
      if (advancedFilters?.course?.length) params.course = advancedFilters.course.join(",");
      if (advancedFilters?.created_by?.length) params.created_by = advancedFilters.created_by.join(",");
      if (advancedFilters?.status?.length) params.status = advancedFilters.status.join(",");
      if (advancedFilters?.difficulty?.length) params.difficulty = advancedFilters.difficulty.join(",");
      if (advancedFilters?.dateRange?.length === 2) {
        params.created_date_after = advancedFilters.dateRange[0].format("YYYY-MM-DD");
        params.created_date_before = advancedFilters.dateRange[1].format("YYYY-MM-DD");
      }
      if (advancedFilters?.question) params.question_text = advancedFilters.question;

      // ✅ include sorting param
      if (sorterState?.orderParam) {
        params.ordering = sorterState.orderParam;
      }

      try {
        const res = await getSuggestionsList(params);
        const { results, count, total_pages, current_page } = res.data;
        setSuggestionsData(results);
        setTotal(count);
        setTotalPages(total_pages);
        setCurrent(current_page);
        setFilteredData(searchTerm ? handleSearch(searchTerm, results) : results);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setSkeletonLoading(false);
      }
    };

    fetchData();
  }, [current, pageSize, advancedFilters, sorterState, updated]);

  // ✅ local search
  const handleSearch = (value, dataToFilter = suggestionsData) => {
    setSearchTerm(value);
    if (!value) return setFilteredData(dataToFilter);

    const normalizedInput = value.toLowerCase().replace(/\s|_|,|-/g, "");
    const filtered = dataToFilter.filter((item) => {
      const course = item.course?.toLowerCase() || "";
      const question = item.question?.description?.toLowerCase() || "";
      const createdBy = item.created_by?.toLowerCase() || "";
      const status = item.status?.toLowerCase().replace(/\s|_/g, "") || "";
      const createdDate = dayjs(item.created_at).format("MMM D, YYYY").toLowerCase().replace(/\s|,|-/g, "");
      return (
        course.includes(normalizedInput) ||
        question.includes(normalizedInput) ||
        createdBy.includes(normalizedInput) ||
        status.includes(normalizedInput) ||
        createdDate.includes(normalizedInput)
      );
    });

    setFilteredData(filtered);
    return filtered;
  };

  const cols = [
    {
      key: "srno",
      dataIndex: ["question", "srno"],
      title: "Sr. No",
      sorter: true, // ✅ use true instead of custom sorter
      width: 80,
    },
    {
      key: "course",
      dataIndex: "course",
      title: "Course",
      sorter: true,
    },
    {
      key: "subject",
      dataIndex: "subject",
      title: "Subject",
      sorter: true,
    },
    {
      key: "question",
      dataIndex: "question",
      width: 700,
      title: "Question",
      sorter: true,
      render: (question) => <MathContent content={question.description} />,
    },
    {
      key: "created_by",
      dataIndex: "created_by",
      title: "Created By",
      sorter: true,
    },
    {
      key: "created_at",
      title: "Created On",
      dataIndex: "created_at",
      sorter: true,
      render: (date) => <>{dayjs(date).format("MMM D, YYYY")}</>,
    },
    {
      key: "status",
      dataIndex: "status",
      title: "Status",
      sorter: true,
      render: (text) => <SuggestionStatusTag status={text} />,
    },
    {
      key: "action",
      fixed: "right",
      title: "Action",
      align: "center",
      render: (_, record) => (
        <div className="flex gap-2 justify-center">
          <ViewSuggestionModal
            questionId={record.question.id}
            icon={<EyeTwoTone />}
            updated={updated}
            setUpdated={setUpdated}
            data={record}
            role={role}
          />
          {record.status === "APPROVED" && role === "admin" && (
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#1890ff" }} />}
              onClick={() => {
                const userId = localStorage.getItem("id");
                setEditQuestionUrl(`/${role}/${userId}/questions/${record.question.id}/edit`);
                setIsEditModalOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#1890ff",
                fontWeight: 500,
              }}
            >
              Edit
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Search Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, etc..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all text-gray-700 placeholder-gray-400 text-sm"
            />
          </div>

          {/* Advanced Search Button */}
          <button
            onClick={() => setIsAdvancedSearchOpen(true)}
            className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-2"
          >
            <FilterOutlined className="text-gray-500" />
            Advanced Search
          </button>
        </div>
      </div>

      <Table
        loading={skeletonLoading}
        dataSource={filteredData}
        columns={cols}
        rowKey={(record) => record.id}
        pagination={{
          current: current,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showQuickJumper: { goButton: <span style={{ marginLeft: "4px" }}>Page</span> },
          showTotal: (total) => (
            <span style={{ fontWeight: 500, color: "#666", marginRight: "8px" }}>
              Total {total} suggestions
            </span>
          ),
          onChange: (page, newPageSize) => {
            if (newPageSize !== pageSize) {
              setPageSize(newPageSize);
              setCurrent(1); // Reset to first page when page size changes
            } else {
              setCurrent(page);
            }
          },
          locale: { 
            jump_to: "Go to",
            page: "",
          },
        }}
        onChange={(pagination, filters, sorter) => {
          // Handle page change from pagination
          if (pagination.current !== current) {
            setCurrent(pagination.current);
          }
          // ✅ detect sorting and set state for API call
          if (sorter.order && sorter.columnKey) {
            const backendField = SORT_FIELD_MAP[sorter.columnKey] || sorter.columnKey;
            const orderParam = sorter.order === "ascend" ? backendField : `-${backendField}`;
            setSorterState({ orderParam });
          } else {
            setSorterState(null); // clear sorting
          }
        }}
        scroll={{ x: "max-content" }}
      />

      {/* Custom Pagination Styles */}
      <style jsx global>{`
        .ant-pagination {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ant-pagination-item {
          min-width: 32px;
          height: 32px;
          line-height: 30px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
          background: #fff;
        }
        .ant-pagination-item a {
          color: #333;
        }
        .ant-pagination-item-active {
          border: 2px solid #f5a623 !important;
          background: #fffaf0 !important;
        }
        .ant-pagination-item-active a {
          color: #f5a623 !important;
        }
        .ant-pagination-prev .ant-pagination-item-link,
        .ant-pagination-next .ant-pagination-item-link {
          border-radius: 6px;
          border: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ant-pagination-options {
          margin-left: 8px;
        }
        .ant-select-selector {
          border-radius: 6px !important;
        }
        .ant-pagination-options-quick-jumper {
          margin-left: 8px;
        }
        .ant-pagination-options-quick-jumper input {
          width: 50px;
          border-radius: 6px;
          text-align: center;
        }
      `}</style>

      <AdvancedSearchModal1
        open={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        onApply={applyAdvancedFilters}
        data={suggestionsData}
      />

      {/* Edit Question Modal */}
      <Modal
        open={isEditModalOpen}
        title={
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "10px",
            fontSize: "18px",
            fontWeight: 600,
          }}>
            <EditOutlined style={{ color: "#1890ff" }} />
            Edit Question
          </div>
        }
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditQuestionUrl("");
          // Trigger refresh after closing
          setUpdated((prev) => !prev);
        }}
        width="95%"
        style={{ top: 20 }}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setUpdated((prev) => !prev);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Refresh List
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditQuestionUrl("");
                setUpdated((prev) => !prev);
              }}
            >
              Done
            </Button>
          </div>
        }
        destroyOnClose
      >
        <iframe
          src={editQuestionUrl}
          style={{
            width: "100%",
            height: "75vh",
            border: "none",
            borderRadius: "8px",
          }}
          title="Edit Question"
        />
      </Modal>
    </div>
  );
}

export default SuggestionsList;
