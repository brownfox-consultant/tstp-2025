"use client";
import { deleteTest, getTestsList } from "@/app/services/authService";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import { testFormatTypeFilters } from "@/utils/utils";
import {
  DeleteTwoTone,
  EditTwoTone,
  SearchOutlined,
  PlusOutlined,
  FileTextOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  FilterOutlined,
  ReloadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { Button, Input, Popconfirm, Space, Table, Tag, Select, Tooltip } from "antd";
import dayjs from "dayjs";
import DOMPurify from "dompurify";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Highlighter from "react-highlight-words";

function AdminTestList() {
  const [testsData, setTestsData] = useState([]);

  const router = useRouter();
  const pathname = usePathname();
  const [updated, setUpdated] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const role = pathname.split("/")[1];
  const [searchText, setSearchText] = useState("");
  const [params, setParams] = useState({});
  const [searchedColumn, setSearchedColumn] = useState("");
  const [courses, setCourses] = useState([]);
  const searchInput = useRef(null);
  const [globalSearch, setGlobalSearch] = useState("");

  useEffect(() => {
    getCoursesInsideAuth().then((res) => {
      setCourses(res.data);
    });
  }, []);

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
          onPressEnter={() => {
            confirm({
              closeDropdown: true,
            });
            setSearchText(selectedKeys[0]);
            setSearchedColumn(dataIndex);
            setCurrent(1);
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
              setSearchText(selectedKeys[0]);
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

  const handleTableChange = (pagination, filters, sorter) => {
    const newParams = {};

    if (filters.format_type && filters.format_type.length > 0) {
      newParams.format_type = filters.format_type[0];
    }

    if (filters.course_name && filters.course_name.length > 0) {
      newParams.course = filters.course_name[0];
    }

    setParams(newParams);
  };

  useEffect(() => {
    setTableLoading(true);
    getTestsList({ page: current, search: searchText || globalSearch, page_size: pageSize, ...params })
      .then((res) => {
        setTestsData(res.data.results);
        setCurrent(res.data.current_page);
        setTotal(res.data.count);
        setTotalPages(res.data.total_pages);
      })
      .finally(() => setTableLoading(false));
  }, [updated, current, pageSize, searchText, globalSearch, params]);

  const deleteConfirm = (id) => {
    setConfirmLoading(true);
    deleteTest(id)
      .then((res) => {
        setUpdated(!updated);
      })
      .catch((err) => console.log("err", err))
      .finally(() => setConfirmLoading(false));
  };

  // Format type badge styling
  const formatTypeBadge = (type) => {
    const config = {
      LINEAR: { color: "bg-green-50 text-green-700", label: "Linear" },
      DYNAMIC: { color: "bg-blue-50 text-blue-700", label: "Dynamic" },
    };
    const style = config[type] || { color: "bg-gray-50 text-gray-700", label: type };
    return (
      <span className={`flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium w-max ${style.color}`}>
        {style.label}
      </span>
    );
  };

  const adminCols = [
    {
      key: "course_name",
      title: "Course",
      dataIndex: "course_name",
      filters: courses?.map(({ id, name }) => {
        return { value: id, text: name };
      }),
      render: (text) => (
        <div>
          <span className="font-medium text   -gray-800">{text}</span>
        </div>
      ),
    },
    {
      key: "name",
      title: "Test Name",
      dataIndex: "name",
      ...getColumnSearchProps("name"),
      render: (text, record) => {
        return (
          <button
            onClick={() => router.push(`${pathname}/edit/${record.id}`)}
            className="text-gray-900 font-bold group-hover:underline group-hover:text-blue-600 transition-all bg-transparent text-left"
          >
            {(searchedColumn === "name" && searchText) || globalSearch ? (
              <Highlighter
                highlightStyle={{ backgroundColor: "#ffc069", padding: 0, borderRadius: 2 }}
                searchWords={[searchText || globalSearch]}
                autoEscape
                textToHighlight={text || ""}
              />
            ) : text}
          </button>
        );
      },
    },
    {
      key: "format_type",
      title: "Test Format",
      dataIndex: "format_type",
      filters: testFormatTypeFilters,
      render: (text) => formatTypeBadge(text),
    },
    {
      key: "created_at",
      title: "Created On",
      dataIndex: "created_at",
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (date) => (
        <div className="flex items-center gap-2 text-gray-400 text-[13.5px]">
          {dayjs(date).format("MMM D, YYYY h:mm A")}
        </div>
      ),
    },
    {
      key: "Action",
      title: "Action",
      align: "start",
      render: (_, record) => {
        return (
          <div className="flex items-center">
            <Tooltip title="Edit Test" placement="top">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`${pathname}/edit/${record.id}`);
                }}
                className="bg-transparent border border-transparent hover:border-blue-200 hover:bg-blue-50 text-blue-600 p-2 rounded-full flex items-center justify-center transition-all cursor-pointer"
              >
                <EditTwoTone twoToneColor="#1677ff" />
              </button>
            </Tooltip>
            <Tooltip title="Delete Test" placement="top">
              <Popconfirm
                placement="leftTop"
                title="Delete the test"
                description="Are you sure to delete this test?"
                onConfirm={(e) => {
                  e.stopPropagation();
                  deleteConfirm(record.id);
                }}
                okText="Yes"
                cancelText="No"
                okButtonProps={{
                  loading: confirmLoading,
                }}
              >
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border border-transparent hover:border-red-200 hover:bg-red-50 text-red-600 p-2 rounded-full flex items-center justify-center transition-all cursor-pointer"
                >
                  <DeleteTwoTone twoToneColor="#eb2f96" />
                </button>
              </Popconfirm>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  const facultyCols = [
    {
      key: "course_name",
      title: "Course",
      dataIndex: "course_name",
      filters: courses?.map(({ id, name }) => {
        return { value: id, text: name };
      }),
      render: (text) => (
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{text}</span>
        </div>
      ),
    },
    {
      key: "name",
      title: "Test Name",
      dataIndex: "name",
      ...getColumnSearchProps("name"),
      render: (text, record) => {
        return (
          <button
            onClick={() => router.push(`${pathname}/edit/${record.id}`)}
            className="text-gray-900 font-bold group-hover:underline group-hover:text-blue-600 transition-all bg-transparent text-left"
          >
            {(searchedColumn === "name" && searchText) || globalSearch ? (
              <Highlighter
                highlightStyle={{ backgroundColor: "#ffc069", padding: 0, borderRadius: 2 }}
                searchWords={[searchText || globalSearch]}
                autoEscape
                textToHighlight={text || ""}
              />
            ) : text}
          </button>
        );
      },
    },
    {
      key: "format_type",
      title: "Test Format",
      dataIndex: "format_type",
      filters: testFormatTypeFilters,
      render: (text) => formatTypeBadge(text),
    },
    {
      key: "created_at",
      title: "Created On",
      dataIndex: "created_at",
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (date) => (
        <div className="flex items-center gap-2 text-gray-400 text-[13.5px]">
          <CalendarOutlined className="text-gray-300" />
          {dayjs(date).format("MMM D, YYYY h:mm A")}
        </div>
      ),
    },
  ];

  const colsMap = {
    admin: adminCols,
    faculty: facultyCols,
    mentor: facultyCols,
  };

  const paginationConfig = {
    current: current || 1,
    total: total,
    pageSize: pageSize,
    showSizeChanger: true,
    pageSizeOptions: ["10", "25", "50", "100"],
    locale: { items_per_page: "" },
    position: ["bottomRight"],
    onChange: (page, pageSize) => {
      setCurrent(page);
      setPageSize(pageSize);
    },
    showTotal: (total, range) => {
      let inputValue = "";
      const maxPages = totalPages;

      const handleGoToPage = () => {
        const page = Number(inputValue);
        if (page >= 1 && page <= maxPages) {
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
            max={maxPages}
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
    <div className="">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex flex-row gap-4 mb-4 justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Full Length Tests</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and create full length tests</p>
          </div>
          <div className="flex items-center gap-3">
            {role == "admin" && (
              <button
                onClick={() => router.push(`${pathname}/create`)}
                className="action-button !px-4 !h-10 !rounded-md"
              >
                <PlusOutlined className="mr-2"/>
                Create Test
              </button>
            )}
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-4 space-y-4">
          {/* Row 2: Filters */}
          <div className="flex items-center gap-3 flex-wrap justify-between">
            {/* Search Input */}

            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Test Name"
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setCurrent(1);
                  }}
                  className="w-full h-11 pl-10 pr-10 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all duration-300 text-gray-700 placeholder-gray-400"
                />
                {globalSearch && (
                  <button
                    onClick={() => {
                      setGlobalSearch("");
                      setCurrent(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent"
                  >
                    <CloseOutlined />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-row flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
              <span className="text-sm font-medium text-gray-500 mr-1">Filters:</span>

              {/* Course Filter */}
              <Select
                value={params.course || undefined}
                placeholder="All Courses"
                onChange={(value) => {
                  setParams(prev => value ? { ...prev, course: value } : { ...prev, course: undefined });
                  setCurrent(1);
                }}
                className="flex-1 sm:flex-none min-w-[150px] rounded-md"
                size="large"
                allowClear
                onClear={() => {
                  setParams(prev => ({ ...prev, course: undefined }));
                  setCurrent(1);
                }}
                style={{ borderRadius: 8 }}
              >
                <Select.Option value="">All Courses</Select.Option>
                {courses?.map(({ id, name }) => (
                  <Select.Option key={id} value={id}>{name}</Select.Option>
                ))}
              </Select>

              {/* Format Type Filter */}
              <Select
                value={params.format_type || undefined}
                placeholder="All Formats"
                onChange={(value) => {
                  setParams(prev => value ? { ...prev, format_type: value } : { ...prev, format_type: undefined });
                  setCurrent(1);
                }}
                className="flex-1 sm:flex-none min-w-[150px]"
                size="large"
                allowClear
                onClear={() => {
                  setParams(prev => ({ ...prev, format_type: undefined }));
                  setCurrent(1);
                }}
              >
                <Select.Option value="">All Formats</Select.Option>
                {testFormatTypeFilters?.map(({ value, text }) => (
                  <Select.Option key={value} value={value}>{text}</Select.Option>
                ))}
              </Select>

              {/* Clear Filters */}
              {(params.course || params.format_type || globalSearch) && (
                <button
                  onClick={() => {
                    setParams({});
                    setGlobalSearch("");
                    setCurrent(1);
                  }}
                  className="h-10 px-4 rounded-lg border-2 border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span><CloseOutlined /></span> Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden [&_.ant-table-row:hover>td]:!bg-transparent">
          <Table
            loading={tableLoading}
            size="small"
            rowClassName={(record, index) =>
              `text-sm bg-white hover:bg-[#FFD36A]/10 transition-colors cursor-pointer group`
            }
            onRow={(record) => {
              return {
                onClick: () => {
                  router.push(`${pathname}/edit/${record.id}`);
                },
              };
            }}
            dataSource={testsData}
            columns={colsMap[role]}
            onChange={handleTableChange}
            rowKey={(record) => record.id}
            pagination={paginationConfig}
            className="[&_.ant-table-tbody>tr:not(.ant-table-measure-row)>td]:!py-1.5 [&_.ant-table-thead>tr>th]:!py-2"
            locale={{
              emptyText: (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <SearchOutlined className="text-4xl text-gray-300 mb-4" />
                  <h3 className="text-[18px] font-semibold text-[#1a202c] mb-2">No tests found</h3>
                  <p className="text-gray-500 text-[16px] mb-6">Try another search or</p>
                  {role === "admin" && (
                    <button
                      onClick={() => router.push(`${pathname}/create`)}
                      className="bg-[#F59403] hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center mx-auto transition-colors"
                    >
                      <PlusOutlined className="mr-2" />
                      Create Test
                    </button>
                  )}
                </div>
              ),
            }}
            scroll={{ x: "max-content" }}
          />
          <style jsx global>{`
            .ant-pagination {
              padding-inline: 16px !important;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

export default AdminTestList;
