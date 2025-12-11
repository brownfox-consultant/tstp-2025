import {
  deleteUser,
  getUpcomingOrFreeSubStudents,
} from "@/app/services/authService";

import { DeleteTwoTone, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Popconfirm, Space, Table, Pagination } from "antd";
import dayjs from "dayjs";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import Image from "next/image";
import downArrowIcon from "../../../public/icons/down-arrow.svg";

function UpcomingTable({ tabKey, api }) {
  const [studentsData, setStudentsData] = useState([]);
  const [confirmLoading, setConfirmLoading] = useState(false);
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
  }, [updated, current, searchText]); // 👈 Add `searchText` here
  

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
            router.push(`/admin/${id}/users/all/edit/${record.id}`  );
          }}
        >
          Edit
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
        <div>
        <Input
  prefix={<SearchOutlined />}
  placeholder="Search by name, email or phone..."
  value={searchText}
  onChange={(e) => {
    setSearchText(e.target.value);
    setCurrent(1); // Optional: reset to page 1
  }}
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
