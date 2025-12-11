"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

export default function AccuracyChart({ accuracy }) {
  return (
    <div className="data-card accuracy-card">
      <h3 className="card-title">
      
        Subject Wise Accuracy
      </h3>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={accuracy}
            margin={{
              top: 20,
              right: 30,
              left: 0,
              bottom: 10,
            }}
          >
            {/* Grid behind bars */}
            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />

            {/* X-axis */}
            <XAxis
              dataKey="subject"
              tick={{ fontSize: 12, fontWeight: 600 }}
              axisLine={{ stroke: "#333" }}
              tickLine={false}
            />

            {/* Y-axis 0–100 */}
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: "#333" }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />

            {/* Tooltip */}
            <Tooltip
              formatter={(value) => `${value}%`}
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
            />

            {/* Bars */}
            <Bar
              dataKey="value"
              radius={[10, 10, 0, 0]}
              isAnimationActive={true}
              barSize={30}
            >
              {accuracy.map((a, i) => (
                <Cell key={i} fill={a.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
