"use client";

import { getMaterialsList } from "@/app/services/authService";
import { LeftOutlined } from "@ant-design/icons";
import { Table } from "antd";
import dayjs from "dayjs";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

function page() {
  const params = useParams();
  const router = useRouter();
  const [materialsData, setMaterialsData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  let topic, sub_topic, difficulty;
  if (typeof window !== "undefined") {
    topic = window.sessionStorage.getItem("topic");
    sub_topic = window.sessionStorage.getItem("sub_topic");
    // difficulty = window.sessionStorage.getItem("difficulty");
  }
  useEffect(() => {
    getMaterialsList({
      page: current,
      course_subject_id: params.course_subject,
      topic: topic,
      sub_topic: sub_topic,
      material_type: "VIDEO",
      // difficulty: difficulty,
    })
      .then((res) => {
        console.log("res", res.data);
        const { count, current_page, results } = res.data;
        setMaterialsData(results);
        setCurrent(current_page);
        setTotal(count);
      })
      .finally(() => setTableLoading(false));
  }, []);

  const studentCols = [
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
    },
    {
      key: "topic",
      dataIndex: "topic",
      title: "Topic",
      align: "center",
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
      key: "material_type",
      dataIndex: "material_type",
      title: "Tutorial Type",
      align: "center",
      width: 100,
      render: (text) => (
        <p className="capitalize">{text.toString().toLowerCase()}</p>
      ),
    },
    {
      key: "uploaded_at",
      dataIndex: "uploaded_at",
      align: "center",
      title: "Uploaded on",
      render: (text) => {
        let date = new Date(text);
        return dayjs(date).format("MMM D, YYYY");
      },
    },
  ];
  return (
    <div>
      <div className=" font-semibold text-xl mb-3">
        <LeftOutlined
          onClick={() => router.back()}
          className="mr-1 text-base hover:font-extrabold"
        />
        Guided Practice
      </div>
      <Table
        dataSource={materialsData}
        columns={studentCols}
        loading={tableLoading}
        scroll={{ x: "max-content" }}
        onRow={(record, rowIndex) => {
          return {
            className: "cursor-pointer",
            onClick: (e) => {
              e.stopPropagation();
              let newPath = `/student/${params.id}/tutorials/${record.id}`;
              router.push(newPath);
            },
          };
        }}
        pagination={{
          showSizeChanger: false,
          onShowSizeChange: false,
          pageSize: 15,
          onChange: (page) => setCurrent(page),
          total: total,
        }}
      />
    </div>
  );
}

export default page;
