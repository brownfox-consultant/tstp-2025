"use client";

import { getDoubtsList } from "@/app/services/authService";
import { Table, Input, Pagination } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState, useRef } from "react";
import ViewDoubtModal from "./ViewDoubtModal";
import DoubtStatusTag from "./DoubtStatusTag";
import { usePathname } from "next/navigation";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

function DoubtsList() {
  const [doubtsData, setDoubtsData] = useState([]);
  const [skeletonLoading, setSkeletonLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [current, setCurrent] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [sortParams, setSortParams] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const debounceTimeoutRef = useRef(null);
  const formatDateTime = (text) => 
  text ? dayjs.utc(text).tz("Asia/Kolkata").format("MMM D, YYYY h:mm A") : "-";
  const role = usePathname().split("/")[1];

  const formatTestType = (type) => {
  if (!type) return "-";
  return type === "EXAM" ? "Full Length Tests" : type;
};


  useEffect(() => {
    console.log("Sort Params", sortParams);
    const params = {
      page: current,
    };
    if (Object.keys(sortParams).length > 0) {
      params.ordering = Object.keys(sortParams)
        .map((key) => (sortParams[key] === "asc" ? key : `-${key}`))
        .join(",");
    }

    if (debouncedSearchTerm) {
      params.search = debouncedSearchTerm;
    }
    setSkeletonLoading(true);
    getDoubtsList(params)
      .then((res) => {
        const { results, count, current_page, total_pages } = res.data;
        setCurrent(current_page);
        setTotal(count);
        setDoubtsData(results);
        setTotalPages(total_pages);
      })
      .catch((err) => console.log(err))
      .finally(() => setSkeletonLoading(false));
  }, [updated, current, sortParams, debouncedSearchTerm]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(value);
    }, 1000);
    setCurrent(1);
  };

  const adminCols = [
    {
      key: "student",
      dataIndex: "student",
      title: "Student",
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      render: (text) => <>{text}</>,
    },
    {
      key: "description",
      dataIndex: "description",
      title: "Doubt",
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      render: (text) => <>{text}</>,
    },
    {
      key: "status",
      dataIndex: "status",
      title: "Status",
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      render: (text) => <DoubtStatusTag status={text} />,
    },
    {
  key: "test_type",
  dataIndex: "test_type",
  title: "Test Type",
  sorter: true,
  render: (text) => <>{formatTestType(text)}</>,
},

    {
      key: "created_at",
      dataIndex: "created_at",
      title: "Created on",
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      render: (text) => formatDateTime(text),

    },
    {
  key: "faculty_assigned_date",
  dataIndex: "faculty_assigned_date",
  title: (
    <div className="flex items-center whitespace-nowrap">
      Faculty Assigned Date
    </div>
  ),
  width: 200, // Optional but helps with layout stability
  sorter: true,
  render: (text) => formatDateTime(text),
},

    {
      key: "resolution_date",
      dataIndex: "resolution_date",
      title: "Resolved on",
      width: 150,
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      render: (text) => formatDateTime(text),
    },
     {
    key: "resolved_by",
    dataIndex: "resolved_by",
    title: "Resolved By",
       width: 150,
    sorter: true,
    render: (text) => <>{text || "-"}</>,
  },
    {
      key: "action",
      title: "Action",
      align: "center",
      render: (id, record) => (
        <ViewDoubtModal
          updated={updated}
          setUpdated={setUpdated}
          data={record}
        />
      ),
    },
  ];
  
  const studentCols = [
    {
      key: "description",
      dataIndex: "description",
      title: (
        <div className="flex items-center">
          <span>Doubt</span>
        </div>
      ),
      render: (text) => {
        return <>{text}</>;
      },
      align: "left",
      width: 400,
      sorter: true,
      sorter: { multiple: 1 },
    },
    {
      key: "status",
      dataIndex: "status",
      title: (
        <div className="flex items-center">
          <span>Status</span>
        </div>
      ),
      render: (text) => {
        return <DoubtStatusTag status={text} />;
      },
      align: "left",
      width: 100,
      sorter: true,
      sorter: { multiple: 2 },
    },
    {
  key: "test_type",
  dataIndex: "test_type",
  title: "Test Type",
  sorter: true,
  render: (text) => <>{formatTestType(text)}</>,
},

    {
      key: "created_at",
      dataIndex: "created_at",
      title: (
        <div className="flex items-center">
          <span>Created on</span>
        </div>
      ),
      render: (text) => formatDateTime(text),
      align: "left",
      width: 200,
      sorter: true,
      sorter: { multiple: 3 },
    },
    {
      key: "resolution_date",
      dataIndex: "resolution_date",
      title: (
        <div className="flex items-center">
          <span>Resolved on</span>
        </div>
      ),
      align: "left",
      width: 150,
     render: (text) => formatDateTime(text),
      sorter: true,
      sorter: { multiple: 4 },
    },
     {
    key: "resolved_by",
    dataIndex: "resolved_by",
    title: "Resolved By",
       width: 150,
    sorter: true,
    render: (text) => <>{text || "-"}</>,
  },
    {
      key: "action",
      title: "   ",
      align: "center",

      render: (id, record, index) => {
        return (
          <ViewDoubtModal
            role="student"
            updated={updated}
            setUpdated={setUpdated}
            data={record}
          />
        );
      },
    },
  ];

  const facultyCols = [
    {
      key: "student",
      dataIndex: "student",
      title: "Student",
      render: (text) => {
        return <>{text}</>;
      },
    },
    {
      key: "description",
      dataIndex: "description",
      title: "Doubt",
      render: (text) => {
        return <>{text}</>;
      },
    },
    {
      key: "status",
      dataIndex: "status",
      title: "Status",
      render: (text) => {
        return <DoubtStatusTag status={text} />;
      },
    },
    {
  key: "test_type",
  dataIndex: "test_type",
  title: "Test Type",
  sorter: true,
  render: (text) => <>{formatTestType(text)}</>,
},

    {
      key: "created_at",
      dataIndex: "created_at",
      title: "Created on",
      render: (text) => formatDateTime(text),
    },
    {
      key: "faculty_assigned_date",
      dataIndex: "faculty_assigned_date",
      title: (
        <div className="flex items-center whitespace-nowrap">
          Faculty Assigned Date
        </div>
      ),
      width: 200, // Optional but helps with layout stability
      sorter: true,
      render: (text) => formatDateTime(text),
    },

    {
      key: "resolution_date",
      dataIndex: "resolution_date",
      title: "Resolved on",
      width: 150,
      align: "center",
      render: (text) => formatDateTime(text),
    },
     {
    key: "resolved_by",
    dataIndex: "resolved_by",
    title: "Resolved By",
       width: 150,
    sorter: true,
    render: (text) => <>{text || "-"}</>,
  },
    {
      key: "action",
      title: "Action",
      align: "center",

      render: (id, record, index) => {
        return (
          <ViewDoubtModal
            updated={updated}
            setUpdated={setUpdated}
            data={record}
          />
        );
      },
    },
  ];

  const parentCols = [
  {
    key: "student",
    dataIndex: "student",
    title: "Student",
    render: (text) => {
      return <>{text}</>;
    },
  },
  {
    key: "description",
    dataIndex: "description",
    title: "Doubt",
    render: (text) => {
      return <>{text}</>;
    },
  },
  {
    key: "status",
    dataIndex: "status",
    title: "Status",
    render: (text) => {
      return <DoubtStatusTag status={text} />;
    },
  },
  {
  key: "test_type",
  dataIndex: "test_type",
  title: "Test Type",
  sorter: true,
  render: (text) => <>{formatTestType(text)}</>,
},

  {
    key: "created_at",
    dataIndex: "created_at",
    title: "Created on",
    render: (text) => formatDateTime(text),
  },
  {
    key: "faculty_assigned_date",
    dataIndex: "faculty_assigned_date",
    title: (
      <div className="flex items-center whitespace-nowrap">
        Faculty Assigned Date
      </div>
    ),
    width: 200,
    sorter: true,
    render: (text) => formatDateTime(text),
  },
  {
    key: "resolution_date",
    dataIndex: "resolution_date",
    title: "Resolved on",
    width: 150,
    align: "center",
    render: (text) => formatDateTime(text),
    },
   {
    key: "resolved_by",
    dataIndex: "resolved_by",
    title: "Resolved By",
     width: 150,
    sorter: true,
    render: (text) => <>{text || "-"}</>,
  },
  {
    key: "action",
    title: "Action",
    align: "center",
    render: (id, record) => (
      <ViewDoubtModal
        updated={updated}
        setUpdated={setUpdated}
        data={record}
        role="parent"
      />
    ),
  },
];


  const colsMap = {
    admin: adminCols,
    student: studentCols,
    faculty: facultyCols,
    parent: parentCols,
    mentor: facultyCols,
  };

  const itemRender = (_, type, originalElement) => {
    if (type === "prev") {
      return <a>Previous</a>;
    }
    if (type === "next") {
      return <a>Next</a>;
    }
    return originalElement;
  };

  const handleTableChange = (pagination, filters, sorter) => {
  let sortObj = {};

  if (Array.isArray(sorter)) {
    sorter.forEach((s) => {
      if (s.order === "ascend") {
        sortObj[s.field || s.columnKey] = "asc";
      } else if (s.order === "descend") {
        sortObj[s.field || s.columnKey] = "desc";
      }
    });
  } else if (sorter && sorter.order) {
    const sortKey = sorter.field || sorter.columnKey;
    sortObj[sortKey] = sorter.order === "ascend" ? "asc" : "desc";
  }

  setSortParams(sortObj);
};


  return (
    <div>
      <div className="mb-8 mt-4">
        <Input
          placeholder={`Search`}
          onChange={handleSearchChange}
          style={{
            marginBottom: 8,
            display: "block",
            width: "25%",
            height: "40px",
            fontSize: "18px",
            backgroundImage: `url('/icons/search.svg')`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "10px center",
            paddingLeft: "40px",
            backgroundSize: "20px",
          }}
        />
      </div>
      <div>
        <Table
          footer={() => (
            <div className="footer-container">
              <div className="flex justify-end mr-5">
                Page {current} of {totalPages} (Total: {total} records)
              </div>
              <Pagination
                className="size-changer"
                current={current}
                pageSize={10}
                total={total}
                itemRender={itemRender}
                onChange={(page) => {
                  setCurrent(page);
                }}
                showSizeChanger={false}
              />
            </div>
          )}
          loading={skeletonLoading}
          dataSource={doubtsData}
          columns={colsMap[role]}
          pagination={false}
          rowClassName={(record, index) =>
            index % 2 === 0 ? "even-row" : "odd-row"
          }
          className="tablestyles mt-4"
          scroll={{ x: "max-content", y: 480 }}
          onChange={handleTableChange}
        ></Table>
      </div>
    </div>
  );
}

export default DoubtsList;
