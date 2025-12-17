"use client";

import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { FaClock, FaQuestionCircle, FaInfoCircle } from "react-icons/fa";

export default function PatternOfUsage() {
  const [selectedDate, setSelectedDate] = useState(null);

  // Sample data - replace with actual data from props or API
  const usageData = [
    { date: "Date-1", time: 45, questions: 12, details: "Session 1: Basic practice" },
    { date: "Date-2", time: 180, questions: 60, details: "Session 2: Intensive study" },
    { date: "Date-3", time: 32, questions: 45, details: "Session 3: Quick revision" },
    { date: "Date-4", time: 60, questions: 32, details: "Session 4: Topic practice" },
    { date: "Date-5", time: 0, questions: 0, details: "No activity" },
    { date: "Date-6", time: 0, questions: 0, details: "No activity" },
    { date: "Date-7", time: 0, questions: 0, details: "No activity" },
  ];

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-2xl rounded-xl border-2 border-gray-200">
          <p className="font-bold text-gray-800 mb-2 text-lg">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FaClock className="text-blue-500" size={14} />
              <span className="text-sm text-gray-700">Time: <strong>{payload[0]?.value || 0} minutes</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <FaQuestionCircle className="text-green-500" size={14} />
              <span className="text-sm text-gray-700">Questions: <strong>{payload[1]?.value || 0}</strong></span>
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
        fill="#4b5563" 
        textAnchor="middle" 
        fontSize="12" 
        fontWeight="600"
      >
        {value}
      </text>
    );
  };

  // Handle bar click
  const handleBarClick = (data) => {
    setSelectedDate(data);
  };

  return (
    <div className="w-full py-8 bg-transparent">

      {/* Chart Container */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-8 border border-gray-200">
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-gray-700">Time (Minutes)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">Number of Questions</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="w-full h-[400px] bg-white rounded-xl p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={usageData}
                margin={{ top: 30, right: 30, left: 10, bottom: 20 }}
                barGap={5}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis 
                  dataKey="date" 
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
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                
                <Bar 
                  dataKey="time" 
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                  onClick={handleBarClick}
                  className="cursor-pointer"
                >
                  <LabelList dataKey="time" content={renderCustomLabel} />
                  {usageData.map((entry, index) => (
                    <Cell 
                      key={`cell-time-${index}`} 
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
                
                <Bar 
                  dataKey="questions" 
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                  onClick={handleBarClick}
                  className="cursor-pointer"
                >
                  <LabelList dataKey="questions" content={renderCustomLabel} />
                  {usageData.map((entry, index) => (
                    <Cell 
                      key={`cell-questions-${index}`} 
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Info Message */}
          <div className="mt-8">
            <div className="bg-gradient-to-r from-blue-400 to-cyan-500 p-4 rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(59,130,246,0.3)]">
              <p className="text-white font-semibold text-sm md:text-base">
                Click on Date to know more about the work done on that day!
              </p>
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="mt-6 animate-fadeIn">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200 shadow-lg">
                <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                  <FaInfoCircle className="text-purple-600" />
                  Details for {selectedDate.date}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Time Spent</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedDate.time} min</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Questions Solved</p>
                    <p className="text-2xl font-bold text-green-600">{selectedDate.questions}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Session Info</p>
                    <p className="text-sm font-semibold text-gray-700">{selectedDate.details}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
