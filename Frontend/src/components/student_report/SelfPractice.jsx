"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, usePathname } from "next/navigation";   // ✅ ADD
import { BASE_URL } from "@/app/constants/apiConstants";

export default function SelfPractice({ student_id, course_id }) {
  const [scoreData, setScoreData] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();   // ✅ ADD
  const pathname = usePathname();   // ✅ ADD

  useEffect(() => {
    if (!student_id || !course_id) return;
    fetchPracticeScoreboard();
  }, [student_id, course_id]);

  const fetchPracticeScoreboard = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/api/result/practice-scoreboard/?student_id=${student_id}&course_id=${course_id}`,
        { withCredentials: true }
      );

      const formatted = res.data.results.map((row) => ({
        name: row.subject_name,
        dateTime: row.test_date || "-",
        correct: row.total_correct,
        wrong: row.total_wrong,
        skip: row.total_skip,
        time: row.total_time_seconds,
        avgTime: row.avg_time_per_question,
      }));

      setScoreData(formatted);
    } catch (err) {
      console.error("Practice scoreboard error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKnowMore = () => {
    const portal = pathname.split("/")[2];
    const id = pathname.split("/")[3];

    if (portal === "faculty" || portal === "mentor") {
      router.push(`/tstp/${portal}/${id}/practice`);
    } else if (portal === "admin") {
      router.push(`/tstp/admin/${id}/tests`);
    } else if (portal === "parent") {
      router.push(`/tstp/parent/${id}/test`);
    } else if (portal === "student") {
      router.push(`/tstp/student/${id}/test/practice`);
    } else {
      router.push(`/tstp/student/${student_id}/test/practice`);
    }
  };

  /* ================= TABLE ================= */

  const TableTwo = ({ data }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-gray-700 text-lg">
            <th className="p-2 text-left"></th>
            <th className="p-2 text-center">Test Date<br />and<br />Time</th>
            <th className="p-2 text-center">Total<br />Correct</th>
            <th className="p-2 text-center">Total<br />Wrong</th>
            <th className="p-2 text-center">Total<br />Skip</th>
            <th className="p-2 text-center">Total<br />Time</th>
            <th className="p-2 text-center">Average<br />Time Per<br />Question</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-b border-gray-300 text-lg">
              <td className="py-4 px-3 font-medium">{row.name}</td>
              <td className="py-4">
                <div className="bg-[#FFE5B4] rounded py-2 text-center w-24 mx-auto">
                  {row.dateTime}
                </div>
              </td>
              <td className="py-4">
                <div className="bg-[#1F1F1F] text-white rounded py-2 text-center w-24 mx-auto">
                  {row.correct}
                </div>
              </td>
              <td className="py-4">
                <div className="bg-[#F59403] text-white rounded py-2 text-center w-24 mx-auto">
                  {row.wrong}
                </div>
              </td>
              <td className="py-4">
                <div className="bg-[#F59403] text-white rounded py-2 text-center w-24 mx-auto">
                  {row.skip}
                </div>
              </td>
              <td className="py-4">
                <div className="bg-[#FFE5B4] rounded py-2 text-center w-24 mx-auto">
                  {row.time}
                </div>
              </td>
              <td className="py-4">
                <div className="bg-[#FFE5B4] rounded py-2 text-center w-24 mx-auto">
                  {row.avgTime}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full space-y-6">
      <TableTwo data={scoreData} />

      <div className="flex justify-center mt-10">
        <button
          onClick={handleKnowMore}   // ✅ ADD
          className="bg-[#41B6FF] hover:bg-[#339ddb] text-white font-bold py-3 px-8 rounded-full transition"
        >
          Click Here to Know More
        </button>
      </div>
    </div>
  );
}
