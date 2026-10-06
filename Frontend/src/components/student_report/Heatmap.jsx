"use client";

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

import { useState } from "react";

/* =========================================================
   HELPERS
========================================================= */

function getFirstDayOffset(year, month) {
  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  // Monday = 0
  return firstDay === 0
    ? 6
    : firstDay - 1;
}

function getDaysInMonth(year, month) {
  return new Date(
    year,
    month + 1,
    0
  ).getDate();
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* =========================================================
   CALENDAR LEVEL
========================================================= */

function levelForTests(count) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 2) return 2;
  if (count <= 4) return 3;

  return 4;
}

/* =========================================================
   COLORS
========================================================= */

const levelClasses = {
  0: "bg-gray-200 text-gray-600",
  1: "bg-orange-100 text-gray-600",
  2: "bg-orange-300 text-gray-700",
  3: "bg-orange-400 text-white",
  4: "bg-orange-500 text-white",
};

const legendClasses = [
  "bg-gray-200",
  "bg-orange-100",
  "bg-orange-300",
  "bg-orange-400",
  "bg-orange-500",
];

/* =========================================================
   SCORE HELPERS
========================================================= */

function getPercentage(score, total) {
  if (!total || total <= 0) {
    return 0;
  }

  return Math.round(
    (score / total) * 100
  );
}

function getScoreClass(percentage) {
  if (percentage >= 80) {
    return "text-green-600";
  }

  if (percentage >= 60) {
    return "text-orange-500";
  }

  return "text-red-500";
}

/* =========================================================
   TIME HELPERS
========================================================= */

