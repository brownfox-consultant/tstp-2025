"use client";

import React, { useState, useEffect } from "react";
import Select, { components } from "react-select";
import axios from "axios";
import { GET_Students } from "@/app/constants/apiConstants";
import StudentReportDashboard from "@/components/student_report/StudentReportDashboard";
import { ChevronIcon } from "@/components/icons/dashboard-icons";

// Custom Dropdown Indicator with rotating arrow
const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronIcon className="w-4 h-4" isOpen={props.selectProps.menuIsOpen} color="#805830" />
    </components.DropdownIndicator>
  );
};

export default function ReportPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        const res = await axios.get(GET_Students, { withCredentials: true });

        // ✅ Sort students alphabetically by name
        const sortedStudents = (res.data || []).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setStudents(sortedStudents);

        // ✅ Auto-select first student
        if (sortedStudents.length > 0) {
          setSelectedStudentId(sortedStudents[0].id);
        }
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
          className="w-80 text-sm"
          placeholder="Search by name or email"
          value={students.find((s) => s.id === selectedStudentId)}
          onChange={(opt) => setSelectedStudentId(opt?.id)}
          options={students}
          getOptionLabel={(s) => `${s.name}${s.email ? ` (${s.email})` : ""}`}
          getOptionValue={(s) => s.id}
          components={{ DropdownIndicator }}
          isLoading={loading}
          isSearchable
          styles={{
            menu: (base) => ({ ...base, zIndex: 9999 }),
            control: (base, state) => ({
              ...base,
              borderColor: state.isFocused ? "#F59403" : "#e5e7eb",
              boxShadow: state.isFocused ? "0 0 0 1px #F59403" : "none",
              "&:hover": {
                borderColor: "#F59403",
              },
              borderRadius: "0.5rem",
              padding: "2px",
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isSelected
                ? "#F59403"
                : state.isFocused
                ? "#FFF8F0"
                : "transparent",
              color: state.isSelected ? "white" : "#2E2725",
              "&:active": {
                backgroundColor: "#F59403",
                color: "white",
              },
              cursor: "pointer",
            }),
            singleValue: (base) => ({
              ...base,
              color: "#2E2725",
              fontWeight: 500,
            }),
          }}
        />
      </div>

      {selectedStudentId && (
        <StudentReportDashboard
          studentIdProp={selectedStudentId}
          studentNameProp={selectedStudent?.name}
          hideHeader={true}
        />
      )}
    </div>
  );
}
