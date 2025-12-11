"use client";

import { getRegisteredStudents } from "@/app/services/authService";
import UserList from "@/components/UserList";
import { useEffect, useRef, useState } from "react";
import { Button, Input, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useMediaQuery } from "react-responsive";

function page() {
  const [studentsData, setStudentsData] = useState([]);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });

  useEffect(() => {
    setLoading(true);
    getRegisteredStudents(current)
      .then((res) => {
        const { results, count, current_page, total_pages } = res.data;
        setStudentsData(results);
        setCurrent(current_page);
        setTotal(count);
        setTotalPages(total_pages);
      })
      .finally(() => setLoading(false));
  }, [current]);

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

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

    router.push(`${pathname}/approve`);
  }

  const cols = [
    {
      title: "Course",
      dataIndex: "courses",
      width: 100,
      key: "courses",
      align: "center",
      render: (_, record) => {
        return <>{record.courses.length ? record.courses.join(", ") : "-"}</>;
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps("name"),
      render: (text) => <>{text}</>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      // render: (text) => <>{text}</>,
      ...getColumnSearchProps("email"),
    },
    {
      title: "Contact Number",
      dataIndex: "phone_number",
      key: "phone_number",
      align: "center",
      ...getColumnSearchProps("phone_number"),
    },

    {
      title: "Action",
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
      <div className="text-xl font-bold mb-5">Registered Students</div>
      <UserList
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
      />
    </>
  );
}

export default page;
