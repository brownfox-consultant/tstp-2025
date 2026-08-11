import { Button, Col, Input, Popover, Row, Space, Table, Tag } from "antd";
import React, { useEffect, useRef, useState } from "react";
import {
  addQuestionsService,
  getMultipleQuestions,
} from "@/app/services/authService";
import {
  CaretDownFilled,
  CaretRightFilled,
  LeftOutlined,
  SearchOutlined,
  WarningTwoTone,
  FileTextOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import QuestionEditModal from "./QuestionEditModal";
import ViewSuggestionModal from "./ViewSuggestionModal";
import { difficultyTagsMap } from "@/utils/utils";
import DOMPurify from "dompurify";

function EmptyTableComponent({
  sectionDetails,
  dataSource,
  selectedRowKeys,
  setSelectedRowKeys,
  setSelectedSection,
  updated,
  setUpdated,
  setCurrent,
  total,
  role,
  topics,
  descSearch,
  setDescSearch,
  setDataSource,
  current,
  pageSize = 15,
  setPageSize,
}) {
  const { no_of_questions } = sectionDetails;

  const [testQuestions, setTestQuestions] = useState([]);

  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  const handleExpand = (record) => {
    const rowKey = record.id; // Assuming 'id' is a unique identifier for each row

    // Toggle the expanded state for the clicked row
    const newExpandedRowKeys = expandedRowKeys.includes(rowKey)
      ? expandedRowKeys.filter((key) => key !== rowKey)
      : [...expandedRowKeys, rowKey];

    setExpandedRowKeys(newExpandedRowKeys);
  };

  const onSelectChange = (newSelectedRowKeys) => {
    if (newSelectedRowKeys.length > no_of_questions) {
    }

    setSelectedRowKeys(newSelectedRowKeys);
    // setConsistentKeys([c,...newSelectedRowKeys])
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    preserveSelectedRowKeys: true,
    // onselect: onSelectChangeNew,
  };

  const [searchText, setSearchText] = useState(descSearch);
  const [searchedColumn, setSearchedColumn] = useState("");

  const searchInput = useRef(null);
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    setDataSource([]);
    confirm();
    setDescSearch(selectedKeys[0]);
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };
  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
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
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: "block",
          }}
        />
        <Space className="flex justify-center">
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Search
          </Button>
          {/* <Button
              onClick={() => clearFilters && handleReset(clearFilters)}
              size="small"
              style={{
                width: 90,
              }}
            >
              Reset
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => {
                confirm({
                  closeDropdown: false,
                });
                setSearchText(selectedKeys[0]);
                setSearchedColumn(dataIndex);
              }}
            >
              Filter
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => {
                close();
              }}
            >
              close
            </Button> */}
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
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),

    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      }
    },

    // onFilterDropdownOpenChange: (visible) => {
    //   if (visible) {
    //     setTimeout(() => searchInput.current?.select(), 100);
    //   }
    // }
    
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: "#ffc069",
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(text, {
              USE_PROFILES: { html: true },
            }),
          }}
        ></div>
      ),
  });

  useEffect(() => {
    if (role != "admin") {
      getMultipleQuestions({ question_ids: selectedRowKeys }).then((res) => {
        setTestQuestions(res.data);
      });
    }
  }, [sectionDetails, updated]);

  const columns = [
    {
      title: "Question",
      dataIndex: "description",
      key: "name",
      ...getColumnSearchProps("description"),
    },
    {
      title: "Difficulty",
      dataIndex: "difficulty",
      key: "difficulty",
      render: (text) => {
        return (
          <Tag bordered={false} color={difficultyTagsMap[text].color}>
            {difficultyTagsMap[text].label}
          </Tag>
        );
      },
    },
    {
      title: "Topic",
      dataIndex: "topic",
      key: "topic",
    },
    {
      title: "Sub Topic",
      dataIndex: "sub_topic",
      key: "sub_topic",
      align: "center",
      render: (text) => {
        return <div>{text ? text : "-"}</div>;
      },
    },
    {
      title: "Action",
      fixed: "right",
      width: 100,
      render: (record) => {
        return (
          <Space>
            <QuestionEditModal
              data={record}
              courseSubId={sectionDetails.course_subject_id}
              updated={updated}
              setUpdated={setUpdated}
              role={role}
              topicOptions={topics}
            ></QuestionEditModal>

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

  const handleUpdateClick = () => {
    let payload = {
      course_subject_id: sectionDetails.course_subject_id,
      section_id: sectionDetails.section_id,
      question_ids: selectedRowKeys,
    };

    addQuestionsService(sectionDetails.test_id, payload).then((res) => {
      setSelectedSection("none");
      setUpdated(!updated);
      setCurrent(1);
      setSelectedRowKeys([]);
    });
  };

  return role == "admin" ? (
    <Table
      pagination={{
        current: current,
        showSizeChanger: true,
        pageSizeOptions: ['15', '25', '50', '100'],
        onShowSizeChange: (current, size) => {
          if (setPageSize) setPageSize(size);
          setCurrent(1);
        },
        pageSize: pageSize,
        total: total,
        onChange: (page) => setCurrent(page),
        position: ["topLeft", "bottomRight"],
        showTotal: (total, range) => {
          let inputValue = "";
          const totalPages = Math.ceil(total / pageSize);
          const handleGoToPage = () => {
            const page = Number(inputValue);
            if (page >= 1 && page <= totalPages) {
              setCurrent(page);
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
      rowKey={(record) => record.id}
      rowSelection={rowSelection}
      dataSource={dataSource}
      columns={columns}
      hideSelectAll={false}

      footer={() => {
        const isComplete = selectedRowKeys.length === no_of_questions;
        const isExceeded = selectedRowKeys.length > no_of_questions;
        
        return (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-2">
            {isExceeded && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                <WarningTwoTone twoToneColor="#dc2626" />
                Number of questions exceed the section limit
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSection("none")}
                className="h-11 px-6 rounded-xl border-2 border-gray-300 text-gray-700 font-medium bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 flex items-center gap-2"
              >
                <ArrowLeftOutlined />
                Back
              </button>
              <button
                disabled={!isComplete}
                onClick={handleUpdateClick}
                className={`h-11 px-8 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                  isComplete
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <SaveOutlined />
                Update Questions
              </button>
            </div>
          </div>
        );
      }}
      expandable={{
        expandedRowRender: (record) => {
          return (
            <div className="">
              {record.question_type == "READING_COMPREHENSION" && (
                <>
                  {" "}
                  <div className="font-bold mb-3">Reading Passage:</div>
                  <div className="bg-white border-2 p-2 rounded-md">
                    <div
                      className="p-2"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          record.reading_comprehension_passage,
                          {
                            USE_PROFILES: { html: true },
                          }
                        ),
                      }}
                    ></div>
                  </div>
                </>
              )}
              <div className="font-bold my-3">Options:</div>
              <div className="border-2 p-2 rounded-md">
                <Row className="flex justify-between " gutter={[16, 16]}>
                  {record.options.map(({ description, is_correct }) => (
                    <Col span={12} sm={24} md={12} lg={12}>
                      {is_correct ? (
                        <div
                          className="font-bold bg-green-200 border-2 border-r-4 rounded-lg px-2 py-5"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(description, {
                              USE_PROFILES: { html: true },
                            }),
                          }}
                        ></div>
                      ) : (
                        <div
                          className="bg-white border-r-4 border-2 rounded-lg px-2 py-5"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(description, {
                              USE_PROFILES: { html: true },
                            }),
                          }}
                        ></div>
                      )}
                    </Col>
                  ))}
                </Row>
              </div>
            </div>
          );
        },
        // rowExpandable: (record) => record.options.length != 0,
        expandRowByClick: true,
        expandIcon: ({ expanded, onExpand, record }) =>
          expanded ? (
            <CaretDownFilled onClick={(e) => onExpand(record, e)} />
          ) : (
            <CaretRightFilled onClick={(e) => onExpand(record, e)} />
          ),
      }}
    />
  ) : (
    <Table
      loading={testQuestions.length == 0}
      dataSource={testQuestions}
      columns={columns}
      rowKey={(record) => record.id}
      title={() => (
        <div className="font-bold flex justify-between">
          <div>
            <LeftOutlined
              className="mr-2"
              onClick={() => setSelectedSection("none")}
            />
            {sectionDetails.section_name}
          </div>
          <div>{selectedRowKeys.length} Questions</div>
        </div>
      )}
      expandable={{
        expandedRowRender: (record) => {
          return (
            <div className="pl-12" key={record.id}>
              <div className="font-bold mb-3">Options:</div>
              <Row className="flex justify-between" gutter={[16, 16]}>
                {record.options.map(({ description, is_correct }) => (
                  <Col span={12} sm={24} md={12} lg={12}>
                    {is_correct ? (
                      <div className="font-bold bg-green-200 border-r-4 rounded-lg px-2 py-5">
                        {description}{" "}
                      </div>
                    ) : (
                      <div className="bg-white border-r-4 rounded-lg px-2 py-5">
                        {description}{" "}
                      </div>
                    )}
                  </Col>
                ))}
              </Row>
            </div>
          );
        },
        expandRowByClick: true,
        expandIcon: ({ expanded, onExpand, record }) =>
          expanded ? (
            <CaretDownFilled onClick={(e) => onExpand(record, e)} />
          ) : (
            <CaretRightFilled onClick={(e) => onExpand(record, e)} />
          ),
      }}
    />
  );
}

export default EmptyTableComponent;
