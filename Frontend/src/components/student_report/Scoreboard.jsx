"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, usePathname } from "next/navigation";
import { BASE_URL } from "@/app/constants/apiConstants";

export default function Scoreboard({ student_id, course_id }) {
  const [testData, setTestData] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!student_id || !course_id) return;
    fetchScoreboard();
  }, [student_id, course_id]);

  const fetchScoreboard = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/api/result/scoreboard_flt/?student_id=${student_id}&course_id=${course_id}`,
        { withCredentials: true }
      );

      const formatted = res.data.results.map((row) => ({
        name: row.label,
        date: row.test_date || "-",
        totalScore: row.total_score,
        engScore: row.english_score,
        engAcc: `${row.english_accuracy}%`,
        mathScore: row.math_score,
        mathAcc: `${row.math_accuracy}%`,
      }));

      setTestData(formatted);
    } catch (err) {
      console.error("Scoreboard API error", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= EMPTY STATE ================= */
  if (!testData || testData.length === 0) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-slate-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Scoreboard Data</h3>
          <p className="text-gray-500 max-w-md leading-relaxed">
            Your scoreboard is empty! Complete a full-length test to see your scores, accuracy, and performance comparison here.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Your test results and scores will appear here after completing tests</span>
          </div>
        </div>
      </div>
    );
  }

  const handleKnowMore = () => {
    const portal = pathname.split("/")[1];
    const id = pathname.split("/")[2];

    if (portal === "admin" || portal === "faculty" || portal === "mentor") {
      router.push(`/${portal}/${id}/tests`);
    } else if (portal === "parent") {
      router.push(`/parent/${id}/test`);
    } else if (portal === "student") {
      router.push(`/student/${id}/test/full`);
    } else {
      router.push(`/student/${student_id}/test/full`);
    }
  };

  /* ================= TABLE ================= */

  const TableOne = ({ data }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-gray-700 text-lg">
            <th className="p-2 text-left"></th>
            <th className="p-2 text-center">Test Date</th>
            <th className="p-2 text-center">Total<br />Score</th>
            <th className="p-2 text-center">English<br />Score</th>
            <th className="p-2 text-center">English<br />Accuracy</th>
            <th className="p-2 text-center">Math<br />Score</th>
            <th className="p-2 text-center">Math<br />Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-b border-gray-300 text-lg">
              <td className="py-4 px-3 font-medium">{row.name}</td>
              <td className="py-4">
                <div className="bg-[#FFE5B4] rounded py-2 text-center w-24 mx-auto">
                  {row.date}
                </div>
              </td>
              <td className="py-4">
                <div className="bg-[#1F1F1F] text-white rounded py-2 text-center w-24 mx-auto">
                  {row.totalScore}
                </div>
              </td>
              <td className="py-4">
                <div className="bg-[#F59403] text-white rounded py-2 text-center w-24 mx-auto">
                  {row.engScore}
                </div>
              </td>
              <td className="py-4">
                <div className="bg-[#F59403] text-white rounded py-2 text-center w-24 mx-auto">
                  {row.engAcc}
                </div>
              </td>
              <td className="py-4">
                <div className="bg-[#FFE5B4] rounded py-2 text-center w-24 mx-auto">
                  {row.mathScore}
                </div>
              </td>
              <td className="py-4">
                <div className="bg-[#FFE5B4] rounded py-2 text-center w-24 mx-auto">
                  {row.mathAcc}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full space-y-10">
      <TableOne data={testData} />

      <div className="flex justify-center mt-6">
        <button
          onClick={handleKnowMore}
          className="bg-[#41B6FF] hover:bg-[#339ddb] text-white font-bold py-3 px-8 rounded-full transition"
        >
          Click Here to Know More
        </button>
      </div>
    </div>
  );
}
