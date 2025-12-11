import {CaretDownFilled,CaretRightFilled,DeleteTwoTone,EditOutlined,FilterFilled,FilterOutlined,SearchOutlined,WarningTwoTone,
} from "@ant-design/icons";
import {Button,Col,Row,Table,Input,Space,Popconfirm,Popover,Tag,Badge,Tooltip,} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { softDeactivateQuestion } from "@/app/services/authService";

import Highlighter from "react-highlight-words";
import {
  activateQuestion,
  deleteQuestion,
  getSubjectQuestions,
} from "@/app/services/authService";
import ViewSuggestionModal from "./ViewSuggestionModal";
import {
  difficultyFilters,
  difficultyTagsMap,
  questionTypeFilters,
  questionTypeMap,
  testTypeFilters,
  questionSubtypeFilters,
  questionSubtypeMap,   // <-- add this
} from "@/utils/utils";

import { useMediaQuery } from "react-responsive";
import DOMPurify from "dompurify";
import MathContent from "./MathContent";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import GridInOptions from "./question-list/gridin-options";
import McqOptions from "./question-list/mcq-options";

function QuestionsList({
  courseSubId,
  role,
  searchText,
  setSearchText,
  current,
  setCurrent,
  params,
  setParams,
  filters
}) {
  const searchParams = useSearchParams();
  const updatedSearchParams = new URLSearchParams(searchParams);
  const [questions, setQuestions] = useState([]);
  const [updated, setUpdated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [tableLoading, setTableLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchedColumn, setSearchedColumn] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });
  const searchInput = useRef(null);
  
  
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    // if (searchText) {
    //   setSearchText(selectedKeys[0]);
    // }
    setSearchedColumn(dataIndex);
  };
  

  const deactivateConfirm = (id) => {
  setConfirmLoading(true);
  softDeactivateQuestion(id)
    .then((res) => {
      setUpdated(!updated); // Refresh table
    })
    .catch((err) => console.log("err", err))
    .finally(() => setConfirmLoading(false));
};


  const getAllSubTopics = (topics) => {
    let subTopics = [];

    for (let topic of topics) {
      subTopics = [...subTopics, ...topic.subtopics];
    }

    return subTopics.map(({ id, name }) => {
      return { value: id, text: name };
    });
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div
        style={{
          padding: 8,
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          defaultValue={searchParams.get("query") || ""}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => {
  confirm({ closeDropdown: true });

  if (selectedKeys[0]) {
    updatedSearchParams.set(dataIndex, selectedKeys[0]); // ✅ dynamic key
    updatedSearchParams.set("page", "1");
    router.replace(`${pathname}?${updatedSearchParams.toString()}`);
  } else {
    updatedSearchParams.delete(dataIndex);
    router.replace(`${pathname}?${updatedSearchParams.toString()}`);
  }

  setSearchedColumn(dataIndex);
}}

          style={{
            marginBottom: 8,
            display: "block",
          }}
        />
        <Space className="flex justify-center">
          <Button
            size="small"
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => {
              confirm({
                closeDropdown: true,
              });
              // setSearchText(selectedKeys[0]);
              if (selectedKeys[0]) {
                updatedSearchParams.set("srno", selectedKeys[0]);
                updatedSearchParams.set("page", "1");
                router.replace(`${pathname}?${updatedSearchParams.toString()}`);
              } else {
                updatedSearchParams.delete("srno");
                router.replace(`${pathname}?${updatedSearchParams.toString()}`);
              }
              setSearchedColumn(dataIndex);
            }}
          >
            Search
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? "#1677ff" : undefined,
        }}
      />
    ),
    // onFilter: (value, record) =>
    //   record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    // render: (text) =>
    //   searchedColumn === dataIndex ? (
    //     <Highlighter
    //       highlightStyle={{
    //         backgroundColor: "#ffc069",
    //         padding: 0,
    //       }}
    //       searchWords={[searchText]}
    //       autoEscape
    //       textToHighlight={text ? text.toString() : ""}
    //     />
    //   ) : (
    //     <div
    //       dangerouslySetInnerHTML={{
    //         __html: DOMPurify.sanitize(text, {
    //           USE_PROFILES: { html: true },
    //         }),
    //       }}
    //     ></div>
    //   ),
  });

  const deleteConfirm = (id) => {
    setConfirmLoading(true);
    deleteQuestion(id)
      .then((res) => {
        setUpdated(!updated);
      })
      .catch((err) => console.log("err", err))
      .finally(() => setConfirmLoading(false));
  };

  const activateConfirm = (id) => {
    setConfirmLoading(true);
    activateQuestion(id)
      .then((res) => {
        setUpdated(!updated);
      })
      .catch((err) => console.log("err", err))
      .finally(() => setConfirmLoading(false));
  };

  const columns = [
  
   {
    title: "Que. Id",
    dataIndex: "srno",
    key: "srno",
    width: 90,
    ...getColumnSearchProps("srno"),
  },
    {
      title: "Question",
      dataIndex: "description",
      key: "description",
      width: 700,
      ...getColumnSearchProps("description"),
      render: (text) => {
        return <MathContent content={text} />;
      },
    },
    {
      title: "Difficulty",
      dataIndex: "difficulty",
      key: "difficulty",
      filters: difficultyFilters,
      defaultFilteredValue: searchParams.get("difficulty") || null,
      filterIcon: (filtered) =>
        filtered && searchParams.get("difficulty") ? (
          <FilterFilled />
        ) : (
          <FilterOutlined style={{ color: "gray" }} />
        ),
      // onFilter: (value, record) => record.difficulty.indexOf(value) === 0,
      render: (text) => {
        return (
          <Tag bordered={false} color={difficultyTagsMap[text].color}>
            {difficultyTagsMap[text].label}
          </Tag>
        );
      },
    },
    {
  title: "Question Subtype",
  dataIndex: "question_subtype",
  key: "question_subtype",
  align: "center",
  filters: questionSubtypeFilters,
  defaultFilteredValue: searchParams.get("question_subtype")  ? [searchParams.get("question_subtype")]  : null,
  filterIcon: (filtered) =>
    filtered && searchParams.get("question_subtype") ? (
      <FilterFilled />
    ) : (
      <FilterOutlined style={{ color: "gray" }} />
    ),
  render: (text) => {
    return text ? <Tag bordered={false}>{questionSubtypeMap[text]}</Tag> : "-";
  },
},
    {
      title: "Question Type",
      dataIndex: "question_type",
      key: "question_type",
      align: "center",
      filters: questionTypeFilters,
      defaultFilteredValue: searchParams.get("question_type") || null,
      filterIcon: (filtered) =>
        filtered && searchParams.get("question_type") ? (
          <FilterFilled />
        ) : (
          <FilterOutlined style={{ color: "gray" }} />
        ),
      onFilter: (value, record) => record.question_type.indexOf(value) === 0,
      render: (text) => {
        return <Tag bordered={false}>{questionTypeMap[text]}</Tag>;
      },
    },
    {
      title: "Test Type",
      dataIndex: "test_type",
      key: "test_type",
      align: "center",
      filters: testTypeFilters,
      filterIcon: (filtered) =>
        filtered && searchParams.get("test_type") ? (
          <FilterFilled />
        ) : (
          <FilterOutlined style={{ color: "gray" }} />
        ),
      defaultFilteredValue: searchParams.get("test_type") || null,
      render: (text) => {
        return text == "FULL_LENGTH_TEST"
          ? "Full Length Test"
          : "Practice Questions";
      },
    },
    {
      title: "Topic",
      dataIndex: "topic",
      key: "topic",
      filterIcon: (filtered) =>
        filtered && searchParams.get("topic") ? (
          <FilterFilled />
        ) : (
          <FilterOutlined style={{ color: "gray" }} />
        ),
      defaultFilteredValue: searchParams.get("topic") || null,
      filters: topics.map(({ id, name }) => {
        return { value: id, text: name };
      }),
    },
    {
      title: "Sub Topic",
      dataIndex: "sub_topic",
      key: "sub_topic",
      filters: getAllSubTopics(topics),
      filterIcon: (filtered) =>
        filtered && searchParams.get("sub_topic") ? (
          <FilterFilled />
        ) : (
          <FilterOutlined style={{ color: "gray" }} />
        ),
      defaultFilteredValue: searchParams.get("sub_topic") || null,
      render: (text) => {
        return <div>{text ? text : "-"}</div>;
      },
    },
 {
 title: "Is Active",
  dataIndex: "is_active",
  key: "is_active",
  align: "center",
  width: 120,
  filters: [
    { text: "Active", value: true },
    { text: "Inactive", value: false },
  ],
  filterMultiple: false,
  defaultFilteredValue: searchParams.get("is_active")
    ? [searchParams.get("is_active") === "true" ? true : false]
    : null,
  render: (text, record) => {
    return record.is_active ? (
      <Tooltip title="Click to deactivate question">
        {role !== "admin" ? (
          <Space>
            <Badge status="success" />
            <span>Active</span>
          </Space>
        ) : (
          <Popconfirm
            placement="leftTop"
            title="Deactivate the question"
            description="Are you sure to deactivate this question?"
            onConfirm={() => deactivateConfirm(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{
              loading: confirmLoading,
            }}
          >
            
              
              <Button type="primary" size="small">
              Active
            </Button>
          </Popconfirm>
        )}
      </Tooltip>
    ) : (
      <Tooltip title="Click to activate question">
        {role !== "admin" ? (
          <Space>
            <Badge status="error" />
            <span>Inactive</span>
          </Space>
        ) : (
          <Popconfirm
            placement="leftTop"
            title="Activate the question"
            description="Are you sure to activate this question?"
            onConfirm={() => activateConfirm(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{
              loading: confirmLoading,
            }}
          >
            <Button danger type="primary" size="small">
              Inactive
              </Button>
          </Popconfirm>
        )}
      </Tooltip>
    );
  },
    },

    {
  title: "Created By",
  dataIndex: "created_by",
  key: "created_by",
  align: "center",
  render: (text) => (text ? text : "-"),
    },
 {
  title: "Created At",
  dataIndex: "created_at",
  key: "created_at",
  align: "center",
  render: (text) =>
    text ? new Date(text).toLocaleString() : "-",
},
{
  title: "Updated By",
  dataIndex: "updated_by",
  key: "updated_by",
  align: "center",
  render: (text) => (text ? text : "-"),
    },

   
{
  title: "Updated At",
  dataIndex: "updated_at",
  key: "updated_at",
  align: "center",
  render: (text) =>
    text ? new Date(text).toLocaleString() : "-",
},


    {
      title: "Action",
      fixed: !isMobile && "right",
      width: 100,
      render: (record) => {
        return (
          <Space>
            <Popover
              content={
                role == "admin"
                  ? "Edit Question"
                  : record.has_suggestion
                  ? "Cannot edit question until existing suggested changes are approved or rejected"
                  : "Suggest changes"
              }
            >
              <EditOutlined
                className={`${
                  role != "admin" && record.has_suggestion && "text-gray-300"
                }`}
                onClick={() => {
                  if (role != "admin" && record.has_suggestion) {
                  } else {
                   router.push(
  `${pathname}/${record.id}/${role == "admin" ? "edit" : "suggest"}?course_subject_id=${searchParams.get("course_subject_id")}&page=${searchParams.get("page")}`
);

                  }
                }}
              />
            </Popover>
            {/* {["admin"].includes(role) && record.is_active && ( */}
            {["admin"].includes(role) && (
              <Popconfirm
                className="ml-3"
                placement="leftTop"
                title="Delete the question"
                description="Are you sure to delete this question?"
                onConfirm={() => deleteConfirm(record.id)}
                okText="Yes"
                cancelText="No"
                okButtonProps={{
                  loading: confirmLoading,
                }}
              >
                <DeleteTwoTone twoToneColor="#eb2f96" />
              </Popconfirm>
            )}
            {record.has_suggestion && (
              <ViewSuggestionModal
                icon={
                  <Popover
                    content={
                      role != "admin" ? "View Suggestion" : "Review suggestion"
                    }
                  >
                    <WarningTwoTone twoToneColor="#eeb600" className="ml-3" />{" "}
                  </Popover>
                }
                questionId={record.id}
                updated={updated}
                setUpdated={setUpdated}
                role={role}
              />
            )}
          </Space>
        );
      },
    },
  ];

  useEffect(() => {
    console.log("filters",filters)
  },[tableLoading])
  useEffect(() => {
    setTableLoading(true);
    if (searchParams.get("course_subject_id")) {
    console.log("filters.is_active",filters.is_active)  
      let paramsPayload = {
   question_type: filters.question_type?.join(",") || "",
  difficulty: filters.difficulty?.join(",") || "",
  topic: filters.topic?.join(",") || "",
  sub_topic: filters.sub_topic?.join(",") || "",
  test_type: filters.test_type?.join(",") || "",
  question_subtype: filters.question_subtype?.join(",") || "",
  option_text: filters.option_text || "",
        question_text: filters.question_text || searchText || "",
        srno: filters.srno || "",
    is_active:
  filters.is_active && filters.is_active.length > 0
    ? (filters.is_active[0] === true || filters.is_active[0] === "true"
        ? "true"
        : "false")
    : "",
};

      // console.log(
      //   "call api",
      //   updatedSearchParams.get("course_subject_id"),
      //   updatedSearchParams.get("page"),
      //   updatedSearchParams.get("query"),
      //   paramsPayload
      // );
      getSubjectQuestions({
        courseSubId: Number(searchParams.get("course_subject_id")),
        page: Number(searchParams.get("page")),
        question_text: searchText,
        params: paramsPayload,
      })
        .then((res) => {
          setQuestions(res.data.results.questions);
          setTopics(res.data.results.topics);
          // setCurrent(res.data.current_page);
          searchParams.get("page");
          setTotal(res.data.count);
          setTotalPages(res.data.total_pages);
        })
        .finally(() => setTableLoading(false));
    }
  }, [
    searchParams.toString(),
    // searchParams.get("course_subject_id"),
    // searchParams.get("page"),
    // searchParams.get("query"),
    // params,
    searchText, filters,updated,courseSubId
  ]);

  // Helper to update URL with filters and page
const updateURL = (page = 1, filtersObj = {}, query = searchText) => {
  const newParams = new URLSearchParams(searchParams.toString());

  // Set filters
 Object.entries(filtersObj).forEach(([key, value]) => {
  if (value && value.length > 0) {
    if (key === "is_active") {
      newParams.set(key, value[0] === true || value[0] === "true" ? "true" : "false");
    } else if (Array.isArray(value)) {
      newParams.set(key, value.join(","));
    } else {
      newParams.set(key, value); // handle strings like question_text, srno
    }
  } else {
    newParams.delete(key);
  }
});


  // Set search text
  if (query) {
    newParams.set("query", query);
  } else {
    newParams.delete("query");
  }

  // Set page
  newParams.set("page", page);

  router.replace(`${pathname}?${newParams.toString()}`);
};


 const handleTableChange = (pagination, _filters, _sorter) => {
  // Merge external filters (like from Advanced Search) and header filters
  const mergedFilters = { ...filters, ..._filters };

  // Normalize: convert undefined/null to []
  Object.keys(mergedFilters).forEach((key) => {
    if (!mergedFilters[key]) mergedFilters[key] = [];
  });

  updateURL(pagination.current, mergedFilters, searchText);
};

  
  const paginationConfig = {
  current: Number(searchParams.get("page")) || 1,
  total: total,
  pageSize: 15,
  showSizeChanger: false,

  // ✅ Position top-left and bottom-right
  position: ["topLeft", "bottomRight"],

  // ✅ Custom pagination footer (shared for both)
  showTotal: (total, range) => {
    let inputValue = "";
    const totalPages = Math.ceil(total / 15);

    const handleGoToPage = () => {
      const page = Number(inputValue);
      if (page >= 1 && page <= totalPages) {
        updatedSearchParams.set("page", page.toString());
        router.replace(`${pathname}?${updatedSearchParams.toString()}`);
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
};



  return (
  
    <Table
  loading={tableLoading}
  rowKey={(record) => record.id}
  dataSource={questions}
  columns={columns}
  onChange={handleTableChange}
  pagination={paginationConfig}
  scroll={{ x: "max-content" }}
  expandable={{
    expandedRowRender: (record) => {
      if (record.question_type === "READING_COMPREHENSION") {
        return (
          <div>
            <div className="font-bold mb-3">Reading Passage:</div>
            <div className="bg-white border-2 p-2 rounded-md">
              <MathContent cls="p-2" content={record.reading_comprehension_passage} />
            </div>
          </div>
        );
      }
      return record.question_type === "GRIDIN" ? <GridInOptions question={record} /> : <McqOptions question={record} />;
    },
    rowExpandable: (record) => record.options.length !== 0,
    expandRowByClick: false,
    expandIcon: ({ expanded, onExpand, record }) =>
      expanded ? <CaretDownFilled onClick={(e) => onExpand(record, e)} /> : <CaretRightFilled onClick={(e) => onExpand(record, e)} />,
  }}
/>

  );
}

export default QuestionsList;
