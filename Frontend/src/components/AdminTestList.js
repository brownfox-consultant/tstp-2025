"use client";
import { deleteTest, getTestsList } from "@/app/services/authService";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import { testFormatTypeFilters } from "@/utils/utils";
import { DeleteTwoTone, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Popconfirm, Space, Table } from "antd";
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
  const role = pathname.split("/")[1];
  const [searchText, setSearchText] = useState("");
  const [params, setParams] = useState({});
  const [searchedColumn, setSearchedColumn] = useState("");
  const [courses, setCourses] = useState([]);
  const searchInput = useRef(null);

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
          {/* <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Search
          </Button> */}

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
    // onFilter: (value, record) =>
    //   record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
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
    newParams.format_type = filters.format_type[0]; // send single value
  }

  if (filters.course_name && filters.course_name.length > 0) {
    newParams.course = filters.course_name[0]; // ✅ backend expects `course`
  }

  setParams(newParams);
};


  console.log("courses", courses);

  useEffect(() => {
    setTableLoading(true);
    getTestsList({ page: current, search: searchText, ...params })
      .then((res) => {
        setTestsData(res.data.results);
        setCurrent(res.data.current_page);
        setTotal(res.data.count);
        setTotalPages(res.data.total_pages);
      })
      .finally(() => setTableLoading(false));
  }, [updated, current, searchText, params]);

  const deleteConfirm = (id) => {
    setConfirmLoading(true);
    deleteTest(id)
      .then((res) => {
        setUpdated(!updated);
      })
      .catch((err) => console.log("err", err))
      .finally(() => setConfirmLoading(false));
  };

  const adminCols = [
    {
      key: "course_name",
      title: "Course",
      dataIndex: "course_name",
      filters: courses?.map(({ id, name }) => {
        return { value: id, text: name };
      }),
      render: (text) => <>{text}</>,
    },
    {
      key: "name",
      title: "Test Name",
      dataIndex: "name",
      ...getColumnSearchProps("name"),
      render: (text, record) => {
        return (
          <Button
            type="link"
            onClick={() => router.push(`${pathname}/edit/${record.id}`)}
          >
            {text}
          </Button>
        );
      },
    },
    // {
    //   key: "test_type",
    //   title: "Type of Test",
    //   dataIndex: "test_type",
    //   render: (text) => <>{text}</>,
    // },
    {
      key: "format_type",
      title: "Test Format",
      dataIndex: "format_type",
      filters: testFormatTypeFilters,
      render: (text) => <>{text}</>,
    },
    {
      key: "created_at",
      title: "Created On",
      dataIndex: "created_at",
      render: (date) => <>{dayjs(date).format("MMM D, YYYY h:mm A")}</>,
    },
    {
      key: "Action",
      title: "Action",
      align: "center",
      render: (_, record) => {
        return (
          <>
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
              <DeleteTwoTone twoToneColor="#eb2f96" />
            </Popconfirm>
          </>
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
      render: (text) => <>{text}</>,
    },
    {
      key: "name",
      title: "Test Name",
      dataIndex: "name",
      ...getColumnSearchProps("name"),
      render: (text, record) => {
        return (
          <Button
            type="link"
            onClick={() => router.push(`${pathname}/edit/${record.id}`)}
          >
            {text}
          </Button>
        );
      },
    },
    {
      key: "format_type",
      title: "Test Format",
      dataIndex: "format_type",
      filters: testFormatTypeFilters,
      render: (text) => <>{text}</>,
    },
    {
      key: "created_at",
      title: "Created On",
      dataIndex: "created_at",
      render: (date) => <>{dayjs(date).format("MMM D, YYYY h:mm A")}</>,
    },
  ];

  const colsMap = {
    admin: adminCols,
    faculty: facultyCols,
    mentor: facultyCols,
  };

  return (
    <>
      <div className="text-xl font-bold mb-5 flex justify-between">
        Full Length Tests List
        {role == "admin" && (
          <Button
            type="primary"
            onClick={() => router.push(`${pathname}/create`)}
          >
            Create Test
          </Button>
        )}
      </div>
      <Table
        loading={tableLoading}
        dataSource={testsData}
        columns={colsMap[role]}
        onChange={handleTableChange}
        footer={() => (
          <div className="flex justify-end mr-5">
            Page {current} of {totalPages} (Total: {total} records)
          </div>
        )}
        pagination={{
          showSizeChanger: false,
          pageSize: 10,
          total: total,
          onChange: (page) => {
            setCurrent(page);
          },
        }}
        scroll={{ x: "max-content" }}
      ></Table>
    </>
  );
}

export default AdminTestList;
