import { getNotificationsForCategory } from "@/app/services/authService";
import { Badge, Table, Tag } from "antd";
import React, { useEffect, useState } from "react";

function NotificationTable({ category }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const notificationCols = [
    {
      key: "status",
      dataIndex: "status",
      align: "center",
      render: (text, record) => {
        return (
          <div>{record.status == "UNREAD" && <Badge status="success" />}</div>
        );
      },
    },
    {
      key: "description",
      dataIndex: "description",
      title: "Description",
    },
    {
      key: "status_text",
      title: "Status",
      dataIndex: "status",
      align: "center",
      render: (text, record) => {
        return (
          <div>
            <Tag color={record.status == "READ" ? `blue` : "gold"}>
              {record.status}
            </Tag>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    setLoading(true);
    getNotificationsForCategory({ category })
      .then(({ data }) => {
        setNotifications(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Table
      columns={notificationCols}
      dataSource={notifications}
      loading={loading}
    />
  );
}

export default NotificationTable;
