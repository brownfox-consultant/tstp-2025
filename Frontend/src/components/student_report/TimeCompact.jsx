"use client";

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

export default function TimeCompact({ timeMetrics }) {
  return (
    <div className="data-card time-compact-card">
      <h3 className="card-title">
        
        Avg. Time & Total Time
      </h3>

      <div className="compact-time-section">

        {/* ⭐ SPEEDOMETER (Avg Time / Question) */}
        <div className="compact-block">
          <h4 className="compact-title avg-title">Average Time / Question</h4>

          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              marginBottom: "20px",
            }}
          >
            {timeMetrics.map((t, i) => {
              // Convert seconds → % for gauge (0–100)
              // const percent = Math.min((t.avgSeconds / 100) * 100, 100);
              const percent = Math.min((50 / 100) * 100, 100);

              const data = [
                { name: "meter", value: percent, fill: t.borderColor },
              ];

              return (
                <div key={i} style={{ textAlign: "center" }}>
                  <ResponsiveContainer width={130} height={110}>
                    <RadialBarChart
                      cx="50%"
                      cy="100%"
                      innerRadius="100%"
                      outerRadius="100%"
                      barSize={12}
                      data={data}
                      startAngle={180}
                      endAngle={0}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                      />

                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        clockWise
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>

                  {/* VALUE IN CENTER */}
                  <div
                    style={{
                      marginTop: "-45px",
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#333",
                    }}
                  >
                    {t.avgSeconds}s
                  </div>

                  {/* SUBJECT NAME */}
                  <div style={{ fontSize: "14px", marginTop: "5px" }}>
                    {t.subject}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ⭐ TOTAL TIME (kept same as your original) */}
       {/* ⭐ TOTAL TIME (Improved UI like image) */}
<div className="compact-block">
  <h4 className="compact-title total-title" style={{ textAlign: "center" }}>
    Total Time Spent
  </h4>

  {timeMetrics.map((t) => {
    const percent = Math.min((t.totalSeconds / 600) * 100, 100);
    const minutes = Math.round(t.totalSeconds / 60);

    return (
      <div
        key={t.subject}
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "15px",
          gap: "15px",
        }}
      >
        {/* SUBJECT LABEL */}
        <span style={{ width: "80px", fontSize: "14px", fontWeight: 600 }}>
          {t.subject}
        </span>

        {/* BAR TRACK */}
        <div
          style={{
            flex: 1,
            height: "32px",
            background: "#f4f4f4",
            borderRadius: "20px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* FILLED BAR */}
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              background: t.borderColor,
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "13px",
              fontWeight: "700",
            }}
          >
            {t.totalSeconds}s / {minutes}min
          </div>
        </div>
      </div>
    );
  })}

  {/* NUMBER SCALE */}
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      fontSize: "12px",
      color: "#777",
      marginTop: "10px",
      paddingLeft: "95px",
    }}
  >
    {Array.from({ length: 11 }).map((_, i) => (
      <span key={i}>{i * 10}</span>
    ))}
  </div>
</div>


      </div>
    </div>
  );
}
