import { deleteMaterial, getMaterialsList } from "@/app/services/authService";
import { DeleteTwoTone, EyeTwoTone } from "@ant-design/icons";
import { Button, Dropdown, Popconfirm, Segmented, Table, Tag } from "antd";
import dayjs from "dayjs";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import UploadTutorialModal from "./UploadTutorialModal";
import { getMaterialDetails } from "@/app/services/authService";

function MaterialsList({ course, subjectsData }) {
  const router = useRouter();
  const pathname = usePathname();
  const role = pathname.split("/")[1];
  const [courseSubId, setCourseSubId] = useState(0);
  const [updated, setUpdated] = useState(false);
  const [materialsData, setMaterialsData] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [current, setCurrent] = useState(1);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [uploadTutotialPopUp, setUploadTutorialPopUp] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [subject, setSubject] = useState();
  const [editingMaterial, setEditingMaterial] = useState(null); // new


  useEffect(() => {
    if (subjectsData[0]) {
      setCourseSubId(subjectsData[0].course_subject_id);
    }
  }, [subjectsData]);

  const deleteConfirm = (id) => {
    setConfirmLoading(true);
    deleteMaterial(id)
      .then((res) => {
        setUpdated(!updated);
      })
      .catch((err) => console.log("err", err))
      .finally(() => setConfirmLoading(false));
  };
  
  const adminCols = [
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      
    },
    {
      key: "material_type",
      dataIndex: "material_type",
      title: "Tutorial Type",
      align: "center",
      width: 120,
      sorter: (a, b) => a.material_type.localeCompare(b.material_type),
      render: (text) => <p className="capitalize">{text.toString().toLowerCase()}</p>,
    },
    {
      key: "topic",
      dataIndex: "topic",
      title: "Topic",
      align: "center",
      sorter: (a, b) => (a.topic || "").localeCompare(b.topic || ""),
    },
    {
      title: "Sub Topic",
      dataIndex: "sub_topic",
      key: "sub_topic",
      align: "center",
      sorter: (a, b) => (a.sub_topic || "").localeCompare(b.sub_topic || ""),
      render: (text) => <div>{text ? text : "-"}</div>,
    },
    {
      key: "access_type",
      dataIndex: "access_type",
      align: "center",
      title: "Access Type",
      sorter: (a, b) => a.access_type.localeCompare(b.access_type),
      render: (text) => {
        const color = text === "FREE" ? "red" : "blue";
        return (
          <Tag color={color} bordered={false}>
            {text}
          </Tag>
        );
      },
    },
    {
      key: "created_by",
      dataIndex: "created_by",
      title: "Created By",
      align: "center",
      sorter: (a, b) => a.created_by.localeCompare(b.created_by),
    },
    {
      key: "uploaded_at",
      dataIndex: "uploaded_at",
      title: "Uploaded on",
      align: "center",
      sorter: (a, b) => new Date(a.uploaded_at) - new Date(b.uploaded_at),
      render: (text) => dayjs(text).format("MMM D, YYYY"),
    },
    {
      title: "Action",
      key: "val",
      align: "center",
      width: 80,
      render: (_, record) => (
  <div onClick={(e) => e.stopPropagation()} className="flex justify-center gap-4">
    <Popconfirm
      placement="leftTop"
      title="Delete the tutorial"
      description="Are you sure to delete this material?"
      onConfirm={() => deleteConfirm(record.id)}
      okText="Yes"
      cancelText="No"
      okButtonProps={{ loading: confirmLoading }}
    >
      <DeleteTwoTone twoToneColor="#eb2f96" />
    </Popconfirm>

    <EyeTwoTone
      twoToneColor="#52c41a"
            onClick={() => {
        console.log("Edit record:", record);
        setEditingMaterial(record); // Set selected material
        setIsModalVisible(true);    // Open modal
        setSubject(record.topic);   // Optional: useful if you're using this prop
      }}
    />
  </div>
),

    },
  ];
  

  const studentCols = [
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
    },
    {
      key: "material_type",
      dataIndex: "material_type",
      title: "Tutorial Type",
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

  const colsMap = {
    admin: adminCols,
    student: studentCols,
    developer: adminCols,
  };

  const onChange = (val) => {
    setCourseSubId(val);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleCreateClick = () => {
    let subject = subjectsData.find(
      ({ course_subject_id }) => course_subject_id == courseSubId
    ).name;
    console.log("In create link");
    setSubject(subject);
    /* router.push(
      `${pathname}/create?course_subject=${courseSubId}&subject=${subject}`
    ); */
    // open popup
    setIsModalVisible(true);
    console.log("Isvisible");
  };

 useEffect(() => {
  setTableLoading(true);
  if (courseSubId) {
    getMaterialsList({ page: current, course_subject_id: courseSubId })
      .then((res) => {
        const { count, current_page, results, total_pages } = res.data;

        // ✅ Sort results alphabetically by name before setting
        const sortedResults = results.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setMaterialsData(sortedResults);
        setCurrent(current_page);
        setTotal(count);
        setTotalPages(total_pages);
      })
      .finally(() => setTableLoading(false));
  }
}, [courseSubId, updated, current]);


  return (
    <>
      <div className="flex justify-between">
        <Segmented
          className="mb-3"
          onChange={onChange}
          value={courseSubId}
          options={subjectsData.map(({ name, course_subject_id }) => {
            return { value: course_subject_id, label: name };
          })}
        />
        {["admin", "developer"].includes(role) && (
          <Button type="primary" onClick={() => handleCreateClick()}>
            Upload Tutorial
          </Button>
        )}
      </div>
      <Table
        footer={() => (
          <div className="flex justify-end mr-5">
            Page {current} of {totalPages} (Total: {total} records)
          </div>
        )}
        onRow={(record, rowIndex) => {
          return {
            className: "cursor-pointer",
            onClick: (e) => {
              e.stopPropagation();

              router.push(`${pathname}/${record.id}`);
            },
          };
        }}
        dataSource={materialsData}
        columns={colsMap[role]}
        pagination={{
          showSizeChanger: false,
          onShowSizeChange: false,
          pageSize: 15,
          onChange: (page) => setCurrent(page),
          total: total,
        }}
        loading={tableLoading}
        scroll={{ x: "max-content", y: "max-content" }}
      />
      {isModalVisible && (
  <UploadTutorialModal
    isVisible={isModalVisible}
    onClose={() => {
      setIsModalVisible(false);
      setEditingMaterial(null); // reset after close
    }}
    course_subject={courseSubId}
    subject={subject}
    material={editingMaterial} // <-- Pass it here
  />
)}

    </>
  );
}

export default MaterialsList;
