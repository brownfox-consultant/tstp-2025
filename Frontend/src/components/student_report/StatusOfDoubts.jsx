"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { FaQuestionCircle, FaCheckCircle, FaClock } from "react-icons/fa";

export default function StatusOfDoubts() {
  // Monthly data for doubts raised and solved
  const doubtsData = [
    { month: "Jan-25", raised: 50, solved: 10 },
    { month: "Feb-25", raised: 45, solved: 15 },
    { month: "Mar-25", raised: 15, solved: 30 },
    { month: "Apr-25", raised: 13, solved: 18 },
    { month: "May-25", raised: 85, solved: 78 },
    { month: "June-25", raised: 23, solved: 23 },
  ];

  const totalRaised = doubtsData.reduce((sum, d) => sum + d.raised, 0);
  const totalSolved = doubtsData.reduce((sum, d) => sum + d.solved, 0);
  const resolutionRate = ((totalSolved / totalRaised) * 100).toFixed(0);
  const avgResolutionTime = 24; // Sample average hours

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-2xl rounded-xl border-2 border-gray-200">
          <p className="font-bold text-gray-800 mb-2 text-lg">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm text-gray-700">Raised: <strong>{payload[0]?.value || 0}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
              <span className="text-sm text-gray-700">Solved: <strong>{payload[1]?.value || 0}</strong></span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom label to show values on top of bars
  const renderCustomLabel = (props) => {
    const { x, y, width, value } = props;
    if (value === 0) return null;
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#374151" 
        textAnchor="middle" 
        fontSize="13" 
        fontWeight="700"
      >
        {value}
      </text>
    );
  };

  return (
    <div className="w-full py-8 bg-transparent">
      
      {/* Main Chart Container */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-8 border border-gray-200">
          
          {/* Title */}
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            STATUS OF DOUBTS
          </h2>

          {/* Legend */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm font-medium text-gray-700">Raised</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
              <span className="text-sm font-medium text-gray-700">Solved</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="w-full h-[450px] bg-white rounded-xl p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={doubtsData}
                margin={{ top: 30, right: 30, left: 10, bottom: 20 }}
                barGap={5}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245, 148, 3, 0.05)' }} />
                
                <Bar 
                  dataKey="raised" 
                  fill="#F59403"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                >
                  <LabelList dataKey="raised" content={renderCustomLabel} />
                  {doubtsData.map((entry, index) => (
                    <Cell 
                      key={`cell-raised-${index}`} 
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Bar>
                
                <Bar 
                  dataKey="solved" 
                  fill="#41B6FF"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                >
                  <LabelList dataKey="solved" content={renderCustomLabel} />
                  {doubtsData.map((entry, index) => (
                    <Cell 
                      key={`cell-solved-${index}`} 
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Average Resolution Time Banner */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <div className="flex-1 bg-gradient-to-r from-cyan-400 to-cyan-500 p-4 rounded-2xl flex items-center justify-center shadow-[0_4px_15px_rgba(65,182,255,0.3)]">
              <p className="text-white font-bold text-base md:text-lg">
                Average time to resolve the Doubts
              </p>
            </div>
            <div className="bg-gradient-to-r from-cyan-400 to-cyan-500 p-4 px-8 rounded-2xl shadow-[0_4px_15px_rgba(65,182,255,0.3)] flex items-center gap-2">
              <FaClock className="text-white text-2xl" />
              <p className="text-white font-black text-2xl">
                {avgResolutionTime} Hours
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Total Raised */}
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6 border-l-4 border-orange-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-shadow">
            <div className="flex flex-col items-center">
              <FaQuestionCircle className="text-orange-500 text-3xl mb-3" />
              <div className="text-5xl font-bold text-orange-500 mb-2">
                {totalRaised}
              </div>
              <div className="text-gray-500 font-semibold uppercase text-sm tracking-wide">Total Raised</div>
            </div>
          </div>

          {/* Total Solved */}
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6 border-l-4 border-cyan-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-shadow">
            <div className="flex flex-col items-center">
              <FaCheckCircle className="text-cyan-500 text-3xl mb-3" />
              <div className="text-5xl font-bold text-cyan-500 mb-2">
                {totalSolved}
              </div>
              <div className="text-gray-500 font-semibold uppercase text-sm tracking-wide">Total Solved</div>
            </div>
          </div>

          {/* Resolution Rate */}
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6 border-l-4 border-green-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-shadow">
            <div className="flex flex-col items-center">
              <div className="bg-green-100 rounded-full p-3 mb-3">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-5xl font-bold text-green-500 mb-2">
                {resolutionRate}%
              </div>
              <div className="text-gray-500 font-semibold uppercase text-sm tracking-wide">Resolution Rate</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
