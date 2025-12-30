"use client";

import React, { useState, useEffect } from "react";
import { Select, Spin } from "antd";
import axios from "axios";
import { GET_Students } from "@/app/constants/apiConstants";
import StudentReportDashboard from "@/components/student_report/StudentReportDashboard";

export default function ReportPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        const res = await axios.get(GET_Students, { withCredentials: true });
        const studentList = res.data || [];
        setStudents(studentList);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div>
      <div className="text-2xl font-bold mb-4 text-black">Student Reports</div>

      <div className="mb-6 flex items-center gap-4">
        <span className="font-semibold text-gray-700">Select Student:</span>
        <Select
          showSearch
          placeholder="Search by name or email"
          optionFilterProp="label"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: 300 }}
          onChange={(value) => setSelectedStudentId(value)}
          options={students.map((s) => ({
            label: `${s.name} ${s.email ? `(${s.email})` : ''}`,
            value: s.id,
          }))}
          notFoundContent={loading ? <Spin size="small" /> : null}
        />
      </div>

      {selectedStudentId ? (
        <StudentReportDashboard 
          studentIdProp={selectedStudentId} 
          studentNameProp={selectedStudent?.name}
          hideHeader={true}
        />
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200 text-gray-400">
          Please select a student to view their detailed report.
        </div>
      )}
    </div>
  );
}
