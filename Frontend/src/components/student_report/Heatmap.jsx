"use client";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useState } from "react";

function levelForSeconds(sec) {
  if (sec === 0) return 0;
  if (sec < 1800) return 1;
  if (sec < 3600) return 2;
  if (sec < 7200) return 3;
  return 4;
}

function secondsToMinutes(sec) {
  if (sec === 0) return "";
  if (sec < 60) return `${sec}s`;
  return `${Math.round(sec / 60)}min`;
}

function secondsToLabel(sec) {
  if (sec === 0) return "";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}min`;
  const hours = Math.floor(sec / 3600);
  const mins = Math.round((sec % 3600) / 60);
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

function getFirstDayOffset(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  return firstDay === 0 ? 6 : firstDay - 1;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

// Level to Tailwind classes mapping
const levelClasses = {
  0: "bg-gray-200 text-gray-600",
  1: "bg-orange-100 text-gray-600",
  2: "bg-orange-300 text-gray-700",
  3: "bg-orange-400 text-white",
  4: "bg-orange-500 text-white",
};

const legendClasses = ["bg-gray-200", "bg-orange-100", "bg-orange-300", "bg-orange-400", "bg-orange-500"];

export default function Heatmap({ dateWise = [], activeTab, onTabChange }) {
  const [monthOffset, setMonthOffset] = useState(0);

  const current = new Date();
  const targetDate = new Date(current.getFullYear(), current.getMonth() - monthOffset, 1);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOffset = getFirstDayOffset(year, month);
  
  const days = [];
  let totalSeconds = 0; // Track total time for the month
  
  for (let i = 0; i < firstDayOffset; i++) {
    days.push({ isEmpty: true });
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = dateWise.find(d => 
      parseInt(d.dayLabel) === day && d.monthIndex === month
    );
    
    const seconds = dayData?.seconds || 0;
    totalSeconds += seconds;

    days.push({
      dayLabel: day.toString(),
      seconds: seconds,
      isEmpty: false
    });
  }

  const isCurrentMonth = monthOffset === 0;

  return (
    <div className="card-layout">
      {/* Optional Tabs */}
      {onTabChange && (
        <div className="flex space-x-6 border-b border-gray-100 mb-6 w-full">
          <button
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === "fullLength"
                ? "text-orange-500" // Active text color
                : "text-gray-400 hover:text-gray-600"
            }`}
            onClick={() => onTabChange("fullLength")}
          >
            Full Length Test
            {/* Active underline indicator */}
            {activeTab === "fullLength" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-500 rounded-t-md" />
            )}
          </button>
          
          <button
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === "practiceTest"
                ? "text-orange-500"
                : "text-gray-400 hover:text-gray-600"
            }`}
            onClick={() => onTabChange("practiceTest")}
          >
            Practice Test
            {activeTab === "practiceTest" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-500 rounded-t-md" />
            )}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <button 
          className="lg:px-5 lg:py-2.5 px-3 py-1.5 rounded-full font-semibold text-sm border-2 border-orange-500 text-orange-500 bg-transparent hover:bg-orange-50 transition-all flex items-center gap-2"
          onClick={() => setMonthOffset(monthOffset + 1)}
        >
          <ArrowLeftOutlined className="text-base" />
          <span className="hidden md:inline">Prev</span>
        </button>
        
        <div className="flex flex-col items-center">
          <h2 className="text-xl md:text-xl font-bold text-gray-800">
            {MONTH_NAMES[month]} {year}
          </h2>
          <span className="text-sm font-semibold text-orange-600 mt-1">
            Total Time: {secondsToLabel(totalSeconds)}
          </span>
        </div>
        
        <button 
          className={`lg:px-5 lg:py-2.5 px-3 py-1.5 rounded-full font-semibold text-sm border-2 transition-all flex items-center gap-2 ${
            isCurrentMonth 
              ? "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed" 
              : "bg-orange-500 border-orange-500 text-white hover:bg-orange-600"
          }`}
          onClick={() => setMonthOffset(monthOffset - 1)}
          disabled={isCurrentMonth}
        >
          <span className="hidden md:inline">Next</span>
          <ArrowRightOutlined className="text-base" />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-2 md:gap-3 mb-2 md:mb-3">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="text-center text-base font-semibold text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 md:gap-3">
        {days.map((d, index) => (
          d.isEmpty ? (
            <div key={`empty-${index}`} className="aspect-square" />
          ) : (
            <div
              key={`day-${d.dayLabel}`}
              className={`aspect-square rounded-md lg:rounded-xl flex flex-col items-center justify-center transition-all hover:scale-105 hover:shadow-lg cursor-pointer ${levelClasses[levelForSeconds(d.seconds)]}`}
            >
              <span className="text-base md:text-lg font-bold">{d.dayLabel}</span>
              {d.seconds > 0 && (
                <span className="text-[9px] md:text-[10px] font-medium mt-0.5 opacity-90">
                  {secondsToMinutes(d.seconds)}
                </span>
              )}
            </div>
          )
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-5 md:mt-6">
        <span className="text-xs text-gray-400">Less</span>
        {legendClasses.map((cls, i) => (
          <div key={i} className={`w-4 h-4 rounded ${cls}`} />
        ))}
        <span className="text-xs text-gray-400">More</span>
      </div>
    </div>
  );
}
