import { Tabs } from "antd";
import React from "react";

import { usePathname, useRouter } from "next/navigation";
import { 
  BookOutlined, 
  TeamOutlined, 
  AppstoreOutlined,
  ThunderboltOutlined,
  OrderedListOutlined,
  FileTextOutlined,
  ArrowLeftOutlined
} from "@ant-design/icons";

import StudentsTestTable from "./StudentsTestTable";
import TestSubjectInfo from "./TestSubjectInfo";

function TestDetails({
  testDetails,
  updated,
  setUpdated,
  testReady,
  setTestReady,
}) {
  const router = useRouter();
  const role = usePathname().split("/")[1];

  const generalTabItems = [
    {
      key: "1",
      label: (
        <span className="flex items-center gap-2">
          <BookOutlined />
          Subjects
        </span>
      ),
      children: (
        <TestSubjectInfo
          testDetails={testDetails}
          setTestReady={setTestReady}
          updated={updated}
          setUpdated={setUpdated}
        />
      ),
    },
    {
      key: "2",
      label: (
        <span className="flex items-center gap-2">
          <TeamOutlined />
          Students
        </span>
      ),
      children: (
        <StudentsTestTable testDetails={testDetails} testReady={testReady} />
      ),
    },
  ];

  const mentorTabItems = [
    {
      key: "2",
      label: (
        <span className="flex items-center gap-2">
          <TeamOutlined />
          Students
        </span>
      ),
      children: <StudentsTestTable testReady={testReady} />,
    },
  ];

  let tabItems = role == "mentor" ? mentorTabItems : generalTabItems;

  const formatType = testDetails["format_type"]?.toLowerCase();
  const isLinear = formatType === "linear";

  return (
    <div>
      {/* Custom Tab Styles */}
      <style jsx global>{`
        .test-details-tabs .ant-tabs-nav {
          margin-bottom: 0 !important;
          padding: 0 16px;
        }
        .test-details-tabs .ant-tabs-tab {
          padding: 14px 20px !important;
          font-weight: 500 !important;
          color: #6b7280 !important;
          transition: all 0.3s ease !important;
          margin: 0 !important;
        }
        .test-details-tabs .ant-tabs-tab:hover {
          color: #2563eb !important;
        }
        .test-details-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #2563eb !important;
          font-weight: 600 !important;
        }
        .test-details-tabs .ant-tabs-ink-bar {
          background: linear-gradient(to right, #2563eb, #3b82f6) !important;
          height: 3px !important;
          border-radius: 3px 3px 0 0 !important;
        }
        .test-details-tabs .ant-tabs-content-holder {
          padding: 20px;
        }
      `}</style>

      <div className="max-w-8xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3 justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              {testDetails["name"]}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage test configuration and students</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <button 
              onClick={() => router.back()}
              className="h-10 px-5 flex items-center justify-center gap-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <ArrowLeftOutlined className="text-sm" /> Back
            </button>
          </div>
        </div>

        {/* Test Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
          {/* Course Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center">
                <AppstoreOutlined className="text-blue-600 text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Course</p>
                <p className="text-base font-semibold text-gray-800">{testDetails["course_name"]}</p>
              </div>
            </div>
          </div>

          {/* Test Format Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${isLinear ? 'bg-green-100' : 'bg-purple-100'}`}>
                {isLinear 
                  ? <OrderedListOutlined className="text-green-600 text-lg" />
                  : <ThunderboltOutlined className="text-purple-600 text-lg" />
                }
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Test Format</p>
                <p className="text-base font-semibold text-gray-800 capitalize">{formatType}</p>
              </div>
            </div>
          </div>

          {/* Test Type Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-300 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-orange-100 flex items-center justify-center">
                <FileTextOutlined className="text-orange-600 text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Test Type</p>
                <p className="text-base font-semibold text-gray-800">Full Length Test</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Tabs 
            items={tabItems} 
            defaultActiveKey="1"
            className="test-details-tabs"
          />
        </div>
      </div>
    </div>
  );
}

export default TestDetails;
