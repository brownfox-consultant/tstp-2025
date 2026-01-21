"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaBookOpen, FaCalculator } from "react-icons/fa";
import { BiSolidCircle } from "react-icons/bi";
import { BASE_URL } from "@/app/constants/apiConstants";

export default function UtilisationOfResources({
  student_id,
  course_id,
  test_type,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  console.log("Utilisation props:", { student_id, course_id, test_type });
  useEffect(() => {
    if (!student_id || !course_id) return;
    fetchUtilisation();
  }, [student_id, course_id, test_type]);

  const fetchUtilisation = async () => {
    try {
      setLoading(true);

      const url =
        test_type === "practiceTest"
          ? `${BASE_URL}/api/result/utilisation-practice/?student_id=${student_id}&course_id=${course_id}`
          : `${BASE_URL}/api/result/utilisation-full-length/?student_id=${student_id}&course_id=${course_id}`;

      const res = await axios.get(url, { withCredentials: true });
      setData(res.data.subjects);
    } catch (err) {
      console.error("Utilisation API error", err);
    } finally {
      setLoading(false);
    }
  };

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="py-10">
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Full-Length Test Data Available</h3>
          <p className="text-gray-500 max-w-md leading-relaxed">
            You haven't taken any Full-Length tests for this course yet. Complete your first test to see your score analysis!
          </p>
        </div>
      </div>
    );
  }

  /* ================= CARD ================= */

  const ChartCard = ({ title, icon: Icon, answered, unanswered, color }) => {
    const total = answered + unanswered;
    const answeredPercentage = total > 0 ? (answered / total) * 100 : 0;
    const unansweredPercentage = total > 0 ? (unanswered / total) * 100 : 0;

    return (
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-8 border border-gray-100 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-gray-50">
          <div className={`p-3 rounded-xl ${color === "orange"
            ? "bg-gradient-to-br from-orange-50 to-orange-100"
            : "bg-gradient-to-br from-amber-50 to-amber-100"}`}>
            <Icon className={color === "orange" ? "text-orange-600" : "text-amber-600"} size={24} />
          </div>
          <div className="flex items-center gap-2">
            <BiSolidCircle className={color === "orange" ? "text-orange-500" : "text-amber-500"} size={12} />
            <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
          </div>
        </div>

        {/* Bars */}
        <div className="space-y-6">
          {/* Answered */}
          <div>
            <div className="flex justify-between text-sm font-semibold text-gray-600 mb-1">
              <span>Answered</span>
              <span>{answeredPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-16 bg-gray-100 rounded-xl overflow-hidden">
              <div
                className={`${color === "orange"
                  ? "bg-gradient-to-r from-orange-400 to-orange-600"
                  : "bg-gradient-to-r from-amber-300 to-amber-500"} h-full flex items-center justify-center text-white font-bold`}
                style={{ width: `${Math.max(answeredPercentage, 8)}%` }}
              >
                {answered}
              </div>
            </div>
          </div>

          {/* Unanswered */}
          <div>
            <div className="flex justify-between text-sm font-semibold text-gray-600 mb-1">
              <span>Unanswered</span>
              <span>{unansweredPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-16 bg-gray-100 rounded-xl overflow-hidden">
              <div
                className={`${color === "orange"
                  ? "bg-gradient-to-r from-orange-200 to-orange-400 text-orange-800"
                  : "bg-gradient-to-r from-amber-100 to-amber-300 text-amber-800"} h-full flex items-center justify-center font-bold`}
                style={{ width: `${Math.max(unansweredPercentage, 8)}%` }}
              >
                {unanswered}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center bg-gray-100 rounded-xl p-3">
            <p className="text-xs text-gray-500">TOTAL</p>
            <p className="text-xl font-bold">{total}</p>
          </div>
          <div className="text-center bg-green-100 rounded-xl p-3">
            <p className="text-xs text-green-600">DONE</p>
            <p className="text-xl font-bold text-green-700">{answered}</p>
          </div>
          <div className="text-center bg-red-100 rounded-xl p-3">
            <p className="text-xs text-red-600">Unanswered</p>
            <p className="text-xl font-bold text-red-700">{unanswered}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
        {data.English && (
          <ChartCard
            title="English"
            icon={FaBookOpen}
            answered={data.English.answered}
            unanswered={data.English.unanswered}
            color="orange"
          />
        )}

        {data.Math && (
          <ChartCard
            title="Math"
            icon={FaCalculator}
            answered={data.Math.answered}
            unanswered={data.Math.unanswered}
            color="amber"
          />
        )}
      </div>
    </div>
  );
}
