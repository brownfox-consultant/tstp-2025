"use client";

import React, { useState, useEffect } from "react";
import { Select, Spin } from "antd";
import axios from "axios";
import { GET_Students, BASE_URL } from "@/app/constants/apiConstants";
import StudentReportDashboard from "@/components/student_report/StudentReportDashboard";
import { useParams } from "next/navigation";

export default function FacultyReportPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { id: facultyId } = useParams();

  useEffect(() => {
    async function fetchAssignedStudents() {
      setLoading(true);
      try {
        // 1. Fetch all students (needed for details)
        const allStudentsRes = await axios.get(GET_Students, { withCredentials: true });
        const allStudents = allStudentsRes.data || [];

        // 2. Fetch assigned student IDs for this faculty
        const assignedRes = await axios.get(
          `${BASE_URL}/api/doubt/students-by-faculty/?faculty_id=${facultyId}`,
          { withCredentials: true }
        );
        const assignedIds = assignedRes.data.student_ids || [];

        // 3. Filter students
        const filtered = allStudents.filter(s => assignedIds.includes(s.id));
        setStudents(filtered);

      } catch (error) {
        console.error("Error fetching faculty students:", error);
      } finally {
        setLoading(false);
      }
    }

    if (facultyId) {
      fetchAssignedStudents();
    }
  }, [facultyId]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="p-6">
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
