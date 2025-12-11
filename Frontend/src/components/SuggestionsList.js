import { getSuggestionsList } from "@/app/services/authService";
import { Input, Table, Button } from "antd";
import React, { useEffect, useState } from "react";
import ViewSuggestionModal from "./ViewSuggestionModal";
import SuggestionStatusTag from "./SuggestionStatusTag";
import dayjs from "dayjs";
import { EyeTwoTone } from "@ant-design/icons";
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
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const role = usePathname().split("/")[1];
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [sorterState, setSorterState] = useState(null); // ✅ added this to track sorting

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

      const params = { page: current };

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
  }, [current, advancedFilters, sorterState, updated]);

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
              type="link"
              onClick={() => {
                const userId = localStorage.getItem("id");
                window.open(`/${role}/${userId}/questions/${record.question.id}/edit`, "_blank");
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
      <div className="flex items-center gap-4 mb-4">
        <Search
          placeholder="Search questions"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Button onClick={() => setIsAdvancedSearchOpen(true)}>Advanced Search</Button>
      </div>

      <Table
        footer={() => (
          <div className="flex justify-end mr-5">
            Page {current} of {totalPages} (Total: {total} records)
          </div>
        )}
        loading={skeletonLoading}
        dataSource={filteredData}
        columns={cols}
        rowKey={(record) => record.id}
        pagination={{
          showSizeChanger: false,
          pageSize: 10,
          total: total,
          onChange: (page) => setCurrent(page),
        }}
        onChange={(pagination, filters, sorter) => {
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

      <AdvancedSearchModal1
        open={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        onApply={applyAdvancedFilters}
        data={suggestionsData}
      />
    </div>
  );
}

export default SuggestionsList;
