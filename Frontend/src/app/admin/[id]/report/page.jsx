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
<<<<<<< HEAD
        const studentList = res.data || [];
        setStudents(studentList);
        setSelectedStudentId(studentList[0].id);

=======

        // ✅ Sort students alphabetically by name
        const sortedStudents = (res.data || []).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setStudents(sortedStudents);

        // ✅ Auto-select first student
        if (sortedStudents.length > 0) {
          setSelectedStudentId(sortedStudents[0].id);
        }
>>>>>>> 67f4f5acdafb675d4f5ae075281f10484353a869
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, []);

  const selectedStudent = students.find(
    (s) => s.id === selectedStudentId
  );

  return (
    <div>
      <div className="text-2xl font-bold mb-4 text-black">
        Student Reports
      </div>

      <div className="mb-6 flex items-center gap-4">
        <span className="font-semibold text-gray-700">
          Select Student:
        </span>

        <Select
          showSearch
          placeholder="Search by name or email"
          optionFilterProp="label"
          filterOption={(input, option) =>
            option?.label?.toLowerCase().includes(input.toLowerCase())
          }
<<<<<<< HEAD
          style={{ width: 300 }}
          value={selectedStudentId}
          onChange={(value) => setSelectedStudentId(value)}
=======
          style={{ width: 320 }}
          value={selectedStudentId}   // ✅ controlled value
          onChange={setSelectedStudentId}
>>>>>>> 67f4f5acdafb675d4f5ae075281f10484353a869
          options={students.map((s) => ({
            label: `${s.name}${s.email ? ` (${s.email})` : ""}`,
            value: s.id,
          }))}
          notFoundContent={loading ? <Spin size="small" /> : null}
        />
      </div>

<<<<<<< HEAD
      <StudentReportDashboard
        studentIdProp={selectedStudentId}
        studentNameProp={selectedStudent?.name}
        hideHeader={true}
      />

=======
      {selectedStudentId && (
        <StudentReportDashboard
          studentIdProp={selectedStudentId}
          studentNameProp={selectedStudent?.name}
          hideHeader={true}
        />
      )}
>>>>>>> 67f4f5acdafb675d4f5ae075281f10484353a869
    </div>
  );
}
