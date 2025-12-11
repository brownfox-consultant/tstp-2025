"use client";

import {
  createUser,
  deleteUser,
  getRoles,
  getUsersByRole,
} from "@/app/services/authService";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import EditStudentUserModal from "@/components/EditStudentUserModal";
import EditUserModal from "@/components/EditUserModal";

import {
  DeleteTwoTone,
  DownOutlined,
  FilterFilled,
  PlusCircleFilled,
  RightOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Input,
  Dropdown,
  Space,
  Popconfirm,
  Badge,
  Table,
  Tag,
} from "antd";
import { useForm } from "antd/es/form/Form";
import dayjs from "dayjs";
import { usePathname, useRouter } from "next/navigation";
import React, { useRef } from "react";
import { useState, useEffect } from "react";
import Highlighter from "react-highlight-words";

function UsersPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [filterKey, setFilterKey] = useState("");
  const [updated, setUpdated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [menuKey, setMenuKey] = useState([""]);

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  
  const dropDownOnClick = ({ key }) => {
    setFilterKey(key);
    getUsersByRole({ role: key }).then((res) => {
      setDataList(res.data.results);
    });
    setMenuKey([key.toString()]);
  };

  const [options, setOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [items, setItems] = useState([]);
  const [dataList, setDataList] = useState([]);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div
        style={{
          padding: 8,
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          style={{
            marginBottom: 8,
            display: "block",
          }}
        />
        <Space className="flex justify-center">
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Search
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? "#1677ff" : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: "#ffc069",
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

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
      title: "Role",
      dataIndex: "role_label",
      key: "role_label",
      render: (text) => (
        <div className=" flex gap-2 items-center">
          {" "}
          <div className="w-8 h-8 flex items-center justify-center font-bold text-lg text-primary-color bg-primary-light-color rounded-full">
            {text[0]}
          </div>
          <div className=" font-semibold">{text}</div>
        </div>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps("name"),
      render: (title) => <>{title}</>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "x",
      ...getColumnSearchProps("email"),
      render: (text) => <>{text}</>,
    },
    {
      title: "Contact Number",
      dataIndex: "phone_number",
      key: "phone_number",
      ...getColumnSearchProps("phone_number"),
      render: (text) => <>{text}</>,
    },
    {
      title: "Is Active",
      dataIndex: "is_active",
      key: "is_active",
      align: "center",
      width: 100,
      render: (text, record) => {
        return (
          <div>
            {record.is_active ? (
              <Tag bordered={false} color="green">
                Active
              </Tag>
            ) : (
              <Tag bordered={false} color="red">
                Inactive
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Action",
      key: "val",
      align: "center",
      render: (_, record) => {
        return (
          <>
            {record.role_name == "student" ? (
              <EditStudentUserModal
                updated={updated}
                setUpdated={setUpdated}
                recordData={record}
              />
            ) : (
              <EditUserModal
                updated={updated}
                setUpdated={setUpdated}
                recordData={record}
              />
            )}
            {record.is_active && (
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
            )}
          </>
        );
      },
    },
  ];

  useEffect(() => {
    getRoles().then((res) => {
      setOptions(res.data);
      setItems([
        { key: "", label: "All" },
        ...res.data
          .filter(({ name }) => name !== "admin")
          .map(({ id, name, label }) => {
            return { key: id, label };
          }),
      ]);
    });

    getCoursesInsideAuth()
      .then((res) => {
        setCourseOptions(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    getUsersByRole({
      role: filterKey,
      page: current,
      [searchedColumn]: searchText,
    })
      .then((res) => {
        const { results, count, current_page, total_pages } = res.data;
        setDataList(results);
        setCurrent(current_page);
        setTotal(count);
        setTotalPages(total_pages);
      })
      .finally(() => setLoading(false));
  }, [items, filterKey, updated, current, searchText]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (isDropdownVisible) {
        const char = String.fromCharCode(event.which).toLowerCase();
        const matchedItem = items.find((item) =>
          item.label.toLowerCase().startsWith(char)
        );
        if (matchedItem) {
          setFilterKey(matchedItem.key);
          dropDownOnClick({ key: matchedItem.key });
          // setIsDropdownVisible(false); // Optional: close the dropdown after selection
        }
      }
    };

    if (isDropdownVisible) {
      document.addEventListener("keypress", handleKeyPress);
    } else {
      document.removeEventListener("keypress", handleKeyPress);
    }

    return () => {
      document.removeEventListener("keypress", handleKeyPress);
    };
  }, [isDropdownVisible, items]);

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
      <Table
        className="my-5 mr-10"
        columns={nestedCols}
        dataSource={nestedData.filter((element) => element != null)}
        pagination={false}
        bordered
      ></Table>
    );
  }

  return (
    <>
      <div className="flex justify-between mb-3">
        <div className="text-2xl ml-3 ">Users</div>
        <div className="">
          <Button
            className="mr-3"
            size="medium"
            onClick={() => router.push(`${pathname}/create`)}
            type="primary"
            // icon={<PlusCircleFilled />}
          >
            Add new user
          </Button>
          <Button
            className="mr-3"
            size="medium"
            onClick={() => router.push(`${pathname}/create`)}
            icon={<UploadOutlined />}
          >
            Export
          </Button>
          <Dropdown
            trigger={["click"]}
            open={isDropdownVisible}
            onOpenChange={(open) => {
              setIsDropdownVisible(open);
            }}
            menu={{
              items,
              selectable: true,
              onClick: dropDownOnClick,
              selectedKeys: menuKey,
              defaultSelectedKeys: [""],
            }}
            placement="bottomLeft"
          >
            <Button icon={<FilterFilled />}></Button>
          </Dropdown>
        </div>
      </div>

      <Table
        // footer={() => (
        //   <div className="flex justify-end mr-5">
        //     Page {current} of {totalPages} (Total: {total} records)
        //   </div>
        // )}
        className=" "
        dataSource={dataList}
        columns={cols}
        loading={loading}
        rowKey={(record) => record.id}
        rowClassName={(record, index) => {
          return index % 2 === 0 ? "bg-even-color" : "bg-odd-color";
        }}
        pagination={{
          showSizeChanger: false,
          pageSize: 15,
          onChange: (page) => setCurrent(page),
          total: total,
        }}
        expandable={{
          fixed: "left",
          rowExpandable: (record) => record.role_name == "student",
          showExpandColumn: true,
          expandRowByClick: false,
          expandedRowRender: expandedRowRenderFunc,
          // expandIcon: ({ expanded, onExpand, record }) =>
          //   record.role_name == "student" ? (
          //     <RightOutlined className="cursor-pointer" />
          //   ) : (
          //     <DownOutlined className="cursor-pointer" />
          //   ),
        }}
        scroll={{ x: "max-content", y: "max-content" }}
      />
    </>
  );
}

export default UsersPage;
