import {
  getSuggestionsList,
  getSubjectTopics,
} from "@/app/services/authService";
import { Input, Table, Button, Modal, Checkbox } from "antd";
import React, { useEffect, useState } from "react";
import ViewSuggestionModal from "./ViewSuggestionModal";
import SuggestionStatusTag from "./SuggestionStatusTag";
import dayjs from "dayjs";
import {
  EyeTwoTone,
  EditOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import MathContent from "./MathContent";
import AdvancedSearchModal1 from "./AdvancedSearchModal1";
import EditQuestionForm from "./EditQuestionForm";
import EditQuestionModal from "./EditQuestionModal";
import axios from "axios";
import { BASE_URL } from "@/app/constants/apiConstants";
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
  const role = usePathname().split("/")[2];
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [sorterState, setSorterState] = useState(null); // ✅ added this to track sorting

  const [quickFilters, setQuickFilters] = useState({});
  const [filterDrafts, setFilterDrafts] = useState({});
  const [filterOptions, setFilterOptions] = useState({ course: [], subject: [], topic: [], sub_topic: [] });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editQuestionData, setEditQuestionData] = useState(null);
  const [topicOptions, setTopicOptions] = useState([]);
  const SORT_FIELD_MAP = {
    srno: "question__srno",
    course: "question__course_subject__course__name",
    subject: "question__course_subject__subject__name",
    topic: "topic__name",
    sub_topic: "sub_topic__name",
    created_by: "created_by__name",
    created_at: "created_at",
    status: "status",
    difficulty: "question__difficulty",
    question: "question__description",
  };
  const applyAdvancedFilters = async (filters) => setAdvancedFilters(filters);

  useEffect(() => {
    Promise.all([
      axios.get(`${BASE_URL}/api/course/list/`, { withCredentials: true }),
      axios.get(`${BASE_URL}/api/subject/`, { withCredentials: true }),
      axios.get(`${BASE_URL}/api/test/topics/`, { withCredentials: true }),
    ]).then(async ([courseRes, subjectRes, topicRes]) => {
      const topics = topicRes.data || [];
      const courseSubjectIds = [...new Set(topics.map((topic) => topic.course_subject_id).filter(Boolean))];
      const detailResponses = await Promise.allSettled(courseSubjectIds.map((id) =>
        axios.get(`${BASE_URL}/api/question/${id}/topics/`, { withCredentials: true })
      ));
      const topicDetails = new Map(detailResponses
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) => result.value.data)
        .map((topic) => [topic.id, topic]));
      const topicLabel = (topic) => {
        const detail = topicDetails.get(topic.id);
        const course = detail?.course?.name || topic["course_subject__course__name"];
        const subject = detail?.subject?.name || topic["course_subject__subject__name"];
        return [topic.name, course, subject].filter(Boolean).join(" - ");
      };
      const subtopicResponses = await Promise.all(topics.map(async (topic) => {
        const response = await axios.get(`${BASE_URL}/api/test/topics/${topic.id}/subtopics/`, { withCredentials: true });
        return response.data.map((subtopic) => ({
          ...subtopic,
          label: [subtopic.name, topic.name, topicLabel(topic).split(" - ").slice(1)].flat(2).filter(Boolean).join(" - "),
        }));
      }));
      setFilterOptions({
        course: courseRes.data.map((item) => ({ label: item.name, value: item.id })),
        subject: subjectRes.data.map((item) => ({ label: item.name, value: item.id })),
        topic: topics.map((item) => ({ label: topicLabel(item), value: item.id })),
        sub_topic: subtopicResponses.flat().map((item) => ({ label: item.label, value: item.id })),
      });
    }).catch((err) => console.error("Error loading suggestion filters:", err));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setSkeletonLoading(true);
      const params = { page: current };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (quickFilters.srno?.trim()) params.question_srno = quickFilters.srno.trim();
      if (quickFilters.course?.length) params.course = quickFilters.course.join(",");
      if (quickFilters.subject?.length) params.subject = quickFilters.subject.join(",");
      if (quickFilters.topic?.length) params.topic = quickFilters.topic.join(",");
      if (quickFilters.sub_topic?.length) params.sub_topic = quickFilters.sub_topic.join(",");
      if (advancedFilters?.course?.length) params.course = advancedFilters.course.join(",");
      if (advancedFilters?.created_by?.length) params.created_by = advancedFilters.created_by.join(",");
      if (advancedFilters?.status?.length) params.status = advancedFilters.status.join(",");
      if (advancedFilters?.difficulty?.length) params.difficulty = advancedFilters.difficulty.join(",");
      if (advancedFilters?.topic?.length) params.topic = advancedFilters.topic.join(",");
      if (advancedFilters?.sub_topic?.length) params.sub_topic = advancedFilters.sub_topic.join(",");
      if (!quickFilters.srno?.trim() && advancedFilters?.question_id?.trim()) {
        params.question_id = advancedFilters.question_id.trim();
      }
      if (advancedFilters?.dateRange?.length === 2) {
        params.created_date_after = advancedFilters.dateRange[0].format("YYYY-MM-DD");
        params.created_date_before = advancedFilters.dateRange[1].format("YYYY-MM-DD");
      }
      if (advancedFilters?.question) params.question_text = advancedFilters.question;
      if (quickFilters.srno?.trim()) params.question_srno = quickFilters.srno.trim();
      if (quickFilters.course?.length) params.course = quickFilters.course.join(",");
      if (quickFilters.subject?.length) params.subject = quickFilters.subject.join(",");
      if (quickFilters.topic?.length) params.topic = quickFilters.topic.join(",");
      if (quickFilters.sub_topic?.length) params.sub_topic = quickFilters.sub_topic.join(",");
      // Use normalized server search for copied question text containing math
      // punctuation (for example, Unicode minus signs and parentheses).
      if (quickFilters.question?.trim()) params.search = quickFilters.question.trim();
      if (sorterState?.orderParam) params.ordering = sorterState.orderParam;
      try {
        const res = await getSuggestionsList(params);
        const { results, count, total_pages, current_page } = res.data;
        setSuggestionsData(results);
        setTotal(count);
        setTotalPages(total_pages);
        setCurrent(current_page);
        setFilteredData(results);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setSkeletonLoading(false);
      }
    };
    fetchData();
  }, [current, advancedFilters, sorterState, updated, searchTerm, quickFilters]);

  const router = useRouter();
  const isQuickFilterApplied = (field) => Array.isArray(quickFilters[field])
    ? quickFilters[field].length > 0
    : Boolean(quickFilters[field]?.trim?.());

  const renderCheckboxFilter = (field) => ({ confirm }) => (
    <div className="min-w-56 p-2">
      <div style={{ maxHeight: 260, overflowY: "auto", overscrollBehavior: "contain" }}>
        <Checkbox.Group
          className="flex flex-col gap-2"
          value={filterDrafts[field] ?? quickFilters[field] ?? []}
          options={filterOptions[field] || []}
          onChange={(values) => setFilterDrafts({ ...filterDrafts, [field]: values })}
        />
      </div>
      <div className="mt-2 flex justify-between border-t pt-2">
        <Button size="small" type="text" onClick={() => {
          setCurrent(1);
          setQuickFilters({ ...quickFilters, [field]: [] });
          setFilterDrafts({ ...filterDrafts, [field]: [] });
          confirm();
        }}>Reset</Button>
        <Button size="small" type="primary" onClick={() => {
          setCurrent(1);
          setQuickFilters({ ...quickFilters, [field]: filterDrafts[field] ?? quickFilters[field] ?? [] });
          confirm();
        }}>OK</Button>
      </div>
    </div>
  );

  const renderTextFilter = (field, placeholder) => ({ confirm }) => (
    <div className="w-64 p-2" onKeyDown={(event) => event.stopPropagation()}>
      <Input
        autoFocus
        allowClear
        placeholder={placeholder}
        value={filterDrafts[field] ?? quickFilters[field] ?? ""}
        onChange={(event) => setFilterDrafts({ ...filterDrafts, [field]: event.target.value })}
        onPressEnter={() => {
          setCurrent(1);
          setQuickFilters({ ...quickFilters, [field]: filterDrafts[field] ?? quickFilters[field] ?? "" });
          confirm();
        }}
      />
      <div className="mt-2 flex justify-between">
        <Button size="small" type="text" onClick={() => {
          setCurrent(1);
          setQuickFilters({ ...quickFilters, [field]: "" });
          setFilterDrafts({ ...filterDrafts, [field]: "" });
          confirm();
        }}>Reset</Button>
        <Button size="small" type="primary" icon={<SearchOutlined />} onClick={() => {
          setCurrent(1);
          setQuickFilters({ ...quickFilters, [field]: filterDrafts[field] ?? quickFilters[field] ?? "" });
          confirm();
        }}>Search</Button>
      </div>
    </div>
  );

  const cols = [
    {
      key: "srno",
      dataIndex: ["question", "srno"],
      title: "Sr. No",
      sorter: true, // ✅ use true instead of custom sorter
      width: 80,
      filterDropdown: renderTextFilter("srno", "Search Sr. No"),
      filterIcon: () => <SearchOutlined style={{ color: isQuickFilterApplied("srno") ? "#1677ff" : "#8c8c8c" }} />,
    },
    {
      key: "course",
      dataIndex: "course",
      title: "Course",
      sorter: true,
      filterDropdown: renderCheckboxFilter("course"),
      filterIcon: () => <FilterOutlined style={{ color: isQuickFilterApplied("course") ? "#1677ff" : "#8c8c8c" }} />,
    },
    {
      key: "subject",
      dataIndex: "subject",
      title: "Subject",
      sorter: true,
      filterDropdown: renderCheckboxFilter("subject"),
      filterIcon: () => <FilterOutlined style={{ color: isQuickFilterApplied("subject") ? "#1677ff" : "#8c8c8c" }} />,
    },
    {
      key: "topic",
      title: "Topic",
      dataIndex: ["suggestion", "topic"],
      sorter: true,
      filterDropdown: renderCheckboxFilter("topic"),
      filterIcon: () => <FilterOutlined style={{ color: isQuickFilterApplied("topic") ? "#1677ff" : "#8c8c8c" }} />,
    },
    {
      key: "sub_topic",
      title: "Subtopic",
      dataIndex: ["suggestion", "sub_topic"],
      sorter: true,
      filterDropdown: renderCheckboxFilter("sub_topic"),
      filterIcon: () => <FilterOutlined style={{ color: isQuickFilterApplied("sub_topic") ? "#1677ff" : "#8c8c8c" }} />,
    },

    {
      key: "question",
      dataIndex: "question",
      width: 700,
      title: "Question",
      sorter: true,
      render: (question) => <MathContent content={question.description} />,
      filterDropdown: renderTextFilter("question", "Search question text"),
      filterIcon: () => <SearchOutlined style={{ color: isQuickFilterApplied("question") ? "#1677ff" : "#8c8c8c" }} />,
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

  const courseSubjectId =
    record.question?.course_subject || record.course_subject_id;

  try {
    const res = await getSubjectTopics(courseSubjectId);

    const topics = res.data.map((t) => ({
      ...t,
      label: t.name,
      value: t.id,
    }));

    setTopicOptions(topics);

    const topic = res.data.find(
      (t) => t.name === record.question.topic
    );

    setEditQuestionData({
      ...record.question,
      topic: topic?.id,
      topic_name: topic?.name
    });

    setIsEditModalOpen(true);

  } catch (err) {
    console.error(err);
  }

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
          onChange={(e) => {
            setCurrent(1);
            setSearchTerm(e.target.value);
          }}
          allowClear
          className="max-w-[450px] h-10 rounded-lg border-gray-200 hover:border-blue-400 focus:border-blue-500 shadow-sm text-base"
        />
        <Button
          className="!h-10 px-5 rounded-lg border-gray-200 hover:border-blue-400 hover:text-blue-600 font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-sm"
          onClick={() => setIsAdvancedSearchOpen(true)}
          icon={<FilterOutlined />}
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
            const backendField =
              SORT_FIELD_MAP[sorter.columnKey] || sorter.columnKey;
            const orderParam =
              sorter.order === "ascend" ? backendField : `-${backendField}`;
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

        {/* Form Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto bg-gray-50">
          {editQuestionData && (
            <EditQuestionModal
  open={isEditModalOpen}
  setOpen={setIsEditModalOpen}
  editQuestionData={editQuestionData}
  setEditQuestionData={setEditQuestionData}
  topicOptions={topicOptions}
  role={role}
  updated={updated}
  setUpdated={setUpdated}
/>
          )}
        </div>

    </div>
  );
}

export default SuggestionsList;