function formatTime(seconds) {
  const totalSeconds = Number(seconds || 0);

  if (totalSeconds <= 0) {
    return "0 min";
  }

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const remainingSeconds =
    totalSeconds % 60;

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${hours}h`;
  }

  if (remainingSeconds > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${minutes} min`;
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(
    `${dateString}T00:00:00`
  );

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Heatmap({
  dateWise = [],
}) {

  const [monthOffset, setMonthOffset] =
    useState(0);

  const [hoveredDate, setHoveredDate] =
    useState(null);

  /* =======================================================
     TARGET MONTH
  ======================================================= */

  const current = new Date();

  const targetDate = new Date(
    current.getFullYear(),
    current.getMonth() - monthOffset,
    1
  );

  const year =
    targetDate.getFullYear();

  const month =
    targetDate.getMonth();

  const daysInMonth =
    getDaysInMonth(
      year,
      month
    );

  const firstDayOffset =
    getFirstDayOffset(
      year,
      month
    );

  const isCurrentMonth =
    monthOffset === 0;

  /* =======================================================
     DATE MAP
  ======================================================= */

  const dateMap = {};

  dateWise.forEach((item) => {

    if (!item?.date) {
      return;
    }

    const key = String(
      item.date
    ).substring(0, 10);

    dateMap[key] = item;
  });

  /* =======================================================
     CALENDAR DAYS
  ======================================================= */

  const days = [];

  for (
    let i = 0;
    i < firstDayOffset;
    i++
  ) {

    days.push({
      isEmpty: true,
    });
  }

  let totalTests = 0;

  let totalTimeSeconds = 0;

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const dateKey =
      `${year}-${String(
        month + 1
      ).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

    const dayData =
      dateMap[dateKey];

    const tests =
      dayData?.tests || [];

    const testCount =
      tests.length;

    const dayTimeSeconds =
      Number(
        dayData?.total_time_seconds || 0
      );

    totalTests += testCount;

    totalTimeSeconds +=
      dayTimeSeconds;

    days.push({
      dayLabel:
        day.toString(),

      date: dateKey,

      tests,

      testCount,

      totalTimeSeconds:
        dayTimeSeconds,

      isEmpty: false,
    });
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="card-layout relative">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex items-center justify-between mb-6 md:mb-8">

        {/* PREVIOUS */}

        <button
          type="button"
          className="
            lg:px-5
            lg:py-2.5
            px-3
            py-1.5
            rounded-full
            font-semibold
            text-sm
            border-2
            border-orange-500
            text-orange-500
            bg-transparent
            hover:bg-orange-50
            transition-all
            flex
            items-center
            gap-2
          "
          onClick={() => {
            setHoveredDate(null);

            setMonthOffset(
              (value) => value + 1
            );
          }}
        >

          <ArrowLeftOutlined
            className="text-base"
          />

          <span className="hidden md:inline">
            Prev
          </span>

        </button>

        {/* MONTH */}

        <div className="flex flex-col items-center">

          <h2 className="text-xl md:text-xl font-bold text-gray-800">
            {MONTH_NAMES[month]} {year}
          </h2>

          <div className="flex flex-col items-center mt-1">

            <span className="text-sm font-semibold text-orange-600">
              Total Tests: {totalTests}
            </span>

            <span className="text-xs font-medium text-gray-500">
              Total Time: {formatTime(
                totalTimeSeconds
              )}
            </span>

          </div>

        </div>

        {/* NEXT */}

        <button
          type="button"
          className={`
            lg:px-5
            lg:py-2.5
            px-3
            py-1.5
            rounded-full
            font-semibold
            text-sm
            border-2
            transition-all
            flex
            items-center
            gap-2
            ${
              isCurrentMonth
                ? "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-orange-500 border-orange-500 text-white hover:bg-orange-600"
            }
          `}
          onClick={() => {
            setHoveredDate(null);

            setMonthOffset(
              (value) => value - 1
            );
          }}
          disabled={isCurrentMonth}
        >

          <span className="hidden md:inline">
            Next
          </span>

          <ArrowRightOutlined
            className="text-base"
          />

        </button>

      </div>

      {/* ===================================================
          WEEKDAYS
      =================================================== */}

      <div className="grid grid-cols-7 gap-2 md:gap-3 mb-2 md:mb-3">

        {[
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
          "Sun",
        ].map((day) => (

          <div
            key={day}
            className="
              text-center
              text-base
              font-semibold
              text-gray-400
              py-2
            "
          >
            {day}
          </div>

        ))}

      </div>

      {/* ===================================================
          CALENDAR GRID
      =================================================== */}

      <div className="grid grid-cols-7 gap-2 md:gap-3">

        {days.map(
          (d, index) => {

            if (d.isEmpty) {

              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-square"
                />
              );
            }

            const level =
              levelForTests(
                d.testCount
              );

            const isHovered =
              hoveredDate === d.date;

            return (
              <div
                key={`day-${d.date}`}
                className="relative"
                onMouseEnter={() =>
                  setHoveredDate(
                    d.date
                  )
                }
                onMouseLeave={() =>
                  setHoveredDate(null)
                }
              >

                {/* =================================================
                    DAY CELL
                ================================================= */}

                <div
                  className={`
                    aspect-square
                    rounded-md
                    lg:rounded-xl
                    flex
                    flex-col
                    items-center
                    justify-center
                    transition-all
                    cursor-pointer
                    ${levelClasses[level]}
                    ${
                      d.testCount > 0
                        ? "hover:scale-105 hover:shadow-lg"
                        : ""
                    }
                  `}
                >

                  {/* DATE */}

                  <span className="text-base md:text-lg font-bold">
                    {d.dayLabel}
                  </span>

                  {/* TEST COUNT */}

                  {d.testCount > 0 && (

                    <span className="text-[9px] md:text-[10px] font-medium mt-0.5 opacity-90">
                      {d.testCount} test
                      {d.testCount !== 1
                        ? "s"
                        : ""}
                    </span>

                  )}

                  {/* TIME */}

                  {d.testCount > 0 && (

                    <span className="text-[8px] md:text-[9px] font-medium opacity-80">
                      {formatTime(
                        d.totalTimeSeconds
                      )}
                    </span>

                  )}

                </div>

                {/* =================================================
                    HOVER TOOLTIP
                ================================================= */}

                {isHovered &&
                  d.testCount > 0 && (

                   <div
  className={`
    absolute
    z-[9999]
    w-[350px]
    max-w-[calc(100vw-30px)]
    bg-white
    border
    border-gray-200
    rounded-xl
    shadow-2xl
    p-3
    text-left

    ${
      index % 7 >= 5
        ? "right-0"
        : index % 7 === 0
        ? "left-0"
        : "left-1/2 -translate-x-1/2"
    }

    ${
      index >= days.length - 7
        ? "bottom-full mb-2"
        : "top-full mt-2"
    }
  `}
>

                      {/* TOOLTIP HEADER */}

                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          pb-2
                          mb-3
                          border-b
                          border-gray-100
                        "
                      >

                        <div>

                          <div className="text-sm font-bold text-gray-800">
                            {formatDate(
                              d.date
                            )}
                          </div>

                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {d.testCount} test
                            {d.testCount !== 1
                              ? "s"
                              : ""}
                            {" • "}
                            {formatTime(
                              d.totalTimeSeconds
                            )}
                          </div>

                        </div>

                        <div
                          className="
                            w-9
                            h-9
                            rounded-full
                            bg-orange-100
                            flex
                            items-center
                            justify-center
                          "
                        >

                          <span className="text-xs font-bold text-orange-600">
                            {d.testCount}
                          </span>

                        </div>

                      </div>

                      {/* =================================================
                          TEST LIST
                      ================================================= */}

                      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">

                        {d.tests.map(
                          (
                            test,
                            testIndex
                          ) => {

                            /* =========================================
                               FULL LENGTH
                            ========================================= */

                            if (
                              test.type ===
                              "fullLength"
                            ) {

                              const totalPercentage =
                                getPercentage(
                                  test.total_score,
                                  test.total_marks
                                );

                              return (

                                <div
                                  key={
                                    test.id ||
                                    `flt-${testIndex}`
                                  }
                                  className="
                                    rounded-xl
                                    border
                                    border-gray-200
                                    overflow-hidden
                                    bg-white
                                  "
                                >

                                  {/* HEADER */}

                                  <div
                                    className="
                                      px-3
                                      py-2
                                      bg-gray-50
                                      border-b
                                      border-gray-100
                                    "
                                  >

                                    <div className="text-xs font-semibold text-gray-800">
                                      {test.test_name}
                                    </div>

                                    <div className="text-[9px] text-gray-400 mt-0.5">
                                      Full Length Test
                                    </div>

                                  </div>

                                  {/* CONTENT */}

                                  <div className="p-3">

                                    {/* TIME */}

                                    <div className="flex items-center justify-between mb-3">

                                      <span className="text-[10px] font-semibold text-gray-500 uppercase">
                                        Time Taken
                                      </span>

                                      <span className="text-sm font-bold text-orange-600">
                                        {test.time_label ||
                                          formatTime(
                                            test.time_seconds
                                          )}
                                      </span>

                                    </div>

                                    {/* TOTAL SCORE */}

                                    <div className="flex items-center justify-between mb-2">

                                      <span className="text-[10px] font-semibold text-gray-500 uppercase">
                                        Total Score
                                      </span>

                                      <span
                                        className={`
                                          text-sm
                                          font-bold
                                          ${getScoreClass(
                                            totalPercentage
                                          )}
                                        `}
                                      >
                                        {
                                          totalPercentage
                                        }%
                                      </span>

                                    </div>

                                    <div className="flex items-baseline gap-1">

                                      <span className="text-2xl font-bold text-red-500">
                                        {
                                          test.total_score
                                        }
                                      </span>

                                      <span className="text-[10px] font-bold text-gray-700">
                                        OUT OF{" "}
                                        {
                                          test.total_marks
                                        }
                                      </span>

                                    </div>

                                    {/* PROGRESS */}

                                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">

                                      <div
                                        className="h-full bg-red-500 rounded-full"
                                        style={{
                                          width: `${Math.min(
                                            totalPercentage,
                                            100
                                          )}%`,
                                        }}
                                      />

                                    </div>

                                    {/* SUBJECTS */}

                                    <div className="grid grid-cols-2 gap-2 mt-3">

                                      {/* ENGLISH */}

                                      <div className="border border-gray-100 rounded-lg p-2">

                                        <div className="text-[9px] font-semibold text-gray-500 uppercase">
                                          English
                                        </div>

                                        <div className="mt-1">

                                          <span className="text-sm font-bold text-gray-700">
                                            {
                                              test.english_score
                                            }
                                          </span>

                                          <span className="text-[9px] text-gray-400 ml-1">
                                            / 800
                                          </span>

                                        </div>

                                        <div className="text-[9px] text-gray-400 mt-0.5">
                                          {
                                            getPercentage(
                                              test.english_score,
                                              800
                                            )
                                          }%
                                        </div>

                                      </div>

                                      {/* MATH */}

                                      <div className="border border-gray-100 rounded-lg p-2">

                                        <div className="text-[9px] font-semibold text-gray-500 uppercase">
                                          Math
                                        </div>

                                        <div className="mt-1">

                                          <span className="text-sm font-bold text-gray-700">
                                            {
                                              test.math_score
                                            }
                                          </span>

                                          <span className="text-[9px] text-gray-400 ml-1">
                                            / 800
                                          </span>

                                        </div>

                                        <div className="text-[9px] text-gray-400 mt-0.5">
                                          {
                                            getPercentage(
                                              test.math_score,
                                              800
                                            )
                                          }%
                                        </div>

                                      </div>

                                    </div>

                                  </div>

                                </div>

                              );
                            }

                            /* =========================================
                               PRACTICE TEST
                            ========================================= */

                            const practicePercentage =
                              getPercentage(
                                test.score,
                                test.total_questions
                              );

                            return (

                              <div
                                key={
                                  test.id ||
                                  `practice-${testIndex}`
                                }
                                className="
                                  rounded-xl
                                  border
                                  border-gray-200
                                  overflow-hidden
                                  bg-white
                                "
                              >

                                {/* HEADER */}

                                <div
                                  className="
                                    px-3
                                    py-2
                                    bg-gray-50
                                    border-b
                                    border-gray-100
                                  "
                                >

                                  <div className="text-xs font-semibold text-gray-800">
                                    {
                                      test.test_name
                                    }
                                  </div>

                                  <div className="text-[9px] text-gray-400 mt-0.5">
                                    Practice Test
                                  </div>

                                </div>

                                {/* CONTENT */}

                                <div className="p-3">

                                  {/* TIME */}

                                  <div className="flex items-center justify-between mb-3">

                                    <span className="text-[10px] font-semibold text-gray-500 uppercase">
                                      Time Taken
                                    </span>

                                    <span className="text-sm font-bold text-blue-600">
                                      {test.time_label ||
                                        formatTime(
                                          test.time_seconds
                                        )}
                                    </span>

                                  </div>

                                  {/* SCORE */}

                                  <div className="flex items-center justify-between mb-2">

                                    <span className="text-[10px] font-semibold text-gray-500 uppercase">
                                      Score
                                    </span>

                                    <span
                                      className={`
                                        text-sm
                                        font-bold
                                        ${getScoreClass(
                                          practicePercentage
                                        )}
                                      `}
                                    >
                                      {
                                        practicePercentage
                                      }%
                                    </span>

                                  </div>

                                  <div className="flex items-baseline gap-1">

                                    <span
                                      className={`
                                        text-2xl
                                        font-bold
                                        ${getScoreClass(
                                          practicePercentage
                                        )}
                                      `}
                                    >
                                      {test.score}
                                    </span>

                                    <span className="text-[10px] font-bold text-gray-700 uppercase">
                                      OUT OF{" "}
                                      {
                                        test.total_questions
                                      }
                                    </span>

                                  </div>

                                  {/* PROGRESS */}

                                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">

                                    <div
                                      className="h-full bg-blue-500 rounded-full"
                                      style={{
                                        width: `${Math.min(
                                          practicePercentage,
                                          100
                                        )}%`,
                                      }}
                                    />

                                  </div>

                                </div>

                              </div>

                            );

                          }
                        )}

                      </div>

                    </div>

                  )}

              </div>
            );
          }
        )}

      </div>

      {/* ===================================================
          LEGEND
      =================================================== */}

      <div className="flex items-center justify-end gap-2 mt-5 md:mt-6">

        <span className="text-xs text-gray-400">
          Less
        </span>

        {legendClasses.map(
          (cls, i) => (

            <div
              key={i}
              className={`w-4 h-4 rounded ${cls}`}
            />

          )
        )}

        <span className="text-xs text-gray-400">
          More
        </span>

      </div>

    </div>
  );
}