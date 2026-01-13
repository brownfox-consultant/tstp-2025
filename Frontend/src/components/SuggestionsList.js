import { getSuggestionsList, getSubjectTopics } from "@/app/services/authService";
import { Input, Table, Button, Modal } from "antd";
import React, { useEffect, useState } from "react";
import ViewSuggestionModal from "./ViewSuggestionModal";
import SuggestionStatusTag from "./SuggestionStatusTag";
import dayjs from "dayjs";
import { EyeTwoTone, EditOutlined, ReloadOutlined, SearchOutlined, FilterOutlined, CloseOutlined } from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import MathContent from "./MathContent";
import AdvancedSearchModal1 from "./AdvancedSearchModal1";
import EditQuestionForm from "./EditQuestionForm";

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

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editQuestionData, setEditQuestionData] = useState(null);
  const [topicOptions, setTopicOptions] = useState([]);

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

  const router = useRouter();

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
              onClick={async () => {
                // Get course_subject id from the record
                const courseSubjectId = record.question.course_subject || record.course_subject_id;
                
                // Fetch topic options if we have a course subject id
                if (courseSubjectId) {
                  try {
                    const res = await getSubjectTopics(courseSubjectId);
                    setTopicOptions(
                      res.data.map((option) => ({ ...option, label: option.name }))
                    );
                  } catch (err) {
                    console.error("Failed to fetch topics:", err);
                    setTopicOptions([]);
                  }
                } else {
                  setTopicOptions([]);
                }
                
                setEditQuestionData(record.question);
                setIsEditModalOpen(true);
              }}
              style={{ color: "#1890ff", fontWeight: 500 }}
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
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <Input
          placeholder="Search questions..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
          className="max-w-[450px] h-12 rounded-lg border-gray-200 hover:border-blue-400 focus:border-blue-500 shadow-sm text-base"
        />
        <Button 
          className="px-5 rounded-lg border-gray-200 hover:border-blue-400 hover:text-blue-600 font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-sm"
          onClick={() => setIsAdvancedSearchOpen(true)}
          icon={<FilterOutlined />}
          style={{ height: '48px' }}
        >
          Advanced Search
        </Button>
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

      {/* Edit Question Modal - Modern UI */}
      <Modal
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditQuestionData(null);
          setUpdated((prev) => !prev);
        }}
        width={1300}
        footer={null}
        closable={false}
        className="edit-question-modal"
        styles={{
          content: { borderRadius: '16px', overflow: 'hidden' },
          top: '20',
        }}
      >
        {/* Header */}
        <div className="mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <EditOutlined className="text-[#F59405] text-xl" />
              </div>
              <div>
                <h2 className="text-black text-xl font-bold m-0">Edit Question</h2>
                <p className="text-gray-500 text-sm m-0">
                  {editQuestionData?.topic && `Topic: ${editQuestionData.topic}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditQuestionData(null);
                setUpdated((prev) => !prev);
              }}
              className="w-8 h-8 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 cursor-pointer border-0 rounded-md bg-transparent"
            >
              <span className="text-gray-500 text-lg"><CloseOutlined /></span>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto bg-gray-50">
          {editQuestionData && (
            <EditQuestionForm
              initialValues={editQuestionData}
              action="edit"
              topicOptionsParam={topicOptions}
              subTopicOptionsParam={
                topicOptions.find((t) => t.name === editQuestionData.topic)?.subtopics || []
              }
              courseSubId={editQuestionData.course_subject || editQuestionData.course_subject_id}
              role={role}
              updated={updated}
              setUpdated={setUpdated}
              hideButtons={false}
              closeModal={() => {
                const courseSubjectId = editQuestionData.course_subject || editQuestionData.course_subject_id;
                setIsEditModalOpen(false);
                setEditQuestionData(null);
                setUpdated((prev) => !prev);
                router.push(`/admin/questions/questions?course_subject_id=${courseSubjectId}&page=1`);
              }}
            />
          )}
        </div>

        {/* Footer Actions */}

      </Modal>
    </div>
  );
}

export default SuggestionsList;
