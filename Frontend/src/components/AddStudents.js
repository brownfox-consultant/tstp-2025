import {
  addStudentsService,
  getTestEligibleStudents,
} from "@/app/services/authService";
import { LeftOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Modal, Input, Space, Table } from "antd";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Highlighter from "react-highlight-words";

function AddStudents({ courseFromTable = null }) {
  const { id, testId } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [current, setCurrent] = useState();
  const [total, setTotal] = useState(0);

  // if (window !== undefined) {
  //   item = window.sessionStorage.getItem(`test-${testId}`);
  // }
  // let testDetails = JSON.parse(item);

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

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      ...getColumnSearchProps("name"),
      render: (name) => <div>{name}</div>,
    },
    {
      title: "Email",
      dataIndex: "email",
      ...getColumnSearchProps("email"),
    },
    {
      title: "Subscription Type",
      dataIndex: "subscription_type",
    },
  ];

  useEffect(() => {
    setTableLoading(true);
    getTestEligibleStudents(testId, {page: current, [searchedColumn]: searchText})
      .then((res) => {
        const { results, count, current_page } = res.data;
        setCurrent(current_page);
        setTotal(count);
        setDataSource(results);
      })
      .finally(() => setTableLoading(false));
  }, [current, searchText]);

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  const hasSelected = selectedRowKeys.length > 0;

  const handleAdd = () => {
    setLoading(true);
    addStudentsService(testId, { student_ids: selectedRowKeys })
      .then((res) => {
        Modal.success({
          title: res.data.detail,
          onOk: router.push(`/admin/${id}/tests`),
        });
      })
      .catch((err) => console.log("err", err))
      .finally(() => setLoading(false));
  };

  const handleBack = () => {
    // form.resetFields();
    router.back();
  };

  return (
    <>
      <div className="text-xl font-bold mb-5 flex align-middle">
        <LeftOutlined
          className="mr-2 text-base hover:font-extrabold cursor-pointer"
          onClick={() => handleBack()}
        />{" "}
        Add Students
      </div>
      <Table
        rowSelection={rowSelection}
        columns={columns}
        loading={tableLoading}
        pagination={{
          showSizeChanger: false,
          onShowSizeChange: false,
          pageSize: 15,
          onChange: (page) => setCurrent(page),
          total: total,
        }}
        dataSource={dataSource.map((student) => {
          return {
            name: student.name,
            key: student.id,
            ...student,
          };
        })}
      />
      <div className="flex justify-center mt-2">
        <Button
          type="primary"
          onClick={handleAdd}
          disabled={!hasSelected}
          loading={loading}
        >
          Add
        </Button>
      </div>
    </>
  );
}

export default AddStudents;
