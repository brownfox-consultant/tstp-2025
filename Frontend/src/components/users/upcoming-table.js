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

  const uniqueCourses = Array.from(new Set(studentsData.flatMap(s => s.course_details?.map(c => c.course?.name)).filter(Boolean)));
  const uniqueSubTypes = Array.from(new Set(studentsData.flatMap(s => s.course_details?.map(c => c.subscription_type)).filter(Boolean)));

  const cols = [
    {
      title: (
        <div className="flex items-center">
          <span>Course</span>
        </div>
      ),
      dataIndex: "course_details",
      key: "course",
      filters: uniqueCourses.map(name => ({ text: name, value: name })),
      onFilter: (value, record) => {
        const courses = record.course_details?.map((c) => c.course?.name) || [];
        return courses.includes(value);
      },
      render: (_, record) => {
        return (
          <span className="text-gray-500 font-medium">
            {record.course_details.length
              ? record.course_details
                  .map(({ course }) => course.name)
                  .join(", ")
              : <span className="text-gray-400 font-normal">-</span>}
          </span>
        );
      },
      width: 200,
    },
    {
      title: (
        <div className="flex items-center">
          <span>Name</span>
        </div>
      ),
      dataIndex: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      key: "name",
      render: (text, record) => (
        <span
          className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 hover:underline transition-all"
          onClick={() => router.push(`/admin/${id}/users/all/edit/${record.id}`)}
        >
          {text}
        </span>
      ),
      width: 150,
    },
    {
      title: (
        <div className="flex items-center">
          <span>Email address</span>
        </div>
      ),
      dataIndex: "email",
      sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
      key: "email",
      render: (text) => <span className="text-gray-400">{text}</span>,
      width: 150,
    },
    {
      title: (
        <div className="flex items-center">
          <span>Contact number</span>
        </div>
      ),
      dataIndex: "phone_number",
      sorter: (a, b) => (a.phone_number || "").localeCompare(b.phone_number || ""),
      key: "phone_number",
      render: (text) => <span className="text-gray-400">{text}</span>,
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
        <div className="flex items-center">
          <span>Sub. type</span>
        </div>
      ),
      key: "subscription_type",
      dataIndex: "course_details",
      width: 150,
      filters: uniqueSubTypes.map(name => ({ text: name, value: name })),
      onFilter: (value, record) => {
        const types = record.course_details?.map((c) => c.subscription_type) || [];
        return types.includes(value);
      },
      render: (courseArray, record) => {
        return <span className="text-gray-500">{courseArray[0].subscription_type}</span>;
      },
    },
    {
      title: (
        <div className="flex items-center">
          <span>Sub. end on</span>
        </div>
      ),
      key: "subscription_end_date",
      dataIndex: "course_details",
      width: 120,
      render: (courseArray, record) => {
        return <span className="text-gray-400">{courseArray[0].subscription_end_date}</span>;
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
  const paginationConfig = {
    current: current || 1,
    total: total,
    pageSize: 10,
    showSizeChanger: false,
    position: ["bottomRight"],
    showTotal: (total, range) => {
      let inputValue = "";
      const maxPages = totalPages;

      const handleGoToPage = () => {
        const page = Number(inputValue);
        if (page >= 1 && page <= maxPages) {
          setCurrent(page);
        }
      };

      return (
        <div className="flex items-center gap-2">
          <span>
            Showing {range[0]}–{range[1]} of {total}
          </span>
          <span>| Go to page:</span>
          <Input
            type="number"
            min={1}
            max={maxPages}
            size="small"
            style={{ width: 70 }}
            onChange={(e) => (inputValue = e.target.value)}
            onPressEnter={handleGoToPage}
          />
          <Button type="primary" size="small" onClick={handleGoToPage}>
            Go
          </Button>
        </div>
      );
    },
  };

  const handleTableChange = (pagination) => {
    setCurrent(pagination.current);
  };
  return (
    <>
      {" "}
      <div className="w-full flex justify-between mb-4">
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
        pagination={paginationConfig}
        onChange={handleTableChange}
        rowClassName="hover:bg-gray-100 transition-colors"
        size="small"
        className="tablestyles mt-4 [&_.ant-table-tbody>tr:not(.ant-table-measure-row)>td]:!py-1 [&_.ant-table-thead>tr>th]:!py-1.5"
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
