"use client";

import React, { useState, useEffect } from "react";
import { Spin } from "antd";
import axios from "axios";
import Select, { components } from "react-select";
import { GET_Students, BASE_URL } from "@/app/constants/apiConstants";
import StudentReportDashboard from "@/components/student_report/StudentReportDashboard";
import { useParams } from "next/navigation";
import { ChevronIcon } from "@/components/icons/dashboard-icons";

// Custom Dropdown Indicator with rotating arrow
const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronIcon className="w-4 h-4" isOpen={props.selectProps.menuIsOpen} color="#805830" />
    </components.DropdownIndicator>
  );
};

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

        // 3. Filter and sort students alphabetically
        const filtered = allStudents
          .filter(s => assignedIds.map(String).includes(String(s.id)))
          .sort((a, b) => a.name.localeCompare(b.name));

        setStudents(filtered);

        // 4. Set default student (alphabetical first)
        if (filtered.length > 0 && !selectedStudentId) {
          setSelectedStudentId(filtered[0].id);
        }

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
    <div>
      <div className="text-2xl font-bold mb-4 text-black">Student Reports</div>

      <div className="mb-6 flex items-center gap-4">
        <span className="font-semibold text-gray-700">Select Student:</span>
        <Select
          className="w-[350px] text-sm"
          placeholder="Search by name or email"
          value={students.find(s => s.id === selectedStudentId)}
          onChange={(opt) => setSelectedStudentId(opt?.id)}
          options={students}
          getOptionLabel={(s) => `${s.name} ${s.email ? `(${s.email})` : ''}`}
          getOptionValue={(s) => s.id}
          isSearchable={true}
          components={{ DropdownIndicator }}
          noOptionsMessage={() => loading ? "Loading students..." : "No students found"}
          styles={{
            menu: (base) => ({ ...base, zIndex: 9999 }),
          }}
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
