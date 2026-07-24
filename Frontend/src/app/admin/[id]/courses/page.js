"use client";

import { deleteCourse, searchCourses } from "@/app/services/authService";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import { Button, Modal, Space, Table, Tag, Input, notification } from "antd";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import edit from "../../../../../public/icons/edit.svg";
import deleteIcon from "../../../../../public/icons/trash.svg";
import {
  SearchOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import debounce from "lodash/debounce";


function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const [coursesData, setCoursesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const showDeleteModal = (course) => {
    Modal.confirm({
      title: "Delete Course",
      icon: <ExclamationCircleFilled />,
      content: (
        <div>
          <p>
            Are you sure you want to delete <strong>{course.name}</strong>?
          </p>
          <p className="text-gray-500 text-xs mt-2">
            This action cannot be undone. Deleting this Course will delete its respective questions.
          </p>
        </div>
      ),
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        return deleteCourse(course.id)
          .then(() => {
            setUpdated(!updated);
            notification.success({
              message: "Success",
              description: `"${course.name}" deleted successfully`,
              placement: "topRight",
            });
          })
          .catch((err) => {
            console.error(err);
            notification.error({
              message: "Error",
              description: "Failed to delete course",
            });
          });
      },
    });
  };

  const cols = [
    {
      key: "name",
      title: (
        <div className="flex items-center">
          <span>Course name</span>
        </div>
      ),
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <span className="font-medium">{text}</span>,
      width: "40%",
    },
    {
      key: "subjects",
      title: "Subjects",
      dataIndex: "subjects",
      render: (_, record) => {
        const { subjects } = record;
        let colors = ["volcano", "geekblue", "purple", "orange", "green"];
        return (
          <div className="flex flex-wrap gap-1">
            {subjects.map(({ name }, index) => (
              <Tag
                key={index}
                color={colors[index % colors.length]}
                bordered={false}
              >
                {name}
              </Tag>
            ))}
          </div>
        );
      },
      width: "40%",
    },
    {
      key: "Action",
      title: "Actions",
      align: "center",
      width: "20%",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<Image src={edit} alt="edit" width={18} height={18} />}
            onClick={() => router.push(`${pathname}/${record.id}`)}
          />
          <Button
            type="text"
            danger
            icon={<Image src={deleteIcon} alt="delete" width={18} height={18} />}
            onClick={() => showDeleteModal(record)}
          />
        </Space>
      ),
    },
  ];

  useEffect(() => {
    setLoading(true);
    getCoursesInsideAuth()
      .then((res) => {
        const sortedData = res.data.sort((a, b) => a.name.localeCompare(b.name));
        setCoursesData(sortedData);
        setFilteredCourses(sortedData);
      })
      .finally(() => setLoading(false));
  }, [updated]);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = searchTerm
          ? await searchCourses(searchTerm)
          : await getCoursesInsideAuth();
        setCoursesData(res.data);
      } finally {
        setLoading(false);
      }
    };

    const debounceFetch = debounce(fetchData, 400);
    debounceFetch();
    return () => debounceFetch.cancel();
  }, [searchTerm]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCourses(coursesData);
    } else {
      const filtered = coursesData.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [searchTerm, coursesData]);


  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
          <div className="text-xl font-bold text-gray-800">Courses List</div>
          <div className="flex gap-2 items-center">
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Search courses..."
              className="input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
            <Button
              type="primary"
              onClick={() => router.push(`${pathname}/create`)}
              className="action-button !h-9 !px-4 !text-sm !font-medium"
            >
              Create Course
            </Button>
          </div>
        </div>

        <div className="p-0">
          <Table
            dataSource={filteredCourses}
            columns={cols}
            loading={loading}
            size="small"
            className="[&_.ant-table-tbody>tr>td]:!py-2 [&_.ant-table-thead>tr>th]:!py-1.5"
            rowKey="id"
            rowClassName={(record, index) =>
              `text-sm ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-orange-50/50 transition-colors cursor-pointer`
            }
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              className: "p-2",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Page;
