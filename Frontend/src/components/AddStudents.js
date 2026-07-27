import {
  addStudentsService,
  getTestEligibleStudents,
} from "@/app/services/authService";
import {
  ArrowLeftOutlined,
  SearchOutlined,
  UserAddOutlined,
  TeamOutlined,
  CheckCircleFilled,
  MailOutlined,
  CrownOutlined,
  GiftOutlined,
  TagOutlined
} from "@ant-design/icons";
import { Button, Modal, Input, Space, Table, Tag } from "antd";
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

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
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

  // Subscription type styling
  const subscriptionConfig = {
    free: { icon: <GiftOutlined />, color: "default", label: "Free", bgClass: "bg-gray-100 text-gray-600" },
    paid: { icon: <CrownOutlined />, color: "blue", label: "Paid", bgClass: "bg-blue-100 text-blue-600" },
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      ...getColumnSearchProps("name"),
      render: (name) => (
        <span className="font-medium text-gray-800">
          {globalSearch ? (
            <Highlighter
              highlightStyle={{ backgroundColor: "#ffc069", padding: 0, borderRadius: 2 }}
              searchWords={[globalSearch]}
              autoEscape
              textToHighlight={name || ""}
            />
          ) : name}
        </span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      ...getColumnSearchProps("email"),
      render: (email) => (
        <div className="flex items-center gap-2 text-gray-600">
          <MailOutlined className="text-gray-400" />
          {globalSearch ? (
            <Highlighter
              highlightStyle={{ backgroundColor: "#ffc069", padding: 0, borderRadius: 2 }}
              searchWords={[globalSearch]}
              autoEscape
              textToHighlight={email || ""}
            />
          ) : email}
        </div>
      ),
    },
    {
      title: "Subscription Type",
      dataIndex: "subscription_type",
      render: (type) => {
        const config = subscriptionConfig[type?.toLowerCase()] || { label: type || "N/A", bgClass: "bg-gray-100 text-gray-600", icon: <TagOutlined /> };
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bgClass}`}>
            {config.icon}
            {config.label}
          </span>
        );
      },
    },
  ];

  // Fetch data from API
  useEffect(() => {
    setTableLoading(true);
    const searchParams = { page: current || 1 };
    if (searchedColumn && searchText) {
      searchParams[searchedColumn] = searchText;
    }
    if (globalSearch) {
      if (globalSearch.includes("@")) {
        searchParams.email = globalSearch;
      } else {
        searchParams.name = globalSearch;
      }
    }
    getTestEligibleStudents(testId, searchParams)
      .then((res) => {
        const { results, count, current_page } = res.data;
        setCurrent(current_page);
        setTotal(count);
        setDataSource(results);
      })
      .finally(() => setTableLoading(false));
  }, [current, searchText, globalSearch, testId]);

  // Client-side filtering based on globalSearch
  const filteredData = React.useMemo(() => {
    if (!globalSearch || !globalSearch.trim()) {
      return dataSource;
    }
    const searchLower = globalSearch.toLowerCase().trim();
    return dataSource.filter(student =>
      (student.name && student.name.toLowerCase().includes(searchLower)) ||
      (student.email && student.email.toLowerCase().includes(searchLower))
    );
  }, [dataSource, globalSearch]);

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    preserveSelectedRowKeys: true, // Keep selected even when filtered out
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
    router.back();
  };

  return (

    <div>
      {/* Merged Header & Action Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Title & Subtitle */}
          <div className="flex items-center gap-3">
            
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-bold text-gray-800 leading-tight m-0">Add Students to Test</h1>
              <p className="text-sm text-gray-500 mt-0.5 m-0">{total} students available</p>
            </div>
          </div>

          {/* Right: Actions Group */}
          <div className="flex flex-wrap items-center justify-end gap-3 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-72 md:w-80">
              <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setCurrent(1); // Reset to page 1 on search
                }}
                className="w-full h-10 pl-9 pr-10 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all duration-300 text-sm text-gray-700 placeholder-gray-400"
              />
              {globalSearch && (
                <button
                  onClick={() => {
                    setGlobalSearch("");
                    setCurrent(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-gray-600 bg-transparent border-none outline-none"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Selected Counter */}
            <div className={`flex items-center gap-2 px-3 h-10 rounded-lg border-2 transition-all duration-300 ${hasSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
              <span className="text-xs text-gray-500 uppercase font-medium">Selected</span>
              <span className={`text-base font-bold ${hasSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                {selectedRowKeys.length}
              </span>
            </div>

            {/* Add Button */}
            <button
              onClick={handleAdd}
              disabled={!hasSelected || loading}
              className={`h-10 px-4 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${hasSelected && !loading
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg hover:shadow-blue-500/30'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span> Adding...
                </>
              ) : (
                <>
                  <UserAddOutlined /> Add
                </>
              )}
            </button>

            <button
              onClick={handleBack}
              className="px-3 h-10 flex items-center justify-center rounded-lg border gap-2 bg-transparent "
              title="Go Back"
            >
              <ArrowLeftOutlined className="text-sm" /> Back
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Table
          size="small"
          rowSelection={rowSelection}
          columns={columns}
          loading={tableLoading}
          pagination={{
            showSizeChanger: false,
            onShowSizeChange: false,
            pageSize: 15,
            onChange: (page) => setCurrent(page),
            total: globalSearch ? filteredData.length : total,
          }}
          dataSource={filteredData.map((student) => {
            return {
              name: student.name,
              key: student.id,
              ...student,
            };
          })}
        />
      </div>
    </div>

  );
}

export default AddStudents;
