"use client";

import { useState } from "react";

function levelForSeconds(sec) {
  if (sec === 0) return 0;
  if (sec < 180) return 1;
  if (sec < 600) return 2;
  return 3;
}

function secondsToLabel(sec) {
  if (sec === 0) return "";
  if (sec < 60) return `${sec}s`;
  return `${Math.round(sec / 60)}m`;
}

/* Build a full 30-day month */
function buildFullMonth(dateWise, monthIndex) {
  const base = Array.from({ length: 31 }, (_, i) => ({
    dayLabel: (i + 1).toString(),
    seconds: 0,
  }));

  dateWise
    .filter((d) => d.monthIndex === monthIndex) // 👈 match month
    .forEach((d) => {
      const index = parseInt(d.dayLabel) - 1;
      if (base[index]) base[index].seconds = d.seconds;
    });

  return base;
}


/* Month names */
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function Heatmap({ dateWise }) {

  const [monthOffset, setMonthOffset] = useState(0);

  

  const current = new Date();
  const month1Index = (current.getMonth() - monthOffset + 12) % 12;
  const month2Index = (month1Index - 1 + 12) % 12;
  const month1 = buildFullMonth(dateWise, month1Index);
const month2 = buildFullMonth(dateWise, month2Index);
  const months = [
    { title: MONTH_NAMES[month2Index], data: month2 },
    { title: MONTH_NAMES[month1Index], data: month1 },
  ];

  return (
    <div className="data-card calendar-card">
      <h3 className="card-title">📅 Last 2 Months — Time Spent</h3>

      {/* Navigation */}
      <div className="month-nav">
        <button onClick={() => setMonthOffset(monthOffset + 1)}>← Prev</button>
        <span> {MONTH_NAMES[month2Index]} & {MONTH_NAMES[month1Index]} </span>
        <button
          onClick={() => monthOffset > 0 && setMonthOffset(monthOffset - 1)}
          disabled={monthOffset === 0}
        >
          Next →
        </button>
      </div>

      <div className="two-month-wrapper">
        {months.map((month, mIndex) => (
          <div key={mIndex} className="single-month">

            <div className="month-title">{month.title}</div>

            <div className="calendar-header">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="calendar-grid">
              {month.data.map((d) => (
                <div
                  key={`${d.dayLabel}-${mIndex}`}
                  className="calendar-day-cell"
                  data-level={levelForSeconds(d.seconds)}
                >
                  <div className="day-number">{d.dayLabel}</div>
                  <div className="time-spent">{secondsToLabel(d.seconds)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        /* Overall container width */
        .calendar-card {
          width: 100%;
        }

        .month-nav {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin-bottom: 15px;
          font-weight: 600;
          color: #333;
        }

        .month-nav button {
          background: #f59403;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          color: white;
          cursor: pointer;
        }

        .month-nav button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        /* Make months take full width */
        .two-month-wrapper {
          display: flex;
          gap: 50px;
          justify-content: center;
        }

        .single-month {
          flex: 1;
        }

        .month-title {
          text-align: center;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        /* Week header */
        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          font-size: 13px;
          color: #666;
          font-weight: 600;
          margin-bottom: 8px;
          text-align: center;
        }

        /* Bigger calendar */
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 55px); /* ⬅️ FIXED WIDTH COLUMNS */
          gap: 12px;
          justify-content: center;
        }

        /* Bigger day cells */
        .calendar-day-cell {
          width: 55px;  /* ⬅️ Bigger width */
          height: 55px; /* ⬅️ Bigger height */
          border-radius: 10px;
          border: 1px solid #eee;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          transition: 0.2s;
          font-size: 12px;
        }

        .calendar-day-cell:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }

        .calendar-day-cell[data-level="0"] { background: #f4f4f4; }
        .calendar-day-cell[data-level="1"] { background: #ffe7b5; }
        .calendar-day-cell[data-level="2"] { background: #ffbe57; color: #fff; }
        .calendar-day-cell[data-level="3"] { background: #ff9500; color: #fff; }

        .day-number {
          font-size: 14px;
          font-weight: 700;
        }

        .time-spent {
          font-size: 11px;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
