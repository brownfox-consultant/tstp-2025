"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaBookOpen, FaCalculator } from "react-icons/fa";
import { BiSolidCircle } from "react-icons/bi";
import { BASE_URL } from "@/app/constants/apiConstants";

export default function UtilisationOfResources({
  student_id,
  course_id,
  test_type ,
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

  if (loading) {
    return <div className="text-center py-10">Loading utilisation...</div>;
  }

  if (!data) return null;

  /* ================= CARD ================= */

  const ChartCard = ({ title, icon: Icon, answered, unanswered, color }) => {
    const total = answered + unanswered;
    const answeredPercentage = (answered / total) * 100;
    const unansweredPercentage = (unanswered / total) * 100;

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
            <p className="text-xs text-red-600">PENDING</p>
            <p className="text-xl font-bold text-red-700">{unanswered}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto px-4">
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
