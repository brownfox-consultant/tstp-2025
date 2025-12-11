"use client";

import {
  deleteUser,
  getUpcomingOrFreeSubStudents,
} from "@/app/services/authService";

import { DeleteTwoTone } from "@ant-design/icons";
import { Button, Popconfirm, Space, Table } from "antd";
import dayjs from "dayjs";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useMediaQuery } from "react-responsive";

function page() {
  const [studentsData, setStudentsData] = useState([]);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });

  function handleApproveClick(record) {
    window.sessionStorage.setItem(
      "approveStudentDetails",
      JSON.stringify(record)
    );
    window.sessionStorage.removeItem("isTempUser");
    window.sessionStorage.setItem("requireParentDetails", true);
    window.sessionStorage.setItem("areParentDetailsCompulsory", false);
    router.push(`${pathname}/approve`);
  }

  useEffect(() => {
    setLoading(true);
    getUpcomingOrFreeSubStudents(current)
      .then((res) => {
        const { results, count, current_page, total_pages } = res.data;
        setStudentsData(results);
        setCurrent(current_page);
        setTotal(count);
        setTotalPages(total_pages);
      })
      .finally(() => setLoading(false));
  }, [updated, current]);

  const deleteConfirm = (id) => {
    setConfirmLoading(true);
    deleteUser(id)
      .then((res) => {
        setUpdated(!updated);
      })
      .catch((err) => console.log("err", err))
      .finally(() => setConfirmLoading(false));
  };

  const cols = [
    {
      title: "Course",
      dataIndex: "course_details",
      key: "course",
      align: "center",
      render: (_, record) => {
        return (
          <>
            {record.course_details.length
              ? record.course_details
                  .map(({ course }) => {
                    return course.name;
                  })
                  .join(", ")
              : "-"}
          </>
        );
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <>{text}</>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text) => <>{text}</>,
    },
    {
      title: "Contact Number",
      dataIndex: "phone_number",
      key: "phone_number",
      align: "center",
      render: (text) => <>{text}</>,
    },
    // {
    //   title: "Parent Contact Number",
    //   dataIndex: "parent_phone_number",
    //   key: "parent_phone_number",
    //   render: (text) => <>{text}</>,
    // },
    {
      title: "Subscription Type",
      key: "subscription_type",
      dataIndex: "course_details",
      width: 120,
      align: "center",
      render: (courseArray, record) => {
        return <>{courseArray[0].subscription_type}</>;
      },
    },
    {
      title: "Subscription ends on",
      key: "subscription_end_date",
      dataIndex: "course_details",
      width: 120,
      align: "center",
      render: (courseArray, record) => {
        return <>{courseArray[0].subscription_end_date}</>;
      },
    },

    {
      title: "Action",
      key: "val",
      dataIndex: "val",
      align: "center",
      fixed: !isMobile && "right",
      render: (_, record) => {
        return (
          <Space>
            <Button type="primary" onClick={() => handleApproveClick(record)}>
              Approve
            </Button>
            <Popconfirm
              className="ml-3"
              placement="leftTop"
              title="Delete the user"
              description="Are you sure to delete this user?"
              onConfirm={() => deleteConfirm(record.id)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{
                loading: confirmLoading,
              }}
            >
              <DeleteTwoTone twoToneColor="#eb2f96" />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  function expandedRowRenderFunc(record, index, indent, expanded) {
    const nestedCols = [
      {
        title: "Role",
        dataIndex: "role",
        key: "role",
        render: (text) => <>{text}</>,
      },
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (title) => <>{title}</>,
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "x",
        render: (text) => <>{text}</>,
      },
      {
        title: "Contact Number",
        dataIndex: "phone_number",
        key: "phone_number",
        render: (text) => <>{text}</>,
      },
    ];
    const nestedData = [
      record.mentor_details,
      record.faculty_details,
      record.parent_details?.father,
      record.parent_details?.mother,
    ];

    return (
      <div>
        <Table
          className="my-5 ml-5 mr-5"
          columns={nestedCols}
          dataSource={nestedData.filter((element) => element != null)}
          pagination={false}
          bordered
        ></Table>
      </div>
    );
  }

  return (
    <>
      <div className="text-xl font-bold mb-5">
        Upcoming Student Subscriptions
      </div>

      <Table
        rowKey={(record) => record.id}
        columns={cols}
        dataSource={studentsData.map((student) => {
          return {
            ...student,
            subscription_end_date: student.course_details.subscription_end_date,
            subscription_type: student.course_details.subscription_type,
            name: student.name,
            course: student.course_details.course_name,
            // parent_name: {
            //   first_name: student.parent_first_name,
            //   last_name: student.parent_last_name,
            // },
          };
        })}
        loading={loading}
        pagination={{
          position: "topRight",
          showTitle: true,
          showSizeChanger: false,
          onShowSizeChange: false,
          pageSize: 15,
          onChange: (page) => setCurrent(page),
          total: total,
        }}
        expandable={{
          fixed: "left",
          showExpandColumn: true,
          expandRowByClick: false,
          expandedRowRender: expandedRowRenderFunc,
        }}
        scroll={{ x: "max-content", y: "max-content" }} // Enable horizontal scrolling
        footer={() => (
          <div className="flex justify-end mr-5">
            Page {current} of {totalPages} (Total: {total} records)
          </div>
        )}
      />
    </>
  );
}

export default page;
