import React, { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, Progress, Spin } from "antd";
import { usePathname } from "next/navigation";
import { BASE_URL } from "@/app/constants/apiConstants";
import Select from "react-select";

const DashBoardImprovementStrengthComponent = ({ date }) => {
  console.log("dateRange", date);
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
          setSelectedCourse(res.data[0].id); // Set first course by default
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

  // function for conditional color
  const getStrokeColor = (score) => (score >= 50 ? "#22c55e" : "#ef4444");

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mt-8 mx-4">
      {/* Dropdown */}
      <div className="flex justify-end flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Course
          </label>
          <Select
            className="w-64"
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
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div className="border border-gray-300 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-4">English</h3>
              {improvements.length === 0 ? (
                <p className="text-gray-400 text-center">Data not found</p>
              ) : (
                improvements.map((item, index) => (
                  <div key={index} className="mb-3">
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>{item.topic}</span>
                      <span>{item.score}%</span>
                    </div>
                    <Progress
                      percent={item.score}
                      strokeColor={getStrokeColor(item.score)}
                      showInfo={false}
                      strokeWidth={10}
                    />
                  </div>
                ))
              )}
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div className="border border-gray-300 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-4">Math</h3>
              {strengths.length === 0 ? (
                <p className="text-gray-400 text-center">Data not found</p>
              ) : (
                strengths.map((item, index) => (
                  <div key={index} className="mb-3">
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>{item.topic}</span>
                      <span>{item.score}%</span>
                    </div>
                    <Progress
                      percent={item.score}
                      strokeColor={getStrokeColor(item.score)}
                      showInfo={false}
                      strokeWidth={10}
                    />
                  </div>
                ))
              )}
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default DashBoardImprovementStrengthComponent;
