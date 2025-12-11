"use client";

import {
  getMeetingsList,
  markMeetingAsComplete,
} from "@/app/services/authService";
import { Button, Dropdown, Modal, Table, Tag } from "antd";
import React, { useEffect, useState } from "react";
import DoubtStatusTag from "./DoubtStatusTag";
import dayjs from "dayjs";
import { usePathname } from "next/navigation";
import ViewMeetingDetails from "./ViewMeetingDetails";
import { MoreOutlined } from "@ant-design/icons";

function MeetingsList({ updated, setUpdated }) {
  const [meetingsData, setMeetingsData] = useState([]);
  const pathname = usePathname();
  const role = pathname.split("/")[1];
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [sortParams, setSortParams] = useState({});

  const handleComplete = (id) => {
    markMeetingAsComplete(id).then(() => {
      Modal.success({ title: "Meeting marked as completed" });
      setUpdated(!updated);
    });
  };

  const fetchData = () => {
    const params = { page: current };

    if (Object.keys(sortParams).length > 0) {
      params.ordering = Object.entries(sortParams)
        .map(([key, order]) => (order === "ascend" ? key : `-${key}`))
        .join(",");
    }

    setLoading(true);
    getMeetingsList(params)
      .then((res) => {
        setCurrent(res.data.current_page);
        setTotal(res.data.count);
        setMeetingsData(res.data.results);
        setTotalPages(res.data.total_pages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [updated, current, sortParams]);

  const handleTableChange = (pagination, filters, sorter) => {
    
    const orderingFieldMap = {
      email: 'requested_by__email',
      phone_number: 'requested_by__phone_number',
      requested_by: 'requested_by__name',
    };
    const sortObj = {};
if (Array.isArray(sorter)) {
  sorter.forEach((s) => {
    if (s.order) {
      const field = orderingFieldMap[s.field] || s.field;
      sortObj[field] = s.order;
    }
  });
} else if (sorter.order) {
  const field = orderingFieldMap[sorter.field] || sorter.field;
  sortObj[field] = sorter.order;
}
    setSortParams(sortObj);
  };

  const adminCols = [
    {
  title: "Meeting",
  dataIndex: "description",
  sorter: true,
  render: (text) => (
    <div className="whitespace-pre-wrap break-words max-w-[60ch] leading-relaxed">
      {text}
    </div>
  ),
},

    {
      title: "Requested By",
      dataIndex: "requested_by",
      sorter: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      sorter: true,
    },
    {
      title: "Contact Number",
      dataIndex: "phone_number",
      sorter: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      sorter: true,
      render: (text) => (
        <Tag color={text === "SCHEDULED" ? `blue` : "green"}>
          {text.toUpperCase()}
        </Tag>
      ),
    },
   {
  key: "requested_times",
  dataIndex: "requested_times",
  title: "Requested Time(s)",
  align: "center",
  sorter: false,  // you can't sort arrays directly
  render: (times) =>
    Array.isArray(times) && times.length > 0 ? (
      <div className="flex flex-col">
        {times.map((t, i) => (
          <span key={i}>{dayjs(t).format("MMM D, YYYY HH:mm")}</span>
        ))}
      </div>
    ) : (
      "-"
    ),
},

    {
      key: "approved_time",
      dataIndex: "approved_time",
      title: "Approved Time",
      align: "center",
      sorter: true,
      render: (text, record) =>
        text ? (
          <Tag
            color={
              record.approved_time === record.requested_time ? "green" : "yellow"
            }
          >
            {dayjs(new Date(text)).format("MMM D, YYYY HH:mm")}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      key: "action",
      dataIndex: "action",
      title: "Action",
      align: "center",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                label: (
                  <ViewMeetingDetails
                    data={record}
                    updated={updated}
                    setUpdated={setUpdated}
                  />
                ),
                key: "1",
              },
              // {
              //   label: (
              //     <Button onClick={() => handleComplete(record.id)}>
              //       Mark as complete
              //     </Button>
              //   ),
              //   key: "2",
              // },
            ],
          }}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const parentCols = [...adminCols.filter(col => col.key !== "action")];

  const colsMap = {
    admin: adminCols,
    parent: parentCols,
  };

  return (
    <Table
      footer={() => (
        <div className="flex justify-end mr-5">
          Page {current} of {totalPages} (Total: {total} records)
        </div>
      )}
      loading={loading}
      columns={colsMap[role]}
      dataSource={meetingsData}
      scroll={{ x: "max-content" }}
      pagination={{
        showSizeChanger: false,
        pageSize: 15,
        onChange: (page) => setCurrent(page),
        total,
      }}
      onChange={handleTableChange}
    />
  );
}

export default MeetingsList;
