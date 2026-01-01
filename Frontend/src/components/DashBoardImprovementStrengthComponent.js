import React, { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, Progress, Spin } from "antd";
import { usePathname } from "next/navigation";
import { BASE_URL } from "@/app/constants/apiConstants";
import Select, { components } from "react-select";
import { ChevronIcon } from "@/components/icons/dashboard-icons";
import { EnglishIcon, MathIcon, NoDataIcon } from "@/components/icons/improvement-strength-icons";

// Custom Dropdown Indicator Component
const CustomDropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronIcon className="w-4 h-4" isOpen={props.selectProps.menuIsOpen} color="#805830" />
    </components.DropdownIndicator>
  );
};

// Custom Select Components
const customSelectComponents = {
  DropdownIndicator: CustomDropdownIndicator,
};



const DashBoardImprovementStrengthComponent = ({ date }) => {
  const pathname = usePathname();
  const studentId = pathname?.split("/")?.[2];

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [improvements, setImprovements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch courses
  useEffect(() => {
  if (!studentId) return;

  axios
    .get(
      `${BASE_URL}/api/course/student-courses/?user_id=${studentId}`,
      { withCredentials: true }
    )
    .then((res) => {
      setCourses(res.data);

      // auto select first assigned course
      if (res.data.length > 0) {
        setSelectedCourse(res.data[0].id);
      }
    })
    .catch((err) =>
      console.error("Error loading student courses", err)
    );
}, [studentId]);

  // Fetch strengths and improvements
  useEffect(() => {
    if (selectedCourse && studentId) {
      setLoading(true);
      axios
        .get(
          `${BASE_URL}/api/test/key-strengths/?course_id=${selectedCourse}&student_id=${studentId}&date_range=${date}`,
          { withCredentials: true }
        )
        .then(({ data }) => {
          const strengthsList = data.sections.find((s) => s.section === "Math")
            ?.score
            ? data.topics["Math"]
            : [];
          const improvementsList = data.sections.find(
            (s) => s.section === "English"
          )?.score
            ? data.topics["English"]
            : [];
          setStrengths(strengthsList || []);
          setImprovements(improvementsList || []);
        })
        .catch((err) => {
          console.error("Failed to fetch data", err);
          setStrengths([]);
          setImprovements([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedCourse, studentId, date]);

  return (
    <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
      {/* Header with Course Dropdown */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">
            Topic-wise Performance
          </h3>
        </div>
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
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {/* English Section */}
          <Col xs={24} md={12}>
            <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border border-blue-100 rounded-md p-3">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-lg font-semibold text-blue-600">English</h4>
              </div>
              
              {improvements.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <NoDataIcon />
                  <p className="text-sm">No data available</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {improvements.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">{item.topic}</span>
                        <span className={`text-sm font-semibold ${item.score >= 50 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {item.score}%
                        </span>
                      </div>
                      <Progress
                        percent={item.score}
                        strokeColor="#f59403"
                        trailColor="#e5e7eb"
                        showInfo={false}
                        strokeWidth={8}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>

          {/* Math Section */}
          <Col xs={24} md={12}>
            <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 border border-orange-100 rounded-md p-3">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-lg font-semibold text-orange-500">Math</h4>
              </div>
              
              {strengths.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <NoDataIcon />
                  <p className="text-sm">No data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {strengths.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">{item.topic}</span>
                        <span className="text-sm font-semibold">
                          {item.score}%
                        </span>
                      </div>
                      <Progress
                        percent={item.score}
                        strokeColor="#f59403"
                        trailColor="#"
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
