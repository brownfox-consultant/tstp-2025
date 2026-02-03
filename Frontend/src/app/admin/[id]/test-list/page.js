"use client";
import React, { useState } from "react";
import { Tabs, Table, Button, Space, Select, DatePicker, Input } from "antd";
import { EyeOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;

// Dummy data generator
const generateDummyData = (type) => {
  const data = [];
  for (let i = 1; i <= 100; i++) {
    data.push({
      key: i,
      date: new Date(2025, 1, i % 28).toLocaleDateString(),
      testName: `${type} Test - Set ${Math.ceil(i / 5)}`,
      studentName: `Student ${i}`,
      studentEmail: `student${i}@example.com`,
      totalScore: Math.floor(Math.random() * (1600 - 800 + 1)) + 800,
      status: i % 3 === 0 ? "Completed" : "Pending",
    });
  }
  return data;
};

const TestListTable = ({ data }) => {
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: "Test Name",
      dataIndex: "testName",
      key: "testName",
      sorter: (a, b) => a.testName.localeCompare(b.testName),
    },
    {
      title: "Student Name",
      dataIndex: "studentName",
      key: "studentName",
      sorter: (a, b) => a.studentName.localeCompare(b.studentName),
    },
    {
      title: "Student Email ID",
      dataIndex: "studentEmail",
      key: "studentEmail",
      sorter: (a, b) => a.studentEmail.localeCompare(b.studentEmail),
    },
    {
      title: "Total Score",
      dataIndex: "totalScore",
      key: "totalScore",
      sorter: (a, b) => a.totalScore - b.totalScore,
    },
    {
      title: "View Result",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => console.log("View result for", record.key)}
          >
            View Result
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      pagination={{
        position: ["topRight", "bottomRight"],
        defaultPageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ["10", "25", "50", "100"],
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
      }}
      bordered
      className="shadow-sm rounded-lg overflow-hidden"
    />
  );
};

const TestListPage = () => {
  // Use state to hold the initial data so it persists
  const [initialFullLengthData] = useState(() => generateDummyData("Full Length"));
  const [initialPracticeData] = useState(() => generateDummyData("Practice"));

  const [filteredFullLengthData, setFilteredFullLengthData] = useState(initialFullLengthData);
  const [filteredPracticeData, setFilteredPracticeData] = useState(initialPracticeData);

  const [selectedUser, setSelectedUser] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [testNameSearch, setTestNameSearch] = useState("");
  const [studentEmailSearch, setStudentEmailSearch] = useState("");

  // Derive unique users for the dropdown
  const allUsers = [...initialFullLengthData, ...initialPracticeData].map(item => ({
    label: item.studentName,
    value: item.studentName,
  }));
  // Remove duplicates
  const uniqueUsers = Array.from(new Set(allUsers.map(a => a.value)))
    .map(value => {
      return allUsers.find(a => a.value === value);
    });


  const handleApply = () => {
    const filterData = (data) => {
      return data.filter(item => {
        let matchesUser = true;
        let matchesDate = true;
        let matchesTestName = true;
        let matchesEmail = true;

        if (selectedUser) {
          matchesUser = item.studentName === selectedUser;
        }

        if (dateRange && dateRange[0] && dateRange[1]) {
          const itemDate = new Date(item.date);
          const startDate = dateRange[0].startOf('day').toDate();
          const endDate = dateRange[1].endOf('day').toDate();
          matchesDate = itemDate >= startDate && itemDate <= endDate;
        }

        if (testNameSearch) {
          matchesTestName = item.testName.toLowerCase().includes(testNameSearch.toLowerCase());
        }

        if (studentEmailSearch) {
          matchesEmail = item.studentEmail.toLowerCase().includes(studentEmailSearch.toLowerCase());
        }

        return matchesUser && matchesDate && matchesTestName && matchesEmail;
      });
    };

    setFilteredFullLengthData(filterData(initialFullLengthData));
    setFilteredPracticeData(filterData(initialPracticeData));
  };

  const handleReset = () => {
    setSelectedUser(null);
    setDateRange(null);
    setTestNameSearch("");
    setStudentEmailSearch("");
    setFilteredFullLengthData(initialFullLengthData);
    setFilteredPracticeData(initialPracticeData);
  };

  const items = [
    {
      key: "1",
      label: "Full Length Test",
      children: <TestListTable data={filteredFullLengthData} />,
    },
    {
      key: "2",
      label: "Practice Test",
      children: <TestListTable data={filteredPracticeData} />,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Test List</h1>
      
      {/* Filter Section */}
      <div className="bg-white p-4 mb-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <Input
            placeholder="Search Test Name"
            style={{ width: 200 }}
            value={testNameSearch}
            onChange={(e) => setTestNameSearch(e.target.value)}
          />
          <Select
            placeholder="Select User"
            style={{ width: 200 }}
            allowClear
            showSearch
            className="custom-select"
            options={uniqueUsers}
            value={selectedUser}
            onChange={setSelectedUser}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
          <Input
            placeholder="Search Email ID"
            style={{ width: 200 }}
            value={studentEmailSearch}
            onChange={(e) => setStudentEmailSearch(e.target.value)}
          />
          <RangePicker 
            className="w-64"
            value={dateRange}
            onChange={setDateRange}
          />
          <Button 
            onClick={handleApply}
            style={{ 
              backgroundColor: '#f59e0b', // Amber-500 equivalent
              borderColor: '#f59e0b', 
              color: 'white' 
            }}
            className="hover:!bg-amber-600 hover:!border-amber-600"
          >
            Apply
          </Button>
          <Button onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      <Tabs 
        defaultActiveKey="1" 
        items={items} 
        size="large"
        className="bg-white !px-4 !mb-0 !rounded-xl shadow-sm border border-gray-100"
      />
    </div>
  );
};

export default TestListPage;
