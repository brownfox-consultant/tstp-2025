"use client";
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";
import { getTestsPerDay } from "@/app/services/authService";

/* =======================
   Custom Legend
======================= */
const CustomLegend = ({ payload }) => {
  return (
    <div className="flex justify-between items-center w-full mb-4 flex-wrap">
      <h3 className="text-xl font-semibold ml-4">
        Full Length vs Practice Tests
      </h3>

      <div className="flex flex-row">
        {payload?.map((entry) => (
          <div key={entry.dataKey} className="flex items-center ml-4">
            <div
              className="w-4 h-4 rounded-md"
              style={{ backgroundColor: entry.color }}
            />
            <span className="ml-2 text-sm">
              {entry.dataKey === "fullLengthTest"
                ? "Full Length Test"
                : "Practice Test"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =======================
   Custom Tooltip
======================= */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded shadow border">
        <p className="font-semibold mb-1">{label}</p>

        {payload.map((item) => (
          <p
            key={item.dataKey}
            className="text-sm"
            style={{ color: item.color }}
          >
            {item.dataKey === "fullLengthTest"
              ? "Full Length Test"
              : "Practice Test"}{" "}
            : {item.value}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

/* =======================
   Main Component
======================= */
function FullLengthPracticeTestBar({ date, start_date, end_date }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (date === "custom") {
      if (start_date && end_date) {
        getTestsPerDay({
          date_range: date,
          start_date,
          end_date,
        }).then((result) => {
          setChartData(result?.data || []);
        });
      }
    } else {
      getTestsPerDay({ date_range: date }).then((result) => {
        setChartData(result?.data || []);
      });
    }
  }, [date, start_date, end_date]);

  if (!chartData.length) return null;

  return (
    <div className="h-[400px] pt-2 p-5 bg-white rounded-lg shadow-lg">
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={chartData}
          barCategoryGap="35%"
          barGap={8}
        >
          <CartesianGrid
            vertical={false}
            stroke="#E0E0E0"
          />

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

          <Legend
            content={<CustomLegend />}
            verticalAlign="top"
            align="right"
          />

          <Bar
            dataKey="fullLengthTest"
            fill="#FB923C"
            radius={[4, 4, 0, 0]}
            barSize={24}
          />

          <Bar
            dataKey="practiceTest"
            fill="#FDE68A"
            radius={[4, 4, 0, 0]}
            barSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default FullLengthPracticeTestBar;
