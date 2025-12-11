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
} from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import QuestionEditModal from "./QuestionEditModal";
import ViewSuggestionModal from "./ViewSuggestionModal";
import { difficultyTagsMap } from "@/utils/utils";
import DOMPurify from "dompurify";
import MathContent from "./MathContent";
import McqOptions from "./question-list/mcq-options";
import GridInOptions from "./question-list/gridin-options";

function TableComponent({
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
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
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
      render: (text) => {
        return <MathContent content={text} />;
      },
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
        showSizeChanger: false,
        onShowSizeChange: false,
        pageSize: 15,
        total: total,
        onChange: (page) => setCurrent(page),
      }}
      rowKey={(record) => record.id}
      rowSelection={rowSelection}
      dataSource={dataSource}
      columns={columns}
      hideSelectAll={false}
      title={() => (
        <div className="font-bold flex justify-between">
          <div>
            {" "}
            <LeftOutlined
              className="mr-2"
              onClick={() => {
                setDescSearch("");
                setDataSource([]);
                setSelectedSection("none");
              }}
            />
            {sectionDetails.section_name}
          </div>
          <div
            className={
              selectedRowKeys.length !== no_of_questions && `text-red-600`
            }
          >
            {selectedRowKeys.length}/{no_of_questions}
          </div>
        </div>
      )}
      footer={() => (
        <div className="flex justify-center">
          <Button
            type="default"
            className="mr-2"
            onClick={() => setSelectedSection("none")}
          >
            Back
          </Button>

          <Button
            type="primary"
            disabled={selectedRowKeys.length !== no_of_questions}
            onClick={handleUpdateClick}
          >
            Update
          </Button>
          {selectedRowKeys.length > no_of_questions && (
            <div className="inline-block ml-2 text-xs text-red-600 uppercase h-5 mt-2">
              (Number of questions exceed the section limit.)
            </div>
          )}
        </div>
      )}
      expandable={{
        expandedRowRender: (record) => {
          return (
            <div className="">
              {record.question_type == "READING_COMPREHENSION" && (
                <>
                  {" "}
                  <div className="font-bold mb-3">Reading Passage:</div>
                  <div className="bg-white border-2 p-2 rounded-md">
                    <MathContent
                      cls={"p-2"}
                      content={record.reading_comprehension_passage}
                    />
                  </div>
                </>
              )}
              {record.question_type == "GRIDIN" ? (
                <GridInOptions question={record} />
              ) : (
                <McqOptions question={record} />
              )}
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
                      <MathContent
                        cls={
                          "font-bold bg-green-200 border-r-4 rounded-lg px-2 py-5"
                        }
                        content={description}
                      />
                    ) : (
                      <MathContent
                        cls={"bg-white border-r-4 rounded-lg px-2 py-5"}
                        content={description}
                      />
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

export default TableComponent;
