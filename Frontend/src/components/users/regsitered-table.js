import { getRegisteredStudents } from "@/app/services/authService";
import UserList from "@/components/UserList";
import { useEffect, useRef, useState } from "react";
import { Button, Input, Space, Table } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useMediaQuery } from "react-responsive";
import Image from "next/image";
import downArrowIcon from "../../../public/icons/down-arrow.svg";

function RegisteredTable({ tabKey, api }) {
  const [studentsData, setStudentsData] = useState([]);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { id } = useParams();
  const pathname = usePathname();

  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  useEffect(() => {
    setLoading(true);
    getRegisteredStudents(current,searchText)
      .then((res) => {
        const { results, count, current_page, total_pages } = res.data;
        setStudentsData(results);
        setCurrent(current_page);
        setTotal(count);
        setTotalPages(total_pages);
      })
      .finally(() => setLoading(false));
  }, [current,searchText]);

  

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
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
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

          {/* <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({
                closeDropdown: false,
              });
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button> */}
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

  function handleApproveClick(record) {
    window.sessionStorage.setItem(
      "approveStudentDetails",
      JSON.stringify(record)
    );
    window.sessionStorage.setItem("isTempUser", true);
    window.sessionStorage.setItem("requireParentDetails", true);
    window.sessionStorage.setItem("areParentDetailsCompulsory", true);
    console.log("pathname", pathname, `admin/${id}/users/approve`);

    router.push(`/admin/${id}/users/students/approve`);
  }
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
      dataIndex: "courses",
      width: 100,
      key: "courses",
      align: "center",
      render: (_, record) => {
        return <>{record.courses.length ? record.courses.join(", ") : "-"}</>;
      },
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
      align: "center",
      //...getColumnSearchProps("name"),
      render: (text) => <>{text}</>,
    },
    {
      title: (
        <div className="flex items-center justify-center">
          <span>Email</span>
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
      align: "center",
      // render: (text) => <>{text}</>,
      //...getColumnSearchProps("email"),
    },
    {
      title: (
        <div className="flex items-center justify-center">
          <span>Contact Number</span>
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
      //...getColumnSearchProps("phone_number"),
    },
    {
      title: "  ",
      key: "val",
      dataIndex: "val",
      align: "center",
      fixed: !isMobile && "right",
      render: (_, record) => {
        return (
          // <ApproveComponent data={record} is_temp_user={true} router={router} />
          <Button type="primary" onClick={() => handleApproveClick(record)}>
            Approve
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <div className="w-full flex justify-between mb-2">
        <div>
        <Input
  prefix={<SearchOutlined />}
  placeholder="Search by name, email or phone"
  value={searchText}
  onChange={(e) => {
    setSearchText(e.target.value);
    setCurrent(1); // Optional: reset to page 1 when searching
  }}
  allowClear
/>
        </div>
      </div>
      {/* <UserList
        cols={cols}
        current={current}
        setCurrent={setCurrent}
        total={total}
        totalPages={totalPages}
        tableLoading={loading}
        dataList={studentsData.map((student) => {
          return {
            ...student,
            // name: {
            //   first_name: student.first_name,
            //   last_name: student.last_name,
            // },
            course: student.course,
            parent_name: student.parent_name,
          };
        })}
      /> */}
      <Table
        rowClassName={(record, index) => {
          return index % 2 === 0 ? "bg-even-color" : "bg-odd-color";
        }}
        footer={() => (
          <div className="flex justify-end mr-5">
            Page {current} of {totalPages} (Total: {total} records)
          </div>
        )}
        columns={cols}
        dataSource={studentsData.map((student) => {
          return {
            ...student,
            course: student.course,
            parent_name: student.parent_name,
          };
        })}
        loading={loading}
        pagination={{
          showSizeChanger: false,
          onShowSizeChange: false,
          pageSize: 15,
          onChange: (page) => setCurrent(page),
          total: total,
        }}
        scroll={{ x: "max-content", y: "max-content" }} // Enable horizontal scrolling
      />
    </>
  );
}

export default RegisteredTable;
