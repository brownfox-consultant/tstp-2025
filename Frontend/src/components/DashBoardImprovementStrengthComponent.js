import React, { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, Progress, Spin } from "antd";
import { usePathname } from "next/navigation";
import { BASE_URL } from "@/app/constants/apiConstants";
import Select, { components } from "react-select";
import { ChevronIcon } from "@/components/icons/dashboard-icons";
import { NoDataIcon } from "@/components/icons/improvement-strength-icons";

/* -----------------------------
   Custom Dropdown Indicator
-------------------------------- */
const CustomDropdownIndicator = (props) => (
  <components.DropdownIndicator {...props}>
    <ChevronIcon
      className="w-4 h-4"
      isOpen={props.selectProps.menuIsOpen}
      color="#805830"
    />
  </components.DropdownIndicator>
);

const customSelectComponents = {
  DropdownIndicator: CustomDropdownIndicator,
};

/* -----------------------------
   Test Type Options
-------------------------------- */
const TEST_TYPE_OPTIONS = [
  { value: "EXAM", label: "Full Length Test" },
  { value: "PRACTICE", label: "Practice Test" },
];

const DashBoardImprovementStrengthComponent = ({ date }) => {
  const pathname = usePathname();
  const studentId = pathname?.split("/")?.[2];

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // ✅ NEW: Test Type State (default = Full Length)
  const [testType, setTestType] = useState(TEST_TYPE_OPTIONS[0]);

  const [strengths, setStrengths] = useState([]);
  const [improvements, setImprovements] = useState([]);
  const [loading, setLoading] = useState(false);

  /* -----------------------------
     Fetch Courses
-------------------------------- */
  useEffect(() => {
    if (!studentId) return;

    axios
      .get(
        `${BASE_URL}/api/course/student-courses/?user_id=${studentId}`,
        { withCredentials: true }
      )
      .then((res) => {
        setCourses(res.data);
        if (res.data.length > 0) {
          setSelectedCourse(res.data[0].id);
        }
      })
      .catch((err) =>
        console.error("Error loading student courses", err)
      );
  }, [studentId]);

  /* -----------------------------
     Fetch Strengths / Improvements
-------------------------------- */
  useEffect(() => {
    if (!selectedCourse || !studentId || !testType) return;

    setLoading(true);

    axios
      .get(
        `${BASE_URL}/api/test/key-strengths/`,
        {
          params: {
            course_id: selectedCourse,
            student_id: studentId,
            date_range: date,
            test_type: testType.value, // ✅ NEW PARAM
          },
          withCredentials: true,
        }
      )
      .then(({ data }) => {
        setStrengths(data.topics?.Math || []);
        setImprovements(data.topics?.English || []);
      })
      .catch((err) => {
        console.error("Failed to fetch data", err);
        setStrengths([]);
        setImprovements([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedCourse, studentId, date, testType]);

  return (
    <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Topic-wise Performance
        </h3>

        <div className="flex gap-3 w-full sm:w-auto">
          {/* Course Dropdown */}
          <div className="w-full sm:w-52">
            <Select
              components={customSelectComponents}
              value={courses.find((c) => c.id === selectedCourse)}
              onChange={(option) => setSelectedCourse(option.id)}
              options={courses}
              getOptionLabel={(e) => e.name}
              getOptionValue={(e) => e.id.toString()}
              isSearchable
              placeholder="Select Course"
            />
          </div>

          {/* ✅ Test Type Dropdown */}
          <div className="w-full sm:w-52">
            <Select
              components={customSelectComponents}
              value={testType}
              onChange={setTestType}
              options={TEST_TYPE_OPTIONS}
              isSearchable={false}
              placeholder="Select Test Type"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {/* English */}
          <Col xs={24} md={12}>
            <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border border-blue-100 rounded-md p-3">
              <h4 className="text-lg font-semibold text-blue-600 mb-2">
                English
              </h4>

              {improvements.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <NoDataIcon />
                  <p className="text-sm">No data available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {improvements.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {item.topic}
                        </span>
                        <span className="text-sm font-semibold">
                          {item.score}%
                        </span>
                      </div>
                      <Progress
                        percent={item.score}
                        showInfo={false}
                        strokeWidth={8}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>

          {/* Math */}
          <Col xs={24} md={12}>
            <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 border border-orange-100 rounded-md p-3">
              <h4 className="text-lg font-semibold text-orange-500 mb-2">
                Math
              </h4>

              {strengths.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <NoDataIcon />
                  <p className="text-sm">No data available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {strengths.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {item.topic}
                        </span>
                        <span className="text-sm font-semibold">
                          {item.score}%
                        </span>
                      </div>
                      <Progress
                        percent={item.score}
                        showInfo={false}
                        strokeWidth={8}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default DashBoardImprovementStrengthComponent;
