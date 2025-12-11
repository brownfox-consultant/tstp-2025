"use client";

import { getConcernsList } from "@/app/services/authService";
import { Table } from "antd";
import React, { useEffect, useState } from "react";
import DoubtStatusTag from "./DoubtStatusTag";
import dayjs from "dayjs";
import { usePathname } from "next/navigation";
import ViewIssueModal from "./ViewIssueModal";
import ViewConcernModal from "./ViewConcernModal";

function ConcernsList({ updated, setUpdated }) {
  const [concernsData, setConcernsData] = useState([]);
  const pathname = usePathname();
  let role = pathname.split("/")[1];
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortParams, setSortParams] = useState({});

  const adminCols = [
    {
      title: "Concern",
      dataIndex: "description",
      sorter: true,
    },
    {
      title: "Raised By",
      dataIndex: "parent",
      sorter: true,
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
      render: (date) => <>{dayjs(date).format("MMM D, YYYY")}</>,
    },
    {
      key: "resolution_date",
      dataIndex: "resolution_date",
      title: "Resolved at",
      align: "center",
      sorter: true,
      render: (text) => {
        let date = new Date(text);
        return text ? dayjs(date).format("MMM D, YYYY") : "-";
      },
    },
    {
      key: "action",
      title: "Action",
      align: "center",
      render: (_, record) => (
        <ViewConcernModal updated={updated} setUpdated={setUpdated} data={record} />
      ),
    },
  ];

  const parentCols = [
    {
      title: "Concern",
      dataIndex: "description",
      sorter: true,
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
      render: (date) => <>{dayjs(date).format("MMM D, YYYY")}</>,
    },
    {
      key: "resolution_date",
      dataIndex: "resolution_date",
      title: "Resolved at",
      align: "center",
      sorter: true,
      render: (text) => {
        let date = new Date(text);
        return text ? dayjs(date).format("MMM D, YYYY") : "-";
      },
    },
    {
      key: "action",
      title: "Action",
      align: "center",
      render: (_, record) => (
        <ViewIssueModal role="student" updated={updated} setUpdated={setUpdated} data={record} />
      ),
    },
  ];

  const colsMap = {
    admin: adminCols,
    parent: parentCols,
  };

  const fetchData = () => {
    const params = { page: current };

    if (Object.keys(sortParams).length > 0) {
      params.ordering = Object.entries(sortParams)
        .map(([key, order]) => (order === "ascend" ? key : `-${key}`))
        .join(",");
    }

    setLoading(true);
    getConcernsList(params)
      .then((res) => {
        setCurrent(res.data.current_page);
        setTotal(res.data.count);
        setConcernsData(res.data.results);
        setTotalPages(res.data.total_pages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [updated, current, sortParams]);

  const handleTableChange = (pagination, filters, sorter) => {
    const sortObj = {};
    if (Array.isArray(sorter)) {
      sorter.forEach((s) => {
        if (s.order) sortObj[s.field] = s.order;
      });
    } else if (sorter.order) {
      sortObj[sorter.field] = sorter.order;
    }
    setSortParams(sortObj);
  };
  

  return (
    <Table
      footer={() => (
        <div className="flex justify-end mr-5">
          Page {current} of {totalPages} (Total: {total} records)
        </div>
      )}
      loading={loading}
      pagination={{
        showSizeChanger: false,
        pageSize: 15,
        onChange: (page) => setCurrent(page),
        total,
      }}
      columns={colsMap[role]}
      dataSource={concernsData}
      scroll={{ x: "max-content" }}
      onChange={handleTableChange}
    />
  );
}

export default ConcernsList;
