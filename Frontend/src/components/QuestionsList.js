import {
  CaretDownFilled,
  CaretRightFilled,
  DeleteTwoTone,
  EditOutlined,
  FilterFilled,
  FilterOutlined,
  SearchOutlined,
  WarningTwoTone,
  CheckCircleFilled,
  CloseCircleFilled,
} from "@ant-design/icons";
import {
  Button,
  Table,
  Input,
  Space,
  Popconfirm,
  Popover,
  Tag,
  Badge,
  Tooltip,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { softDeactivateQuestion } from "@/app/services/authService";

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
  questionSubtypeMap,
} from "@/utils/utils";

import { useMediaQuery } from "react-responsive";
import MathContent from "./MathContent";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import GridInOptions from "./question-list/gridin-options";
import McqOptions from "./question-list/mcq-options";

function QuestionsList({
  courseSubId,
  role,
  searchText,
  filters,
}) {
  const searchParams = useSearchParams();
  const updatedSearchParams = new URLSearchParams(searchParams);
  const [questions, setQuestions] = useState([]);
  const [updated, setUpdated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [tableLoading, setTableLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchedColumn, setSearchedColumn] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });
  const searchInput = useRef(null);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
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
        style={{ padding: 8 }}
        onKeyDown={(e) => e.stopPropagation()}
        className="rounded-lg shadow-lg border border-gray-100 bg-white"
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          defaultValue={searchParams.get("query") || ""}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => {
            confirm({ closeDropdown: true });
            if (selectedKeys[0]) {
              if(dataIndex === "srno") updatedSearchParams.set("srno", selectedKeys[0]);
              else updatedSearchParams.set(dataIndex, selectedKeys[0]);
              updatedSearchParams.set("page", "1");
            } else {
              if(dataIndex === "srno") updatedSearchParams.delete("srno");
              else updatedSearchParams.delete(dataIndex);
            }
            router.replace(`${pathname}?${updatedSearchParams.toString()}`);
            setSearchedColumn(dataIndex);
          }}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space className="flex justify-center">
          <Button
            size="small"
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => {
              confirm({ closeDropdown: true });
              if (selectedKeys[0]) {
                if(dataIndex === "srno") updatedSearchParams.set("srno", selectedKeys[0]);
                else updatedSearchParams.set(dataIndex, selectedKeys[0]);
                updatedSearchParams.set("page", "1");
              } else {
                if(dataIndex === "srno") updatedSearchParams.delete("srno");
                else updatedSearchParams.delete(dataIndex);
              }
              router.replace(`${pathname}?${updatedSearchParams.toString()}`);
              setSearchedColumn(dataIndex);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Search
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#2563eb" : undefined }} />
    ),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
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
      title: "ID",
      dataIndex: "srno",
      key: "srno",
      width: 80,
      align: 'center',
      ...getColumnSearchProps("srno"),
      render: (text) => <span className="font-mono text-gray-500 text-xs font-semibold">#{text}</span>
    },
    {
      title: "Question Content",
      dataIndex: "description",
      key: "description",
      width: 600,
      ...getColumnSearchProps("description"),
      render: (text) => (
        <div className="text-gray-800 text-sm">
          <MathContent content={text} />
        </div>
      ),
    },
    {
      title: "Properties",
      key: "properties",
      width: 300,
      filters: difficultyFilters, // Keeping filters but visual rendering is combined
      filterIcon: (filtered) => <FilterOutlined style={{ color: "gray" }} />,
      render: (_, record) => (
        <div className="flex flex-wrap gap-1.5 align-start">
             {/* Difficulty */}
            <Tag bordered={false} color={difficultyTagsMap[record.difficulty]?.color || 'default'} className="rounded-md mr-0">
               {difficultyTagsMap[record.difficulty]?.label || record.difficulty}
            </Tag>
             
             {/* Type */}
             <Tag bordered={false} className="bg-gray-100 text-gray-600 border border-gray-200 rounded-md mr-0">
                 {questionTypeMap[record.question_type] || record.question_type}
             </Tag>
             
             {/* Subtype if exists */}
             {record.question_subtype && (
                <Tag bordered={false} className="bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md mr-0">
                  {questionSubtypeMap[record.question_subtype]}
                </Tag>
             )}
        </div>
      )
    },
    {
        title: "Subject / Topic",
        key: "topic_info",
        width: 250,
        filters: topics.map(({ id, name }) => ({ value: id, text: name })),
        render: (_, record) => (
            <div className="flex flex-col gap-1 text-xs">
                 {record.topic ? (
                     <div className="font-medium text-gray-700">{record.topic.name || "Unknown Topic"}</div>
                 ) :  <span className="text-gray-400">-</span>}
                 {record.sub_topic && (
                     <div className="text-gray-500 pl-2 border-l-2 border-gray-200">{record.sub_topic.name}</div>
                 )}
            </div>
        )
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      align: "center",
      width: 100,
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      defaultFilteredValue: searchParams.get("is_active")
        ? [searchParams.get("is_active") === "true" ? true : false]
        : null,
      render: (isActive, record) => {
        const StatusConfig = isActive 
        ? { icon: <CheckCircleFilled />, color: "success", text: "Active" } 
        : { icon: <CloseCircleFilled />, color: "error", text: "Inactive" };
        
        const Content = (
            <Tag icon={StatusConfig.icon} color={StatusConfig.color} className="rounded-full px-2.5 py-0.5 border-0 font-medium">
                {StatusConfig.text}
            </Tag>
        );

        if(role !== "admin") return Content;

        return (
            <Popconfirm
                placement="leftTop"
                title={isActive ? "Deactivate Question" : "Activate Question"}
                description={`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this question?`}
                onConfirm={() => isActive ? deactivateConfirm(record.id) : activateConfirm(record.id)}
                okText="Yes"
                cancelText="No"
                 okButtonProps={{ loading: confirmLoading, className: isActive ? 'bg-red-500' : 'bg-green-500' }}
            >
                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                    {Content}
                </div>
            </Popconfirm>
        )
      },
    },
    {
      title: "Action",
      fixed: !isMobile && "right",
      width: 100,
      render: (record) => {
        return (
          <Space>
            <Tooltip title={role === "admin" ? "Edit" : "Suggest Edit"}>
              <Button 
                type="text" 
                shape="circle"
                icon={<EditOutlined className={role !== "admin" && record.has_suggestion ? "text-gray-300" : "text-blue-600"} />}
                disabled={role !== "admin" && record.has_suggestion}
                onClick={() => {
                   if (role == "admin" || !record.has_suggestion) {
                     router.push(
                        `${pathname}/${record.id}/${role == "admin" ? "edit" : "suggest"}?course_subject_id=${searchParams.get("course_subject_id")}&page=${searchParams.get("page")}`
                     );
                   }
                }}
              />
            </Tooltip>
            
            {["admin"].includes(role) && (
              <Popconfirm
                placement="topRight"
                title="Delete Question"
                description="Are you sure you want to delete this question? This action cannot be undone."
                onConfirm={() => deleteConfirm(record.id)}
                okText="Delete"
                okButtonProps={{ danger: true, loading: confirmLoading }}
                cancelText="Cancel"
              >
                <Button type="text" danger shape="circle" icon={<DeleteTwoTone twoToneColor="#f5222d" />} />
              </Popconfirm>
            )}

            {record.has_suggestion && (
               <ViewSuggestionModal
                icon={
                   <Tooltip title="View Suggestion">
                     <Button type="text" shape="circle" icon={<WarningTwoTone twoToneColor="#eeb600" />} />
                   </Tooltip>
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
    setTableLoading(true);
    if (searchParams.get("course_subject_id")) {
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
      
      // ✅ Read page_size from URL, default to 15
      const pageSize = Number(searchParams.get("page_size")) || 15;

      getSubjectQuestions({
        courseSubId: Number(searchParams.get("course_subject_id")),
        page: Number(searchParams.get("page")) || 1,
        question_text: searchText,
        params: paramsPayload,
        page_size: pageSize, // 🔥 Pass page_size to API
      })
        .then((res) => {
          setQuestions(res.data.results.questions);
          setTopics(res.data.results.topics);
          setTotal(res.data.count);
        })
        .finally(() => setTableLoading(false));
    }
  }, [
    searchParams.toString(),
    searchText, filters, updated, courseSubId
  ]);

  // ✅ Updated to handle pageSize
  const updateURL = (page = 1, filtersObj = {}, query = searchText, pageSize = 15) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(filtersObj).forEach(([key, value]) => {
      if (value && value.length > 0) {
        if (key === "is_active") {
          newParams.set(key, value[0] === true || value[0] === "true" ? "true" : "false");
        } else if (Array.isArray(value)) {
          newParams.set(key, value.join(","));
        } else {
          newParams.set(key, value);
        }
      } else {
        newParams.delete(key);
      }
    });

    if (query) newParams.set("query", query); else newParams.delete("query");
    newParams.set("page", page);
    
    // 🔥 Persist page_size
    if (pageSize) newParams.set("page_size", pageSize);

    router.replace(`${pathname}?${newParams.toString()}`);
  };

  const handleTableChange = (pagination, _filters, _sorter) => {
    const mergedFilters = { ...filters, ..._filters };
    Object.keys(mergedFilters).forEach((key) => {
      if (!mergedFilters[key]) mergedFilters[key] = [];
    });
    // ✅ Capture pageSize from pagination object
    updateURL(pagination.current, mergedFilters, searchText, pagination.pageSize);
  };

  const currentSize = Number(searchParams.get("page_size")) || 15;

  const paginationConfig = {
    current: Number(searchParams.get("page")) || 1,
    total: total,
    pageSize: currentSize,
    showSizeChanger: true, // ✅ Enable size changer
    showQuickJumper: true, // ✅ Enable quick jumper
    pageSizeOptions: ['10', '20', '50', '100'], // ✅ Options
    position: ["bottomRight"],
    className: "custom-pagination px-4 pb-4",
    showTotal: (total, range) => (
       <div className="flex items-center gap-2">
           <span className="text-gray-500 font-medium">
             Showing {range[0]}-{range[1]} of {total} questions
           </span>
       </div>
    ),
    onShowSizeChange: (current, size) => {
        // Handled via handleTableChange usually, but good to have if needed
    }
  };

  return (
    <>
      <Table
        loading={tableLoading}
        rowKey={(record) => record.id}
        dataSource={questions}
        columns={columns}
        onChange={handleTableChange}
        pagination={paginationConfig}
        scroll={{ x: 1000 }}
        className="questions-table"
        rowClassName="hover:bg-blue-50/30 transition-colors"
        expandable={{
          expandedRowRender: (record) => {
            if (record.question_type === "READING_COMPREHENSION") {
              return (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 m-4">
                  <div className="font-bold text-gray-700 mb-3 border-b border-gray-200 pb-2">Reading Passage</div>
                  <div className="prose max-w-none text-gray-600">
                    <MathContent cls="p-2" content={record.reading_comprehension_passage} />
                  </div>
                </div>
              );
            }
            return (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 m-4">
                {record.question_type === "GRIDIN" ? <GridInOptions question={record} /> : <McqOptions question={record} />}
              </div>
            );
          },
          rowExpandable: (record) => record.options.length !== 0,
          expandIcon: ({ expanded, onExpand, record }) =>
            expanded 
              ? <CaretDownFilled onClick={(e) => onExpand(record, e)} className="text-blue-500 text-lg cursor-pointer" /> 
              : <CaretRightFilled onClick={(e) => onExpand(record, e)} className="text-gray-400 text-lg hover:text-blue-500 cursor-pointer" />,
        }}
      />
      <style jsx global>{`
        .questions-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #475569 !important;
          font-weight: 600 !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .questions-table .ant-table-tobdy > tr > td {
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .questions-table .ant-pagination-item-active {
          border-color: #2563eb !important;
        }
        .questions-table .ant-pagination-item-active a {
          color: #2563eb !important;
        }
      `}</style>
    </>
  );
}

export default QuestionsList;
