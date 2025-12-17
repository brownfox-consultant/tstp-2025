"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList
} from "recharts";
import { FaQuestionCircle, FaCheckCircle, FaClock } from "react-icons/fa";
import { BASE_URL } from "@/app/constants/apiConstants";

export default function StatusOfDoubts({
  student_id,
  course_id,
  test_type, // fullLength | practiceTest
}) {
  const [doubtsData, setDoubtsData] = useState([]);
  const [summary, setSummary] = useState({
    total_raised: 0,
    total_solved: 0,
    resolution_rate: 0,
  });
  const [avgResolutionTime, setAvgResolutionTime] = useState(0);
  const [loading, setLoading] = useState(true);

  // ==================================================
  // MAP FRONTEND → BACKEND TEST TYPE
  // ==================================================
  const backendTestType =
    test_type === "practiceTest" ? "PRACTICE" : "EXAM";

  useEffect(() => {
    if (!student_id || !course_id) return;
    fetchStatusOfDoubts();
  }, [student_id, course_id, test_type]);

  const fetchStatusOfDoubts = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/api/doubt/status-of-doubts/`,
        {
          params: {
            student_id,
            course_id,
            test_type: backendTestType,
          },
          withCredentials: true,
        }
      );

      setDoubtsData(res.data.chart || []);
      setSummary(res.data.summary || {});
      setAvgResolutionTime(res.data.average_resolution_time_hours || 0);
    } catch (err) {
      console.error("Status of doubts API error", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading status of doubts...</div>;
  }

  /* ================= TOOLTIP ================= */
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white p-4 shadow-xl rounded-lg border">
          <p className="font-bold mb-2">{label}</p>
          <p className="text-sm">Raised: <b>{payload[0]?.value}</b></p>
          <p className="text-sm">Solved: <b>{payload[1]?.value}</b></p>
        </div>
      );
    }
    return null;
  };

  const renderLabel = ({ x, y, width, value }) =>
    value ? (
      <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="700">
        {value}
      </text>
    ) : null;

  return (
    <div className="w-full py-8">

      {/* ================= CHART ================= */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-3xl font-bold text-center mb-6">
          STATUS OF DOUBTS
        </h2>

        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={doubtsData} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />

              <Bar dataKey="raised" fill="#F59403" radius={[6, 6, 0, 0]}>
                <LabelList content={renderLabel} />
                {doubtsData.map((_, i) => (
                  <Cell key={i} />
                ))}
              </Bar>

              <Bar dataKey="solved" fill="#41B6FF" radius={[6, 6, 0, 0]}>
                <LabelList content={renderLabel} />
                {doubtsData.map((_, i) => (
                  <Cell key={i} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ================= AVG TIME ================= */}
        <div className="mt-6 flex justify-between items-center bg-cyan-500 text-white rounded-xl p-4">
          <span className="font-bold">Average time to resolve the Doubts</span>
          <span className="flex items-center gap-2 text-2xl font-black">
            <FaClock /> {avgResolutionTime} Hours
          </span>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">

        <StatCard
          icon={<FaQuestionCircle />}
          value={summary.total_raised}
          label="Total Raised"
          color="orange"
        />

        <StatCard
          icon={<FaCheckCircle />}
          value={summary.total_solved}
          label="Total Solved"
          color="cyan"
        />

        <StatCard
          value={`${summary.resolution_rate}%`}
          label="Resolution Rate"
          color="green"
        />
      </div>
    </div>
  );
}

/* ================= STAT CARD ================= */
function StatCard({ icon, value, label, color }) {
  const colors = {
    orange: "border-orange-500 text-orange-500",
    cyan: "border-cyan-500 text-cyan-500",
    green: "border-green-500 text-green-500",
  };

  return (
    <div className={`bg-white rounded-xl shadow p-6 border-l-4 ${colors[color]}`}>
      <div className="flex flex-col items-center">
        {icon && <div className="text-3xl mb-2">{icon}</div>}
        <div className="text-5xl font-bold">{value}</div>
        <div className="uppercase text-sm text-gray-500 mt-1">{label}</div>
      </div>
    </div>
  );
}
