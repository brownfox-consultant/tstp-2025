import React, { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, Progress, Spin } from "antd";
import { usePathname } from "next/navigation";
import { BASE_URL } from "@/app/constants/apiConstants";
import Select from "react-select";
import { EnglishIcon, MathIcon, NoDataIcon } from "@/components/icons/improvement-strength-icons";

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: '12px',
    border: state.isFocused ? '2px solid #f97316' : '1px solid #e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(249, 115, 22, 0.1)' : 'none',
    padding: '4px 8px',
    minHeight: '44px',
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: '#f97316',
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#f97316' : state.isFocused ? 'rgba(249, 115, 22, 0.1)' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    padding: '12px 16px',
    cursor: 'pointer',
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    overflow: 'hidden',
  }),
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
    axios
      .get(`${BASE_URL}/api/course/list/`, { withCredentials: true })
      .then((res) => {
        setCourses(res.data);
        if (res.data.length > 0) {
          setSelectedCourse(res.data[0].id);
        }
      })
      .catch((err) => console.error("Error loading courses", err));
  }, []);

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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header with Course Dropdown */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full"></span>
          <h3 className="text-lg font-semibold text-gray-800">
            Topic-wise Performance
          </h3>
        </div>
        <div className="w-full sm:w-52">
          <Select
            styles={customSelectStyles}
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
            <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border border-blue-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <EnglishIcon />
                </div>
                <h4 className="text-lg font-semibold text-blue-600">English</h4>
              </div>
              
              {improvements.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <NoDataIcon />
                  <p className="text-sm">No data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {improvements.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-2">
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
            <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 border border-orange-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                  <MathIcon />
                </div>
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
                      <div className="flex justify-between mb-2">
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
