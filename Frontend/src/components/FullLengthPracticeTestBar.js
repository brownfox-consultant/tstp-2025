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

// Custom Legend Component with Heading
const CustomLegend = (props) => {
  const { payload } = props;

  return (
    <div className="flex justify-between items-center w-full mb-4">
      <h3 className="text-xl font-semibold ml-4">
        Full Length vs Practice Questions
      </h3>
      <div className="flex flex-row">
        {payload.map((entry) => (
          <div key={entry.value} className="flex items-center ml-4">
            <div
              className="w-4 h-4 rounded-md"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="ml-2">
              {entry.value === "fullLengthTest"
                ? "Full Length Test"
                : "Practice Test"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

function FullLengthPracticeTestBar({ date, start_date, end_date }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (date === "custom") {
      if (start_date !== "" && end_date !== "") {
        const params = {
          date_range: date,
          start_date,
          end_date,
        };
        getTestsPerDay(params).then((result) => {
          setChartData(result.data);
        });
      }
    } else {
      const params = {
        date_range: date,
      };
      getTestsPerDay(params).then((result) => {
        setChartData(result.data);
      });
    }
  }, [date, start_date, end_date]);

  return (
    <div>
      {chartData.length > 0 ? (
        <div className="w-[97%] h-[400px] pt-2 p-5 bg-white border border-gray-300 rounded-lg shadow-md ml-4">
          <ResponsiveContainer width="100%" height="90%" className="mt-4">
            <BarChart data={chartData} barCategoryGap="20%" barSize={50}>
              <CartesianGrid
                vertical={false}
                horizontal={true}
                stroke="#E0E0E0"
              />
              <XAxis dataKey="date" axisLine={false} />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickFormatter={(tick) => `${tick}%`}
              />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Legend
                content={<CustomLegend />}
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 20 }}
              />
              <Bar dataKey="fullLengthTest" stackId="a" fill="#FFB74D" />
              <Bar dataKey="practiceTest" stackId="a" fill="#FFE0B2" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}

export default FullLengthPracticeTestBar;

/* "use client";
import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
const data = [
  { date: "1 Jul", value: 400 },
  { date: "3 Jul", value: 600 },
  { date: "5 Jul", value: 500 },
  { date: "8 Jul", value: 700 },
  { date: "9 Jul", value: 550 },
  { date: "15 Jul", value: 800 },
  { date: "18 Jul", value: 600 },
  { date: "21 Jul", value: 650 },
  { date: "23 Jul", value: 700 },
  { date: "27 Jul", value: 750 },
  { date: "29 Jul", value: 800 },
  { date: "30 Jul", value: 850 },
];

function FullLengthPracticeTestBar() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke="#FFB74D" fill="#FFECB3" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default FullLengthPracticeTestBar;
 */
