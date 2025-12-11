"use client";

import { PieChart, Pie, Cell } from "recharts";

export default function PracticeDonut({ practice }) {
  if (!practice) return null;

  return (
    <div className="data-card practice-card">
      <h3 className="card-title">
       
        Subject Wise Practice
      </h3>

      {/* TOP SECTION: TWO DONUTS */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {practice.map((p, i) => (
          <PieChart key={i} width={140} height={140}>
            <Pie
              data={[
                { name: "value", value: p.percent },
                { name: "rest", value: 100 - p.percent },
              ]}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={60}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
            >
              <Cell fill={p.color} />
              <Cell fill="#eee" />
            </Pie>

            {/* SUBJECT SHORT NAME */}
            <text
              x={75}
              y={70}
              textAnchor="middle"
              fontSize="16"
              fontWeight="700"
              fill="#333"
            >
              {p.subject.substring(0, 2)}
            </text>

            {/* PERCENTAGE */}
            <text
              x={75}
              y={90}
              textAnchor="middle"
              fontSize="13"
              fontWeight="600"
              fill="#333"
            >
              {p.percent}%
            </text>
          </PieChart>
        ))}
      </div>

      {/* BOTTOM SECTION: LABEL INDICATOR LIST */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          paddingLeft: "140px",
        }}
      >
        {practice.map((p) => (
          <div
            key={p.subject}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              fontWeight: "600",
              color: p.color,
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: p.color,
                display: "inline-block",
              }}
            />
            <span style={{ width: "80px", color: "#333", fontWeight: "500" }}>
              {p.subject}
            </span>
            <span style={{ fontWeight: "700" }}>{p.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
