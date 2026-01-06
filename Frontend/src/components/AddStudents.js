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
  CrownOutlined
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
    free: { color: "default", label: "Free", bgClass: "bg-gray-100 text-gray-600" },
    paid: { color: "blue", label: "Paid", bgClass: "bg-blue-100 text-blue-600" },
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
        const config = subscriptionConfig[type?.toLowerCase()] || { label: type || "N/A", bgClass: "bg-gray-100 text-gray-600" };
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bgClass}`}>
            <CrownOutlined />
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
    getTestEligibleStudents(testId, searchParams)
      .then((res) => {
        const { results, count, current_page } = res.data;
        setCurrent(current_page);
        setTotal(count);
        setDataSource(results);
      })
      .finally(() => setTableLoading(false));
  }, [current, searchText, testId]);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Add Students to Test</h1>
          <p className="text-sm text-gray-500 mt-1">Select students to assign this test</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="h-11 px-6 rounded-xl border-2 border-gray-300 text-gray-700 font-medium bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 flex items-center gap-2"
          >
            <ArrowLeftOutlined />
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!hasSelected || loading}
            className={`h-11 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${hasSelected && !loading
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Adding...
              </>
            ) : (
              <>
                <UserAddOutlined />
                Add {selectedRowKeys.length > 0 ? `${selectedRowKeys.length} ` : ''}Student{selectedRowKeys.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selection Info Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
              <TeamOutlined className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Eligible Students</h3>
              <p className="text-sm text-gray-500">{total} students available for selection</p>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setCurrent(1); // Reset to page 1 on search
                }}
                className="w-full h-11 pl-10 pr-10 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all duration-300 text-gray-700 placeholder-gray-400"
              />
              {globalSearch && (
                <button
                  onClick={() => {
                    setGlobalSearch("");
                    setCurrent(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Selection Counter */}
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all duration-300 ${hasSelected
              ? 'bg-blue-50 border-blue-200'
              : 'bg-gray-50 border-gray-200'
            }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
              <CheckCircleFilled />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Selected</p>
              <p className={`text-xl font-bold ${hasSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                {selectedRowKeys.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Table
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
