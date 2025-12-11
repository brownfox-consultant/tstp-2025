"use client";

import { getUsersByRole } from "@/app/services/authService";
import { Input, Space, Button } from "antd";
import React, { useEffect, useState, useRef } from "react";
import UserList from "./UserList";
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { usePathname } from "next/navigation";
import RaiseFeedback from "./RaiseFeedback";

function StudentsList() {
  const [dataList, setDataList] = useState([]);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState();

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const role = usePathname().split("/")[1];

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  // const handleReset = (clearFilters) => {
  //   clearFilters();
  //   setSearchText("");
  // };

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
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{
              width: 90,
            }}
          >
            Reset
          </Button> */}
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
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
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

  useEffect(() => {
    getUsersByRole({ page: current, [searchedColumn]: searchText }).then(
      (res) => {
        const { results, count, current_page, total_pages } = res.data;
        setDataList(results);
        setCurrent(current_page);
        setTotal(count);
        setTotalPages(total_pages);
      }
    );
  }, [current]);

  const facultyCols = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      // sorter: (a, b) => a.name.localeCompare(b.name),
      ...getColumnSearchProps("name"),
      render: (title) => <>{title}</>,
    },
    {
      title: "Course",
      dataIndex: "course",
      key: "course",
      render: (_, record) => {
        return <>{record.course_details[0].course.name}</>;
      },
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      align: "center",
      width: 200,
      render: (id, record, index) => {
        return (
          <>
            <RaiseFeedback student={record} />
          </>
        );
      },
    },
  ];

  const mentorCols = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      // sorter: (a, b) => a.name.localeCompare(b.name),
      ...getColumnSearchProps("name"),
      render: (title) => <>{title}</>,
    },
    {
      title: "Course",
      dataIndex: "course",
      key: "course",
      render: (_, record) => {
        return <>{record.course_details[0].course.name}</>;
      },
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      align: "center",
      width: 200,
      render: (id, record, index) => {
        return (
          <>
            <RaiseFeedback student={record} />
          </>
        );
      },
    },
  ];

  const colsMap = {
    mentor: mentorCols,
    faculty: facultyCols,
  };

  return (
    <UserList
      cols={colsMap[role]}
      current={current}
      setCurrent={setCurrent}
      totalPages={totalPages}
      total={total}
      dataList={dataList.map((user) => {
        return {
          ...user,
          name: user.name,
          parent_name: user.parent_name,
          // name: { first_name: user. , last_name: user.last_name },
          //   parent_name: {
          //     first_name: user.prarent_first_name,
          //     last_name: user.parent_last_name,
          //   },
        };
      })}
    />
  );
}

export default StudentsList;
