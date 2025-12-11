"use client";

import { getIssuesList } from "@/app/services/authService";
import { Table, Pagination, Input } from "antd";
import React, { useEffect, useState, useRef } from "react";
import DoubtStatusTag from "./DoubtStatusTag";
import dayjs from "dayjs";
import { usePathname } from "next/navigation";
import ViewIssueModal from "./ViewIssueModal";
// ✅ Import plugins
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// ✅ Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

function IssuesList({ updated, setUpdated }) {
  const [issuesData, setIssuesData] = useState("");
  const pathname = usePathname();
  let role = pathname.split("/")[1];
  const [total, setTotal] = useState();
  const [totalPages, setTotalPages] = useState(0);
  const [current, setCurrent] = useState();
  const [loading, setLoading] = useState(false);
  const [sortParams, setSortParams] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const debounceTimeoutRef = useRef(null);
  const formatDateTime = (text) => 
    text ? dayjs.utc(text).tz("Asia/Kolkata").format("MMM D, YYYY h:mm A") : "-";

  const adminCols = [
    {
      title: "Issue",
      dataIndex: "description",
      sorter: true,
    },
    {
      title: "Raised By",
      dataIndex: "student",
      sorter: true,
      width: 200,
    },
    {
      title: "Status",
      dataIndex: "status",
      sorter: true,
      render: (text) => <DoubtStatusTag status={text} />,
    },
    {
      key: "created_at",
      title: "Created On",
      dataIndex: "created_at",
      sorter: true,
      render: (text) => formatDateTime(text),
    },
    {
      key: "resolution_date",
      dataIndex: "resolution_date",
      title: "Resolved on",
      align: "center",
      sorter: true,
      width: 150,
      render: (text) => formatDateTime(text),
    },
     {
    key: "resolved_by",
    dataIndex: "resolved_by",   // ✅ make sure serializer returns this
    title: "Resolved By",
       align: "center",
    width: 150,
    sorter: true,
    render: (text) => text || "-",   // fallback if null
  },
    {
      key: "action",
      title: "Action",
      align: "center",
      render: (id, record, index) => (
        <ViewIssueModal updated={updated} setUpdated={setUpdated} data={record} />
      ),
    },
  ];
  

  const studentCols = [
  {
    title: "Raised By",
    dataIndex: "student",
    sorter: true,
    width: 200,
  },
  {
    title: "Issue",
    dataIndex: "description",
    render: (text) => <>{text}</>,
    width: 400,
    sorter: true,
    sorter: { multiple: 1 },
  },
  {
    key: "status",
    title: "Status",
    dataIndex: "status",
    render: (text) => <DoubtStatusTag status={text} />,
    width: 100,
    sorter: true,
    sorter: { multiple: 2 },
  },
  {
    key: "created_at",
    title: "Created On",
    dataIndex: "created_at",
   render: (text) => formatDateTime(text),
    width: 100,
    sorter: true,
    sorter: { multiple: 3 },
  },
  {
    key: "resolution_date",
    dataIndex: "resolution_date",
    title: "Resolved at",
    render: (text) => formatDateTime(text),
    width: 100,
    sorter: true,
    sorter: { multiple: 4 },
    },
  {
    key: "resolved_by",
    dataIndex: "resolved_by",
    title: "Resolved By",
    align: "center",
    width: 150,
    render: (text) => text || "-",
  },
  {
    key: "action",
    title: "Action",
    width: 100,
    align: "center",
    render: (id, record, index) => (
      <ViewIssueModal
        role="student"
        updated={updated}
        setUpdated={setUpdated}
        data={record}
      />
    ),
  },
];


  const parentCols = [
    {
      title: "Issue",
      dataIndex: "description",
      sorter: true,
    },
    {
      title: "Raised By",
      dataIndex: "student",
      sorter: true,
      width: 200,
    },
    {
      title: "Status",
      dataIndex: "status",
      sorter: true,
      render: (text) => <DoubtStatusTag status={text} />,
    },
    {
      key: "created_at",
      title: "Created On",
      dataIndex: "created_at",
      sorter: true,
      render: (text) => formatDateTime(text),
    },
    {
      key: "resolution_date",
      dataIndex: "resolution_date",
      title: "Resolved at",
      align: "center",
      sorter: true,
      render: (text) => formatDateTime(text),
    },
     {
    key: "resolved_by",
    dataIndex: "resolved_by",
    title: "Resolved By",
       align: "center",
     width: 150,
    render: (text) => text || "-",
  },
    {
      key: "action",
      title: "Action",
      align: "center",
      render: (id, record, index) => (
        <ViewIssueModal role="student" updated={updated} setUpdated={setUpdated} data={record} />
      ),
    },
  ];
  

  const colsMap = {
    admin: adminCols,
    student: studentCols,
    parent: parentCols,
    mentor: studentCols,
  };

  useEffect(() => {
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
    setLoading(true);
    getIssuesList(params)
      .then((res) => {
        setCurrent(res.data.current_page);
        setTotal(res.data.count);
        setIssuesData(res.data.results);
        setTotalPages(res.data.total_pages);
      })
      .finally(() => setLoading(false));
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
          sortObj[s.field] = "asc";
        } else if (s.order === "descend") {
          sortObj[s.field] = "desc";
        }
      });
    } else {
      if (sorter.order === "ascend") {
        sortObj[sorter.field] = "asc";
      } else if (sorter.order === "descend") {
        sortObj[sorter.field] = "desc";
      }
    }

    console.log("Sort Object", sortObj); // Debugging the sort object
    setSortParams(sortObj); // Update the state with the accumulated sort object
  };

  return (
    <>
      <div className="text-xl font-semibold mb-5 flex items-center">
        <Input
          placeholder={`Search`}
          onChange={handleSearchChange}
          style={{
            marginBottom: 8,
            width: "20%",
            display: "block",
            height: "40px",
            fontSize: "18px",
            backgroundImage: `url('/icons/search.svg')`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "10px center",
            paddingLeft: "40px",
            backgroundSize: "20px",
          }}
        />
      </div>{" "}
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
              onChange={(page, size) => {
                setCurrent(page);
                //handlePageSizeChange(page, size); // Update page size
              }}
            />
          </div>
        )}
        loading={loading}
        columns={colsMap[role]}
        dataSource={issuesData}
        scroll={{ x: "max-content", y: 480 }}
        pagination={false}
        rowClassName={(record, index) =>
          index % 2 === 0 ? "even-row" : "odd-row"
        }
        className="tablestyles mt-4"
        onChange={handleTableChange}
      />
    </>
  );
}

export default IssuesList;
