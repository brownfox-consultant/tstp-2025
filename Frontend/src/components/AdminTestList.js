"use client";
import { deleteTest, getTestsList } from "@/app/services/authService";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import { testFormatTypeFilters } from "@/utils/utils";
import {
  DeleteTwoTone,
  SearchOutlined,
  PlusOutlined,
  FileTextOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  FilterOutlined,
  ReloadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { Button, Input, Popconfirm, Space, Table, Tag, Select } from "antd";
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
    getTestsList({ page: current, search: searchText || globalSearch, size: pageSize, ...params })
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
      LINEAR: { color: "bg-green-100 text-green-700 border-green-200", label: "Linear" },
      DYNAMIC: { color: "bg-purple-100 text-purple-700 border-purple-200", label: "Dynamic" },
    };
    const style = config[type] || { color: "bg-gray-100 text-gray-600 border-gray-200", label: type };
    return (
      <span className={`flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium border  w-[70px] ${style.color}`}>
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
          <span className="font-medium text-gray-700">{text}</span>
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
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-all bg-transparent"
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
      render: (date) => (
        <div className="flex items-center gap-2 text-gray-600">
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
          <Popconfirm
            placement="leftTop"
            title="Delete the test"
            description="Are you sure to delete this test?"
            onConfirm={() => deleteConfirm(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{
              loading: confirmLoading,
            }}
          >
            <button className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all border border-red-200 ">
              <DeleteTwoTone twoToneColor="#eb2f96" />
            </button>
          </Popconfirm>
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
          <span className="font-medium text-gray-700">{text}</span>
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
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-all bg-transparent"
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
      render: (date) => (
        <div className="flex items-center gap-2 text-gray-600">
          <CalendarOutlined className="text-gray-400" />
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

  return (
    <div className="min-h-screen">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex flex-row gap-4 mb-6 justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Full Length Tests</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and create full length tests</p>
          </div>
          <div className="flex items-center gap-3">
            {role == "admin" && (
              <button
                onClick={() => router.push(`${pathname}/create`)}
                className="h-11 px-6 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 flex items-center gap-2"
              >
                <PlusOutlined />
                Create Test
              </button>
            )}
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-4 space-y-4">
          {/* Row 1: Title, Search, Page Info */}
          <div className="flex flex-row md:items-center lg:items-center justify-between gap-4">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <FileTextOutlined className="text-gray-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Tests Library</h3>
                <p className="text-sm text-gray-500">{total} tests available</p>
              </div>
            </div>

            {/* Page Info */}
            <div className="flex items-center gap-2 px-5 py-2 rounded-md bg-gray-50 border border-gray-200">
              <span className="text-sm text-gray-500">Page</span>
              <span className="text-lg font-bold text-gray-800">{current}</span>
              <span className="text-sm text-gray-500">of {totalPages}</span>
            </div>
          </div>

          {/* Row 2: Filters */}
          <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-gray-100 justify-between">
            {/* Search Input */}

            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tests..."
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <Table
            loading={tableLoading}
            dataSource={testsData}
            columns={colsMap[role]}
            onChange={handleTableChange}
            rowKey={(record) => record.id}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} tests`,
              pageSizeOptions: ["10", "20", "50", "100"],
              locale: { items_per_page: "" },
              pageSize: pageSize,
              total: total,
              current: current,
              onChange: (page, pageSize) => {
                setCurrent(page);
                setPageSize(pageSize);
              },
              onShowSizeChange: (current, size) => {
                setPageSize(size);
                setCurrent(1);
              },
            }}
            margin={"10px"}
            scroll={{ x: "max-content" }}
          />
          <style jsx global>{`
            .ant-pagination {
              padding: 12px 18px !important;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

export default AdminTestList;
