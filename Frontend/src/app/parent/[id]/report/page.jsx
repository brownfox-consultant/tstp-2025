"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "@/app/constants/apiConstants";
import StudentReportDashboard from "@/components/student_report/StudentReportDashboard";
import { useParams } from "next/navigation";
import { Spin } from "antd";

export default function ParentReportPage() {
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id: parentId } = useParams();

  useEffect(() => {
    async function fetchStudentId() {
      if (!parentId) return;
      setLoading(true);
      try {
        const { data } = await axios.get(
          `${BASE_URL}/api/test/parentid_to_studentid/?parent_id=${parentId}`,
          { withCredentials: true }
        );
        setStudentId(data.studentid?.[0] ?? null);
      } catch (error) {
        console.error("Error fetching student ID for parent:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStudentId();
  }, [parentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!studentId) {
    return (
      <div>
        <div className="text-2xl font-bold mb-4 text-black">Student Reports</div>
        <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200 text-gray-400">
          No student linked to this parent account.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-2xl font-bold mb-4 text-black">Student Reports</div>
      <StudentReportDashboard 
        studentIdProp={studentId} 
        hideHeader={true}
      />
    </div>
  );
}
