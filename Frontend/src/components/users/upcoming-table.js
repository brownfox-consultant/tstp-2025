import {
  deleteUser,
  getUpcomingOrFreeSubStudents,
} from "@/app/services/authService";

import { DeleteTwoTone, SearchOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { Button, Input, Modal, Space, Table, Pagination } from "antd";
import dayjs from "dayjs";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import Image from "next/image";
import downArrowIcon from "../../../public/icons/down-arrow.svg";

const { confirm } = Modal;

function UpcomingTable({ tabKey, api }) {
  const [studentsData, setStudentsData] = useState([]);
  // const [confirmLoading, setConfirmLoading] = useState(false); // Removed as Modal handles loading
  const [updated, setUpdated] = useState(false);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchText, setSearchText] = useState("");

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { id } = useParams();
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
    router.push(`/admin/${id}/users/upcoming/approve`);
  }

  useEffect(() => {
    setLoading(true);
    getUpcomingOrFreeSubStudents(current, searchText)
      .then((res) => {
        const { results, count, current_page, total_pages } = res.data;
        setStudentsData(results);
        setCurrent(current_page);
        setTotal(count);
        setTotalPages(total_pages);
      })
      .finally(() => setLoading(false));
  }, [updated, current, searchText]);

  // Updated delete handler to return promise
  const handleDelete = (id) => {
    return deleteUser(id)
      .then((res) => {
        setUpdated(!updated);
        Modal.success({
          content: "User deleted successfully",
        });
      })
      .catch((err) => {
        console.log("err", err);
        Modal.error({
          title: "Error",
          content: "Failed to delete user. Please try again.",
        });
      });
  };

  const showDeleteConfirm = (record) => {
    confirm({
      title: 'Are you sure delete this user?',
      icon: <ExclamationCircleFilled />,
      content: (
        <div>
          <p>You are about to delete user: <strong>{record.name}</strong></p>
          <p className="text-gray-500 text-xs mt-2">This action cannot be undone.</p>
        </div>
      ),
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        return handleDelete(record.id);
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  };

  const cols = [
    {
      title: (
        <div className="flex items-center justify-center">
          <span>Course</span>
          <Image
            src={downArrowIcon}
            alt="Down Arrow"
            width={18}
            height={20}
            style={{ marginLeft: "8px" }}
          />
        </div>
      ),
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
      width: 200,
    },
    {
      title: (
        <div className="flex items-center justify-center">
          <span>Name</span>
          <Image
            src={downArrowIcon}
            alt="Down Arrow"
            width={18}
            height={20}
            style={{ marginLeft: "8px" }}
          />
        </div>
      ),
      dataIndex: "name",
      key: "name",
      render: (text) => <>{text}</>,
      width: 150,
      align: "center",
    },
    {
      title: (
        <div className="flex items-center justify-center">
          <span>Email address</span>
          <Image
            src={downArrowIcon}
            alt="Down Arrow"
            width={18}
            height={20}
            style={{ marginLeft: "8px" }}
          />
        </div>
      ),
      dataIndex: "email",
      key: "email",
      render: (text) => <>{text}</>,
      width: 150,
      align: "center",
    },
    {
      title: (
        <div className="flex items-center justify-center">
          <span>Contact number</span>
          <Image
            src={downArrowIcon}
            alt="Down Arrow"
            width={18}
            height={20}
            style={{ marginLeft: "8px" }}
          />
        </div>
      ),
      dataIndex: "phone_number",
      key: "phone_number",
      align: "center",
      render: (text) => <>{text}</>,
      width: 200,
    },
    // {
    //   title: "Parent Contact Number",
    //   dataIndex: "parent_phone_number",
    //   key: "parent_phone_number",
    //   render: (text) => <>{text}</>,
    // },
    {
      title: (
        <div className="flex items-center justify-center">
          <span>Sub. type</span>
          <Image
            src={downArrowIcon}
            alt="Down Arrow"
            width={18}
            height={20}
            style={{ marginLeft: "8px" }}
          />
        </div>
      ),
      key: "subscription_type",
      dataIndex: "course_details",
      width: 150,
      align: "center",
      render: (courseArray, record) => {
        return <>{courseArray[0].subscription_type}</>;
      },
    },
    {
      title: (
        <div className="flex items-center justify-center">
          <span>Sub. end on</span>
          <Image
            src={downArrowIcon}
            alt="Down Arrow"
            width={18}
            height={20}
            style={{ marginLeft: "8px" }}
          />
        </div>
      ),
      key: "subscription_end_date",
      dataIndex: "course_details",
      width: 120,
      align: "center",
      render: (courseArray, record) => {
        return <>{courseArray[0].subscription_end_date}</>;
      },
      width: 150,
    },
    {
      title: " ",
      key: "val",
      dataIndex: "val",
      align: "center",
      render: (_, record) => {
        return (
          <Space>
            <Button type="primary" onClick={() => handleApproveClick(record)}>
              Approve
            </Button>

            <Button
              onClick={() => {
                router.push(`/admin/${id}/users/all/edit/${record.id}`);
              }}
            >
              Edit
            </Button>

            <Button
              type="text"
              className="ml-1 flex items-center justify-center"
              onClick={() => showDeleteConfirm(record)}
            >
              <DeleteTwoTone twoToneColor="#eb2f96" style={{ fontSize: '16px' }} />
            </Button>
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
  const itemRender = (_, type, originalElement) => {
    if (type === "prev") {
      return <a>Previous</a>;
    }
    if (type === "next") {
      return <a>Next</a>;
    }
    return originalElement;
  };
  return (
    <>
      {" "}
      <div className="w-full flex justify-between mb-8">
        <div className="w-full sm:w-auto sm:flex-1 sm:max-w-md">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by name, email or phone..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrent(1); // Optional: reset to page 1
            }}
            className="h-10 rounded-lg border-gray-300 hover:border-gray-400 focus:border-gray-600"
            allowClear
          />
        </div>
      </div>
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
        loading={loading}
        dataSource={studentsData.map((student) => {
          return {
            ...student,
            subscription_end_date: student.course_details.subscription_end_date,
            subscription_type: student.course_details.subscription_type,
            name: student.name,
            course: student.course_details.course_name,
          };
        })}
        columns={cols}
        /* rowClassName={(record, index) => {
        return index % 2 === 0 ? "bg-even-color" : "bg-odd-color";
      }} */
        rowKey={(record) => record.id}
        pagination={false}
        rowClassName={(record, index) =>
          index % 2 === 0 ? "even-row" : "odd-row"
        }
        className="tablestyles mt-4"
        //scroll={{ x: "max-content", y: 550 }}
        /* pagination={{
          position: "topRight",
          showTitle: true,
          showSizeChanger: false,
          onShowSizeChange: false,
          pageSize: 15,
          onChange: (page) => setCurrent(page),
          total: total,
        }} */
        expandable={{
          fixed: "left",
          showExpandColumn: true,
          expandRowByClick: false,
          expandedRowRender: expandedRowRenderFunc,
        }}
        scroll={{ x: "max-content", y: "max-content" }}
      />
    </>
  );
}

export default UpcomingTable;
