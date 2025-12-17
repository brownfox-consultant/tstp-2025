"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList
} from "recharts";
import { FaQuestionCircle, FaCheckCircle, FaClock, FaChartLine } from "react-icons/fa";
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
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="text-gray-500 font-medium animate-pulse">Loading status of doubts...</div>
      </div>
    );
  }

  // const renderLabel = ({ x, y, width, value }) =>
  //   value ? (
  //     <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize="11" fontWeight="600" fill="#6B7280">
  //       {value}
  //     </text>
  //   ) : null;

  return (
    <div className="w-full py-6">
      <div className="flex flex-col xxl:flex-row gap-6">
        
        {/* ================= LEFT SIDE: GRAPH ================= */}
        <div className="flex-1 rounded-2xl shadow-sm border p-6 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-extrabold text-dark flex items-center gap-2">
              <span className="p-2 bg-gray-500 text-white rounded-lg text-lg"><FaChartLine /></span>
              Doubt Analytics
            </h2>
             {/* Custom Legend */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff9f43]"></span>
                    <span className="text-dark text-sm font-bold">Raised</span>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#00d2d3]"></span>
                    <span className="text-dark text-sm font-bold">Solved</span>
                </div>
            </div>
          </div>

          <div className="h-[380px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={doubtsData} 
                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                barGap={8}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis 
                  dataKey="month" 
                  axisLine={{ stroke: '#333' }} 
                  tickLine={false} 
                  tick={{ fill: 'black', fontSize: 12, fontWeight: 500, dy: 10 }}
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#888', fontSize: 12 }} 
                />
                <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                    itemStyle={{ color: '#000' }}
                    labelStyle={{ color: '#000', marginBottom: '0.5rem' }}
                />
                <Bar dataKey="raised" fill="#ff9f43" radius={[4, 4, 0, 0]} barSize={50}>
                  <LabelList dataKey="raised" position="top" fill="#000" fontSize={12} fontWeight={600} />
                </Bar>
                <Bar dataKey="solved" fill="#00d2d3" radius={[4, 4, 0, 0]} barSize={50}>
                  <LabelList dataKey="solved" position="top" fill="#000" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ================= RIGHT SIDE: STATS ================= */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* STAT 1: RAISED */}
          <NewStatCard
            icon={<FaQuestionCircle />}
            value={summary.total_raised}
            label="Total Raised"
            bgClass="bg-orange-50"
            textClass="text-orange-600"
            borderClass="border-orange-100"
          />

          {/* STAT 2: SOLVED */}
          <NewStatCard
            icon={<FaCheckCircle />}
            value={summary.total_solved}
            label="Total Solved"
            bgClass="bg-cyan-50"
            textClass="text-cyan-600"
            borderClass="border-cyan-100"
          />

           {/* STAT 3: RATE */}
           <NewStatCard
            value={`${summary.resolution_rate}%`}
            label="Resolution Rate"
            bgClass="bg-green-50"
            textClass="text-green-600"
            borderClass="border-green-100"
            subText="Efficiency"
          />

          {/* AVERAGE TIME */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl p-6 shadow-md relative overflow-hidden h-full">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl">
                <FaClock />
             </div>
             <p className="text-blue-100 font-medium text-sm mb-1 uppercase tracking-wide">Avg. Resolution Time</p>
             <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{avgResolutionTime}</span>
                <span className="text-lg font-bold opacity-80">Hours</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ================= MODERN STAT CARD ================= */
function NewStatCard({ icon, value, label, bgClass, textClass, borderClass, subText }) {
  return (
    <div className={`flex items-center p-5 rounded-2xl border ${bgClass} ${borderClass} transition-transform hover:scale-[1.02] duration-300`}>
       <div className={`p-3 rounded-xl bg-white shadow-sm text-2xl ${textClass}`}>
          {icon || <span className="font-bold text-lg">%</span>}
       </div>
       <div className="ml-4 flex flex-col">
          <span className={`text-2xl font-black ${textClass}`}>{value}</span>
          <span className="text-sm font-semibold text-gray-500">{label}</span>
       </div>
    </div>
  );
}
