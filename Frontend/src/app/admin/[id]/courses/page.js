"use client";

import { deleteCourse,searchCourses } from "@/app/services/authService";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import { Button, Modal, Space, Table, Tag, Input, notification } from "antd";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import downArrowIcon from "../../../../../public/icons/down-arrow.svg";
import edit from "../../../../../public/icons/edit.svg";
import deleteIcon from "../../../../../public/icons/trash.svg";
import {
  SearchOutlined,
  CheckCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import debounce from "lodash/debounce";


function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const [coursesData, setCoursesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  


  const showDeleteModal = (course) => {
    setSelectedCourse(course);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    if (selectedCourse) {
      setConfirmLoading(true);

      deleteCourse(selectedCourse.id)
        .then((res) => {
          setUpdated(!updated);
          openNotification();
        })
        .catch((err) => console.log("err", err))
        .finally(() => {
          setConfirmLoading(false);
          setIsModalVisible(false);
        });
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const openNotification = () => {
    notification.open({
      description: (
        <div className="custom-toast flex items-center justify-between p-2">
          <div className="flex items-center">
            <span className="custom-success-badge bg-white text-[#027947] font-semibold px-2 py-1 rounded-l-full rounded-r-full mr-2">
              Success
            </span>
            <span className="custom-message text-[#027947] text-base font-semibold">
              "{selectedCourse?.name}" deleted successfully
            </span>
          </div>
          <CloseOutlined className="text-[#027947] cursor-pointer ml-4" />
        </div>
      ),
      style: {
        backgroundColor: "#E9FAF1",
        border: "1px solid #E9FAF1",
        borderRadius: "10px",
      },
      placement: "topRight",
      duration: 3,
      closeIcon: null,
    });
  };

  const cols = [
    {
      key: "name",
      title: (
        <div className="flex items-center">
          <span>Course name</span>
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
      render: (text) => <>{text}</>,
      width: 400,
      align: "left",
    },
    {
      key: "subjects",
      title: (
        <div className="flex items-center">
          <span>Subjects</span>
          <Image
            src={downArrowIcon}
            alt="Down Arrow"
            width={18}
            height={20}
            style={{ marginLeft: "8px" }}
          />
        </div>
      ),
      dataIndex: "subjects",
      render: (_, record) => {
        const { subjects } = record;
        let subjectNames = subjects.map(({ name }) => name);
        let colors = ["volcano", "geekblue", "purple", "orange", "green"];
        return (
          <>
            {subjectNames.map((name, index) => {
              return (
                <Tag
                  key={index}
                  color={colors[index % colors.length]}
                  bordered={false}
                >
                  {name}
                </Tag>
              );
            })}
          </>
        );
      },
      align: "left",
      width: 500,
    },
    {
      key: "Action",
      title: "  ",
      align: "center",
      render: (_, record) => {
        return (
          <Space>
            <Image
              src={deleteIcon}
              alt="delete"
              width={18}
              height={20}
              style={{ marginLeft: "8px", cursor: "pointer" }}
              onClick={() => showDeleteModal(record)}
            />
            <Image
              src={edit}
              alt="edit"
              width={18}
              height={20}
              style={{ marginLeft: "8px", cursor: "pointer" }}
              onClick={() => router.push(`${pathname}/${record.id}`)}
            />
          </Space>
        );
      },
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
    <div>
      <div className="mb-3 text-xl font-bold flex justify-between">
        <div className="text-xl font-bold mb-2">Courses List</div>
      </div>
      <div className="flex justify-between items-center mb-4 mt-8">
       <Input
  prefix={<SearchOutlined />}
  placeholder="Search courses..."
  style={{ width: "280px" }}
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
        <Button
          type="primary"
          onClick={() => router.push(`${pathname}/create`)}
        >
          Create Course
        </Button>
      </div>
      <Table dataSource={filteredCourses} columns={cols} loading={loading} />

      <Modal
        title={<div className="text-2xl font-bold">Delete course</div>}
        open={isModalVisible}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
        closable={false}
        footer={null}
        className="rounded-lg"
        style={{ textAlign: "left", padding: "12px 16px" }}
        width="400px"
      >
        {/* Confirmation message left-aligned */}
        <p className="mb-8" style={{ color: "#667085", fontSize: "14px" }}>
          Are you sure you want to delete "{selectedCourse?.name}"? This action
          cannot be undone and Deleting Course will delete it's respective questions
        </p>

        <div className="flex justify-between gap-2">
          <Button
            onClick={handleCancel}
            className="w-1/2 border border-gray-300 text-gray-700"
            style={{ borderRadius: "8px", fontWeight: 600 }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleOk}
            danger
            className="w-1/2 bg-red-600 text-white"
            style={{
              borderRadius: "8px",
              backgroundColor: "#D92D20",
              color: "white",
              fontWeight: 600,
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Page;
