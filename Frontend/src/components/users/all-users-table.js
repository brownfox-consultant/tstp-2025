import { getRoles, getUsersByRole } from "@/app/services/authService";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import {
  DeleteTwoTone,
  FilterFilled,
  SearchOutlined,
  UploadOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import {
  Table,
  Input,
  Space,
  Button,
  Tag,
  Popconfirm,
  Dropdown,
  Pagination,
  Tabs,
  Modal,
} from "antd";
import React, { useEffect, useState, useRef } from "react";
import EditStudentUserModal from "../EditStudentUserModal";
import EditUserModal from "../EditUserModal";
// import Image from "next/image";
// import downArrowIcon from "../../../public/icons/down-arrow.svg";
// import arrowUpCircle from "../../../public/icons/arrowupcircle.svg";
// import arrowDownCircle from "../../../public/icons/arrowdowncircle.svg";
import { useRouter, usePathname } from "next/navigation";
import { deleteUser } from "@/app/services/authService";
import axios from "axios";
import { BASE_URL } from "@/app/constants/apiConstants";
import TestList from "@/components/TestList";
import TestList_admin_user from "../TestList_admin_user";
import PracticeTestsList_admin_uer from "@/components/PracticeTestsList_admin_uer";
import { impersonateUser } from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import AssignTestModal from "../AssignTestModal";

const { confirm } = Modal;

const formatPhoneNumberDisplay = (text) => {
  if (!text) return <span className="text-gray-400">N/A</span>;
  const match = String(text).match(/^(\+\d+)(\d{10})$/);
  if (match) {
    return (
      <>
        {match[1]} {match[2]}
      </>
    );
  }
  return <>{text}</>;
};

function AllUsersTable({ tabKey, api }) {
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [current, setCurrent] = useState(null);
  const [total, setTotal] = useState(null);
  const [totalPages, setTotalPages] = useState(null);
  const [filterItems, setFilterItems] = useState([]);
  const [filterKey, setFilterKey] = useState("");
  const [courseOptions, setCourseOptions] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [updated, setUpdated] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [menuKey, setMenuKey] = useState([""]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [student_id, set_student_id] = useState(null);
  const [statusLoadingMap, setStatusLoadingMap] = useState({});
  const [studentName, setStudentName] = useState("");
  const [ordering, setOrdering] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const { setRole, setUserId, setUserName } = useGlobalContext();
  const adminEmail = localStorage.getItem("email");
  const [showAssignTestModal, setShowAssignTestModal] = useState(false);


  const searchInput = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  console.log(pathname);
  useEffect(() => {
    getRoles().then((res) => {
      //   setOptions(res.data);
      setFilterItems([
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
    const handleKeyPress = (event) => {
      if (isDropdownVisible) {
        const char = String.fromCharCode(event.which).toLowerCase();
        const matchedItem = filterItems.find((item) =>
          item.label.toLowerCase().startsWith(char),
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
  }, [isDropdownVisible, filterItems]);

  const handleLoginAsUser = (record) => {
    impersonateUser(record.id)
      .then((res) => {
        const {
          role,
          role_name,
          id,
          csrf_token,
          name,
          email,
          subscription_type,
        } = res.data;

        // Clear previous session data
        localStorage.clear();

        // Store impersonated user
        localStorage.setItem("name", name);
        localStorage.setItem("email", email);
        localStorage.setItem("id", id);
        localStorage.setItem("role_name", role_name);
        localStorage.setItem("csrfToken", csrf_token);
        localStorage.setItem("subscription_type", subscription_type);
        localStorage.setItem("impersonating", "true");

        const dashboardUrl = `/${role_name}/${id}/dashboard`;

        window.open(dashboardUrl, "_blank");

        // window.location.href = "/logout"; // OR admin logout route
      })
      .catch((err) => {
        console.error("Impersonation failed", err);
      });
  };

  const fetchUsers = async ({
    role,
    page = 1,
    search = "",
    ordering = "",
    page_size = 10,
  }) => {
    setLoading(true);
    try {
      const params = {};
      if (role) params.role = role;
      if (search) params.search = search;
      if (page) params.page = page;
      if (ordering) params.ordering = ordering;
      if (page_size) params.size = page_size;

      const response = await axios.get(`${BASE_URL}/api/user/`, {
        params,
        withCredentials: true,
      });

      const { results, count, current_page, total_pages } = response.data;
      setDataList(results);
      setTotal(count);
      setCurrent(current_page);
      setTotalPages(total_pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const FIELD_MAP = {
    role_label: "role_label",
    name: "name",
    email: "email",
    phone_number: "phone_number",
    is_active: "is_active",
    user_type: "user_type",
  };

  const handleTableChange = (pagination, filters, sorter) => {
    let order = "";
    if (sorter && sorter.field) {
      const field = FIELD_MAP[sorter.field] || sorter.field;
      order = sorter.order === "ascend" ? field : `-${field}`;
    }
    setOrdering(order);

    fetchUsers({
      role: filterKey,
      page: pagination.current,
      search: searchText,
      ordering: order,
    });
  };

  useEffect(() => {
    fetchUsers({
      role: filterKey,
      page: current,
      search: searchText,
      ordering,
      page_size: pageSize,
    });
  }, [filterKey, updated, current, searchText, ordering, pageSize]);

  const exportToCSV = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filterKey) queryParams.append("role", filterKey);
      if (searchText) queryParams.append("search", searchText);

      const exportUrl = `${BASE_URL}/api/user/export/?${queryParams.toString()}`;

      const response = await axios.get(exportUrl, {
        responseType: "blob",
        withCredentials: true,
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", "users_export.csv");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const dropDownOnClick = ({ key }) => {
    setFilterKey(key);
    console.log("key", key, filterKey);

    getUsersByRole({ role: key }).then((res) => {
      setDataList(res.data.results);
    });
    setMenuKey([key.toString()]);
  };

  // const handleSearch = (selectedKeys, confirm, dataIndex) => {
  //   confirm();
  //   setSearchText(selectedKeys[0]);
  //   setSearchedColumn(dataIndex);
  // };

  const handleStatusChange = async (id, newStatus) => {
    setStatusLoadingMap((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.patch(
        `${BASE_URL}/api/user/${id}/status/`,
        {
          is_active: newStatus,
        },
        {
          withCredentials: true,
          headers: {
            "X-CSRFToken": window.localStorage.getItem("csrfToken"),
          },
        },
      );
      setUpdated((prev) => !prev);
    } catch (err) {
      console.error("Status update failed:", err);
    } finally {
      setStatusLoadingMap((prev) => ({ ...prev, [id]: false }));
    }
  };

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
        render: (text) => formatPhoneNumberDisplay(text),
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

  /*  const getColumnSearchProps = (dataIndex) => ({
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
    // render: (text) =>
    //   searchedColumn === dataIndex ? (
    //     <Highlighter
    //       highlightStyle={{
    //         backgroundColor: "#ffc069",
    //         padding: 0,
    //       }}
    //       searchWords={[searchText]}
    //       autoEscape
    //       textToHighlight={text ? text.toString() : ""}
    //     />
    //   ) : (
    //     text
    //   ),
  }); */

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
      title: "Are you sure delete this user?",
      icon: <ExclamationCircleFilled />,
      content: (
        <div>
          <p>
            You are about to delete user: <strong>{record.name}</strong>
          </p>
          <p className="text-gray-500 text-xs mt-2">
            This action cannot be undone.
          </p>
        </div>
      ),
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk() {
        return handleDelete(record.id);
      },
      onCancel() {
        console.log("Cancel");
      },
    });
  };

  const UsersColumnsMap = {
    all: [
      {
        title: (
          <div className="flex items-center">
            <span>Role</span>
            {/* <Image
              src={downArrowIcon}
              alt="Down Arrow"
              width={18}
              height={20}
              style={{ marginLeft: "8px" }}
            /> */}
          </div>
        ),
        dataIndex: "role_label",
        sorter: (a, b) => a.role_label.localeCompare(b.role_label),
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
        width: 200,
      },
      {
        title: (
          <div className="flex items-center">
            <span>Name</span>
          </div>
        ),
        dataIndex: "name",
        sorter: (a, b) => a.name.localeCompare(b.name),
        key: "name",
        render: (title) => <>{title}</>,
        width: 140,
      },

      {
        title: (
          <div className="flex items-center">
            <span>Email address</span>
            {/* <Image
              src={downArrowIcon}
              alt="Down Arrow"
              width={18}
              height={20}
              style={{ marginLeft: "8px" }}
            /> */}
          </div>
        ),
        dataIndex: "email",
        sorter: (a, b) => a.role_label.localeCompare(b.role_label),
        key: "x",
        //...getColumnSearchProps("email"),
        render: (text) => <>{text}</>,
        width: 200,
      },
      {
        title: (
          <div className="flex items-center">
            <span>Contact No</span>
            {/* <Image
              src={downArrowIcon}
              alt="Down Arrow"
              width={18}
              height={20}
              style={{ marginLeft: "8px" }}
            /> */}
          </div>
        ),
        dataIndex: "phone_number",
        sorter: (a, b) => a.role_label.localeCompare(b.role_label),
        key: "phone_number",
        //...getColumnSearchProps("phone_number"),
        render: (text) => formatPhoneNumberDisplay(text),
        width: 150,
      },

      {
        title: (
          <div className="flex items-center">
            <span>Course</span>
            {/* <Image src={downArrowIcon} alt="Down Arrow" width={18} height={20}  style={{ marginLeft: "8px" }}/> */}
          </div>
        ),
        key: "course",
        sorter: (a, b) => {
          const aCourses =
            a.course_details?.map((c) => c.course.name).join(", ") || "";
          const bCourses =
            b.course_details?.map((c) => c.course.name).join(", ") || "";
          return aCourses.localeCompare(bCourses);
        },
        render: (_, record) => {
          const courses = record.course_details
            ?.map((c) => c.course.name)
            .join(", ");
          return <>{courses || <span className="text-gray-400">N/A</span>}</>;
        },
        width: 150,
      },

      {
        title: (
          <div className="flex items-center">
            <span>User Type</span>
          </div>
        ),
        key: "user_type",
        dataIndex: "user_type",
        width: 120,
        sorter: true,
        render: (userType, record) => {
          if (record.role_name !== "student") {
            return <Tag color="default">N/A</Tag>;
          }

          if (!userType) {
            return <Tag color="default">N/A</Tag>;
          }

          return userType === "FREE" ? (
            <Tag color="blue">FREE</Tag>
          ) : (
            <Tag color="gold">PAID</Tag>
          );
        },
      },

      {
        title: (
          <div className="flex items-center">
            <span>Status</span>
          </div>
        ),
        dataIndex: "is_active",
        sorter: (a, b) => Number(a.is_active) - Number(b.is_active),
        key: "is_active",
        align: "center",
        width: 150,
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

      // {
      //   title: "Actions",
      //   key: "val",
      //   align: "start",
      //   width: 300,
      //   render: (_, record) => {
      //     return (
      //       <div className="flex items-center gap-2">
      //         {/* Edit modals */}
      //         {record.role_name == "student" ? (
      //           <EditStudentUserModal
      //             updated={updated}
      //             setUpdated={setUpdated}
      //             recordData={record}
      //           />
      //         ) : (
      //           <EditUserModal
      //             updated={updated}
      //             setUpdated={setUpdated}
      //             recordData={record}
      //           />
      //         )}

      //         {/* View Results for students */}
      //         {record.role_name === "student" && (
      //           <Button
      //             type="default"
      //             size="small"
      //             className="text-blue-600 border-blue-600 hover:text-blue-500 hover:border-blue-500"
      //             onClick={() => {
      //               set_student_id(record.id);
      //               setStudentName(record.name);
      //               setShowResultModal(true);
      //             }}
      //           >
      //             Results
      //           </Button>
      //         )}

      //         {/* Activate / Deactivate Button */}
      //         {record.is_active ? (
      //           <Button
      //             size="small"
      //             danger
      //             loading={statusLoadingMap[record.id]}
      //             onClick={() => handleStatusChange(record.id, false)}
      //           >
      //             Deactivate
      //           </Button>
      //         ) : (
      //           <Button
      //             size="small"
      //             type="primary"
      //             className="bg-green-600 hover:bg-green-500"
      //             loading={statusLoadingMap[record.id]}
      //             onClick={() => handleStatusChange(record.id, true)}
      //           >
      //             Activate
      //           </Button>
      //         )}

      //         {/* Delete only if active */}
      //         {record.is_active && (
      //           <Button
      //             size="small"
      //             type="text"
      //             danger
      //             icon={<DeleteTwoTone twoToneColor="#eb2f96" />}
      //             onClick={() => showDeleteConfirm(record)}
      //           />
      //         )}
      //       </div>
      //     );
      //   },
      // },
      {
        title: "Actions",
        key: "val",
        align: "start",
        width: 300,
        render: (_, record) => {
          return (
            <div className="flex items-center gap-2">
              {/* ✅ LOGIN AS (ADMIN ONLY) */}
              {adminEmail === "admin@thesmarttestprep.com" && (
                <Button
                  size="small"
                  type="default"
                  onClick={() => handleLoginAsUser(record)}
                >
                  Login As
                </Button>
              )}

              {/* Existing Edit */}
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

              {/* Results */}
              {record.role_name === "student" && (
                <Button
                  type="default"
                  size="small"
                  onClick={() => {
                    set_student_id(record.id);
                    setStudentName(record.name);
                    setShowResultModal(true);
                  }}
                >
                  Results
                </Button>
              )}
              {record.role_name === "student" && (
  <Button
    size="small"
    type="default"
    onClick={() => {
      set_student_id(record.id);
      setStudentName(record.name);
      setShowAssignTestModal(true);
    }}
  >
    Assign Test
  </Button>
)}


              {/* Activate / Deactivate */}
              {record.is_active ? (
                <Button
                  size="small"
                  danger
                  loading={statusLoadingMap[record.id]}
                  onClick={() => handleStatusChange(record.id, false)}
                >
                  Deactivate
                </Button>
              ) : (
                <Button
                  size="small"
                  type="primary"
                  className="bg-green-600 hover:bg-green-500"
                  loading={statusLoadingMap[record.id]}
                  onClick={() => handleStatusChange(record.id, true)}
                >
                  Activate
                </Button>
              )}

              {/* Delete */}
              {record.is_active && (
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteTwoTone twoToneColor="#eb2f96" />}
                  onClick={() => showDeleteConfirm(record)}
                />
              )}
            </div>
          );
        },
      },
    ],
    registered: [],
    upcoming: [],
  };

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
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 mt-2">
        {/* Search Input */}
        <div className="w-full sm:w-auto sm:flex-1 sm:max-w-md">
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Search by name, email, ..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrent(1);
            }}
            allowClear
            className="h-10 rounded-lg border-gray-300 hover:border-gray-400 focus:border-gray-600"
          />
        </div>

        {/* Action Buttons */}
        {tabKey == "all" && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="large"
              onClick={() => router.push(`${pathname}/all/create/`)}
              type="primary"
              className="h-10 px-4 bg-orange-500 hover:bg-orange-600 border-none rounded-lg font-medium"
            >
              Add new user
            </Button>
            <Button
              size="large"
              icon={<UploadOutlined />}
              onClick={exportToCSV}
              className="h-10 px-4 rounded-lg border-gray-300 hover:border-gray-400 font-medium"
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
                items: filterItems,
                selectable: true,
                onClick: dropDownOnClick,
                selectedKeys: menuKey,
                defaultSelectedKeys: [""],
              }}
              placement="bottomLeft"
            >
              <Button
                icon={<FilterFilled />}
                className="h-10 px-4 rounded-lg border-gray-300 hover:border-gray-400 font-medium"
              >
                Filter
              </Button>
            </Dropdown>
          </div>
        )}
      </div>

      <Table
        footer={() => (
          <div className="footer-container">
            <div className="flex justify-end mr-5">
              Page {current} of {totalPages} (Total: {total} records)
            </div>
            <Pagination
              className="size-changer pagination-styled"
              current={current}
              pageSize={pageSize}
              total={total}
              itemRender={itemRender}
              showSizeChanger
              pageSizeOptions={["10", "20", "50", "100"]}
              onChange={(page, size) => {
                setCurrent(page);
                setPageSize(size);

                fetchUsers({
                  role: filterKey,
                  page,
                  search: searchText,
                  ordering,
                  page_size: size,
                });
              }}
              onShowSizeChange={(page, size) => {
                setCurrent(1);
                setPageSize(size);

                fetchUsers({
                  role: filterKey,
                  page: 1,
                  search: searchText,
                  ordering,
                  page_size: size,
                });
              }}
            />
          </div>
        )}
        dataSource={dataList}
        columns={UsersColumnsMap[tabKey]}
        loading={loading}
        rowKey={(record) => record.id}
        /* rowClassName={(record, index) => {
          return index % 2 === 0 ? "bg-even-color" : "bg-odd-color";
        }} */
        expandable={{
          fixed: "left",
          rowExpandable: (record) => record.role_name == "student",
          showExpandColumn: true,
          expandRowByClick: false,
          expandedRowRender: expandedRowRenderFunc,
          /* expandIcon: ({ expanded, onExpand, record }) =>
            record.role_name == "student" ? (
              <Image
                src={arrowUpCircle}
                alt="Down Arrow"
                width={18}
                height={20}
                style={{ marginLeft: "8px" }}
              />
            ) : (
              <Image
                src={arrowDownCircle}
                alt="Down Arrow"
                width={18}
                height={20}
                style={{ marginLeft: "8px" }}
              />
            ), */
        }}
        scroll={{ x: "max-content", y: 550 }}
        pagination={false}
        onChange={handleTableChange}
        rowClassName={(record, index) =>
          index % 2 === 0 ? "even-row" : "odd-row"
        }
        className="tablestyles mt-4"
      />
      {showResultModal && (
        <Modal
          open={showResultModal}
          onCancel={() => setShowResultModal(false)}
          footer={null}
          width="90%"
          style={{ top: 30 }}
          destroyOnClose
          title={`Test Report - ${studentName}`}
        >
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: "2",
                label: "Full Length Tests",
                children: <TestList_admin_user studentId={student_id} />,
              },
              {
                key: "1",
                label: "Practice Questions",
                children: (
                  <PracticeTestsList_admin_uer studentId={student_id} />
                ),
              },
            ]}
          />
        </Modal>
      )}

      {showAssignTestModal && (
  <AssignTestModal
    open={showAssignTestModal}
    onClose={() => setShowAssignTestModal(false)}
    studentId={student_id}
  />
)}

    </div>
  );
}

export default AllUsersTable;
