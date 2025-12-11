"use client";

import { getFeedbackList } from "@/app/services/authService";
import { Table, Pagination } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import downArrowIcon from "../../public/icons/down-arrow.svg";
import Image from "next/image";

function FeedbackList() {
  const [feedbackData, setFeedbackData] = useState([]);
  const [skeletonLoading, setSkeletonLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortParams, setSortParams] = useState({});

  const role = usePathname().split("/")[1];

  const fetchData = () => {
    const params = { page: current };

    if (Object.keys(sortParams).length > 0) {
      params.ordering = Object.entries(sortParams)
        .map(([key, order]) => (order === "ascend" ? key : `-${key}`))
        .join(",");
    }

    setSkeletonLoading(true);
    getFeedbackList(params)
      .then((res) => {
        const { results, count, current_page, total_pages } = res.data;
        setCurrent(current_page);
        setTotal(count);
        setFeedbackData(results);
        setTotalPages(total_pages);
      })
      .finally(() => setSkeletonLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [updated, current, sortParams]);

  const handleTableChange = (_, __, sorter) => {
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

  const baseCols = [
    {
      key: "student",
      dataIndex: "student",
      title: "Student",
      sorter: true,
      render: (text) => <>{text}</>,
    },
    {
      key: "description",
      dataIndex: "description",
      title: "Feedback",
      sorter: true,
      render: (text) => <>{text}</>,
    },
    {
      key: "created_by",
      dataIndex: "created_by",
      title: "Created By",
      sorter: true,
    },
    {
      key: "created_at",
      dataIndex: "created_at",
      title: "Created at",
      sorter: true,
      render: (text) => dayjs(new Date(text)).format("MMM D, YYYY"),
    },
  ];

  const colsMap = {
    admin: baseCols,
    student: baseCols,
    mentor: baseCols,
    faculty: baseCols,
    parent: baseCols,
  };

  const itemRender = (_, type, originalElement) => {
    if (type === "prev") return <a>Previous</a>;
    if (type === "next") return <a>Next</a>;
    return originalElement;
  };

  return (
    <div>
      <Table
         rowKey="id" 
        footer={() => (
          <div className="footer-container">
            <div className="flex justify-end mr-5">
              Page {current} of {totalPages} (Total: {total} records)
            </div>
            <Pagination
              className="size-changer"
              current={current}
              pageSize={15}
              total={total}
              itemRender={itemRender}
              onChange={(page) => setCurrent(page)}
            />
          </div>
        )}
        loading={skeletonLoading}
        dataSource={feedbackData}
        columns={colsMap[role]}
        scroll={{ x: "max-content", y: 550 }}
        pagination={false}
        rowClassName={(_, index) => (index % 2 === 0 ? "even-row" : "odd-row")}
        className="tablestyles mt-4"
        onChange={handleTableChange}
      />
    </div>
  );
}

export default FeedbackList;
