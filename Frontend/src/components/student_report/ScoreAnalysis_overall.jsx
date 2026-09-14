"use client";

import React, {
  useState,
  useEffect,
  useMemo,
} from "react";

import axios from "axios";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { BASE_URL } from "@/app/constants/apiConstants";


export default function ScoreAnalysis_overall({
  student_id,
  course_id,
  courseName = "Course",
}) {

  // =========================================================
  // STATE
  // =========================================================

  const [selectedSubject, setSelectedSubject] =
    useState("All");

  const [isDropdownOpen, setIsDropdownOpen] =
    useState(false);

  const [startIndex, setStartIndex] =
    useState(0);

  const [visibleCount, setVisibleCount] =
    useState(6);

  const [hideButtons, setHideButtons] =
    useState(false);

  const [apiData, setApiData] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);


  // =========================================================
  // FETCH OVERALL DATA
  // =========================================================

  useEffect(() => {

    if (!student_id || !course_id) {
      return;
    }

    let isMounted = true;

    const fetchOverallData = async () => {

      setLoading(true);
      setError(null);

      try {

        const res = await axios.get(
          `${BASE_URL}/api/result/score-analysis/`,
          {
            params: {
              student_id: student_id,
              course_id: course_id,

              // IMPORTANT
              test_type: "OVERALL",
            },

            withCredentials: true,
          }
        );

        if (isMounted) {
          setApiData(res.data);
        }

      } catch (err) {

        console.error(
          "Error loading Overall Score Analysis:",
          err
        );

        if (isMounted) {

          setError(
            err?.response?.data?.error ||
            "Failed to load Overall Performance."
          );

          setApiData(null);
        }

      } finally {

        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOverallData();

    return () => {
      isMounted = false;
    };

  }, [student_id, course_id]);


  // =========================================================
  // SUBJECT OPTIONS
  // =========================================================

  const subjectOptions = useMemo(() => {

    const options = [
      {
        value: "All",
        label: "All",
      },
    ];

    if (!apiData?.tests) {
      return options;
    }

    const subjects = [
      ...new Set(
        apiData.tests
          .map((test) => test.subject)
          .filter(Boolean)
      ),
    ];

    subjects.forEach((subject) => {

      if (
        !options.some(
          (option) =>
            option.value.toLowerCase() ===
            String(subject).toLowerCase()
        )
      ) {

        options.push({
          value: subject,
          label: subject,
        });

      }

    });

    return options;

  }, [apiData]);


  // =========================================================
  // SELECTED OPTION
  // =========================================================

  const selectedOption =
    subjectOptions.find(
      (option) =>
        option.value === selectedSubject
    );


  // =========================================================
  // CHART DATA
  // =========================================================

  const chartData = useMemo(() => {

    if (
      !apiData ||
      !Array.isArray(apiData.tests)
    ) {
      return [];
    }

    let filteredTests = [
      ...apiData.tests,
    ];

    // -------------------------------------------------------
    // SUBJECT FILTER
    // -------------------------------------------------------

    if (selectedSubject !== "All") {

      filteredTests =
        filteredTests.filter(
          (test) => {

            const subject =
              String(
                test.subject || ""
              ).toLowerCase();

            return (
              subject ===
              String(
                selectedSubject
              ).toLowerCase()
            );

          }
        );

    }


    // -------------------------------------------------------
    // SORT BY DATE
    // -------------------------------------------------------

    filteredTests.sort(
      (a, b) => {

        const dateA =
          new Date(
            a.date_time ||
            a.date
          );

        const dateB =
          new Date(
            b.date_time ||
            b.date
          );

        return dateA - dateB;

      }
    );


    // -------------------------------------------------------
    // FORMAT DATA FOR RECHARTS
    // -------------------------------------------------------

    return filteredTests.map(
      (test) => {

        let testName = "";

        if (
          test.source ===
          "FULL_LENGTH"
        ) {

          testName =
            `FLT-${test.full_length_test_id}`;

        } else if (
          test.source ===
          "PRACTICE"
        ) {

          testName =
            `PT-${test.practice_test_id}`;

        } else {

          testName =
            test.test_name ||
            `Test-${test.id}`;

        }


        return {

          id: test.id,

          name: testName,

          dateLabel:
            test.date || "",

          date:
            test.date_time ||
            test.date ||
            "",

          source:
            test.source || "",

          subject:
            test.subject || "All",

          testTypeLabel:
            test.test_type_label ||
            (
              test.source ===
              "FULL_LENGTH"
                ? "Full Length Test"
                : "Practice Test"
            ),

          Total: Number(
            test.total_questions || 0
          ),

          Correct: Number(
            test.correct || 0
          ),

          Incorrect: Number(
            test.incorrect || 0
          ),

          Accuracy: Number(
            test.accuracy || 0
          ),

          overallScore: Number(
            test.overall_score || 0
          ),

          mathScore: Number(
            test.math_score || 0
          ),

          englishScore: Number(
            test.english_score || 0
          ),

        };

      }
    );

  }, [
    apiData,
    selectedSubject,
  ]);


  // =========================================================
  // RESET PAGINATION
  // =========================================================

  useEffect(() => {

    setStartIndex(0);

  }, [selectedSubject]);


  // =========================================================
  // RESPONSIVE VISIBLE COUNT
  // =========================================================

  useEffect(() => {

    const updateVisibleCount = () => {

      const width =
        window.innerWidth;


      setHideButtons(
        width < 500
      );


      if (width < 640) {

        setVisibleCount(2);

      } else if (width < 1024) {

        setVisibleCount(4);

      } else if (width < 1300) {

        setVisibleCount(6);

      } else if (width < 1400) {

        setVisibleCount(8);

      } else {

        setVisibleCount(10);

      }

    };


    updateVisibleCount();


    window.addEventListener(
      "resize",
      updateVisibleCount
    );


    return () => {

      window.removeEventListener(
        "resize",
        updateVisibleCount
      );

    };

  }, []);


  // =========================================================
  // PAGINATION
  // =========================================================

  const displayData =
    chartData.slice(
      startIndex,
      startIndex + visibleCount
    );


  const canGoLeft =
    startIndex > 0;


  const canGoRight =
    startIndex + visibleCount <
    chartData.length;


  const needsPagination =
    chartData.length >
    visibleCount;


  const handlePrev = () => {

    if (!canGoLeft) {
      return;
    }

    setStartIndex(
      (prev) =>
        Math.max(
          0,
          prev - visibleCount
        )
    );

  };


  const handleNext = () => {

    if (!canGoRight) {
      return;
    }

    setStartIndex(
      (prev) =>
        Math.min(
          chartData.length -
            visibleCount,
          prev + visibleCount
        )
    );

  };


  // =========================================================
  // SUMMARY
  // =========================================================
  //
  // IMPORTANT:
  // Summary values come directly from API.
  //
  // This prevents pagination from changing:
  // Total Tests
  // Total Correct
  // Total Incorrect
  // Accuracy
  //
  // =========================================================

  const totalTests =
    Number(
      apiData?.total_tests ??
      chartData.length
    );


  const fullLengthCount =
    Number(
      apiData?.total_full_length_tests ??
      chartData.filter(
        (item) =>
          item.source ===
          "FULL_LENGTH"
      ).length
    );


  const practiceCount =
    Number(
      apiData?.total_practice_tests ??
      chartData.filter(
        (item) =>
          item.source ===
          "PRACTICE"
      ).length
    );


  const totalQuestions =
    Number(
      apiData?.total_questions ??
      chartData.reduce(
        (sum, item) =>
          sum + item.Total,
        0
      )
    );


  const totalCorrect =
    Number(
      apiData?.total_correct ??
      chartData.reduce(
        (sum, item) =>
          sum + item.Correct,
        0
      )
    );


  const totalIncorrect =
    Number(
      apiData?.total_incorrect ??
      chartData.reduce(
        (sum, item) =>
          sum + item.Incorrect,
        0
      )
    );


  const overallAccuracy =
    Number(
      apiData?.overall_accuracy ??
      (
        totalQuestions > 0
          ? Math.round(
              (
                totalCorrect /
                totalQuestions
              ) * 100
            )
          : 0
      )
    );


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <div className="flex items-center justify-center py-20">

        <div className="flex flex-col items-center gap-3">

          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />

          <div className="text-gray-500">

            Loading Overall Performance...

          </div>

        </div>

      </div>

    );

  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error) {

    return (

      <div className="flex flex-col items-center justify-center bg-red-50 rounded-2xl border border-red-200 p-12 text-center shadow-sm">

        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-5">

          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86l-7.82 14A2 2 0 004.21 21h15.58a2 2 0 001.74-3.14l-7.82-14a2 2 0 00-3.42 0z"
            />

          </svg>

        </div>


        <h3 className="text-xl font-bold text-red-700 mb-2">

          Unable to Load Overall Performance

        </h3>


        <p className="text-red-500">

          {error}

        </p>

      </div>

    );

  }


  // =========================================================
  // EMPTY STATE
  // =========================================================

  if (
    !apiData ||
    !Array.isArray(apiData.tests) ||
    apiData.tests.length === 0
  ) {

    return (

      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl border border-amber-200 p-12 text-center shadow-sm">

        <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-200 rounded-full flex items-center justify-center mb-6 shadow-inner">

          <svg
            className="w-10 h-10 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 002 2v6a2 2 0 002 2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />

          </svg>

        </div>


        <h3 className="text-xl font-bold text-gray-700 mb-2">

          No Overall Performance Data Available

        </h3>


        <p className="text-gray-500 max-w-md leading-relaxed">

          Complete Full Length or Practice tests
          to see your combined performance here.

        </p>

      </div>

    );

  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="space-y-8 animate-fadeIn mb-10">


      {/* =====================================================
          SCORE ANALYSIS
      ===================================================== */}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">


          <div>

            <h3 className="text-xl font-bold text-gray-800">

              Overall Performance -{" "}
              {courseName} Analysis

            </h3>


            <p className="text-sm text-gray-500 mt-1">

              Combined Full Length Test + Practice Test

            </p>

          </div>


          {/* =================================================
              SUBJECT DROPDOWN
          ================================================= */}

          {subjectOptions.length > 1 && (

            <div className="flex gap-1 items-center">

              <span className="text-sm font-semibold text-amber-500 uppercase tracking-wide flex items-center me-2">

                Subject

              </span>


              <div className="relative">

                <button
                  type="button"
                  onClick={() =>
                    setIsDropdownOpen(
                      !isDropdownOpen
                    )
                  }
                  onBlur={() =>
                    setTimeout(
                      () =>
                        setIsDropdownOpen(
                          false
                        ),
                      150
                    )
                  }
                  className="flex items-center justify-between gap-4 px-3 py-2 min-w-[120px] bg-white border border-gray-200 rounded-md text-gray-800 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 cursor-pointer transition-all duration-200 hover:border-amber-400"
                >

                  <span>

                    {selectedOption?.label ||
                      "All"}

                  </span>


                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                      isDropdownOpen
                        ? "rotate-180"
                        : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />

                  </svg>

                </button>


                {isDropdownOpen && (

                  <div className="absolute top-full left-0 w-full min-w-[120px] bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-100 mt-1">

                    {subjectOptions.map(
                      (option) => (

                        <button
                          type="button"
                          key={option.value}
                          onMouseDown={(e) =>
                            e.preventDefault()
                          }
                          onClick={() => {

                            setSelectedSubject(
                              option.value
                            );

                            setIsDropdownOpen(
                              false
                            );

                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left font-medium transition-all duration-150 cursor-pointer ${
                            selectedSubject ===
                            option.value
                              ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >

                          <span>
                            {option.label}
                          </span>


                          {selectedSubject ===
                            option.value && (

                            <svg
                              className="w-5 h-5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />

                            </svg>

                          )}

                        </button>

                      )
                    )}

                  </div>

                )}

              </div>

            </div>

          )}

        </div>


        {/* =================================================
            CHART
        ================================================= */}

        {chartData.length === 0 ? (

          <div className="h-[350px] w-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-gray-50 to-amber-50 rounded-xl border border-dashed border-amber-300 p-6">

            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">

              <svg
                className="w-8 h-8 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 002 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />

              </svg>

            </div>


            <h4 className="text-lg font-bold text-gray-700">

              No Tests Found

            </h4>


            <p className="text-sm text-gray-500 mt-1 max-w-sm font-medium">

              There are no tests recorded for{" "}
              {selectedSubject}.

            </p>

          </div>

        ) : (

          <div className="relative flex items-center">


            {/* =================================================
                LEFT BUTTON
            ================================================= */}

            {!hideButtons &&
              needsPagination &&
              canGoLeft && (

                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-0 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-amber-500 text-white shadow-lg hover:bg-amber-600 hover:scale-110 cursor-pointer"
                  style={{
                    left: "-5px",
                  }}
                >

                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M15 19l-7-7 7-7"
                    />

                  </svg>

                </button>

              )}


            {/* =================================================
                CHART
            ================================================= */}

            <div
              className={`h-[350px] w-full flex justify-center ${
                hideButtons
                  ? "px-2"
                  : "px-12"
              }`}
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={displayData}
                  barGap={2}
                  barCategoryGap="15%"
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eee"
                  />


                  <XAxis
                    dataKey="name"
                    interval={0}
                    height={65}
                    axisLine={false}
                    tickLine={false}
                    tick={({
                      x,
                      y,
                      payload,
                    }) => {

                      const data =
                        displayData[
                          payload.index
                        ];

                      if (!data) {
                        return null;
                      }


                      return (

                        <g
                          transform={`translate(${x},${y})`}
                        >

                          <text
                            dy={14}
                            textAnchor="middle"
                            fontSize={12}
                            fontWeight={600}
                            fill="#374151"
                          >

                            {data.name}

                          </text>


                          <text
                            dy={30}
                            textAnchor="middle"
                            fontSize={10}
                            fill="#9ca3af"
                          >

                            {data.dateLabel}

                          </text>


                          <text
                            dy={44}
                            textAnchor="middle"
                            fontSize={9}
                            fill="#f59e0b"
                          >

                            {data.testTypeLabel}

                          </text>

                        </g>

                      );

                    }}
                  />


                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[
                      0,
                      "auto",
                    ]}
                    fontSize={11}
                  />


                  <Tooltip
                    cursor={{
                      fill: "transparent",
                    }}
                    formatter={(
                      value,
                      name
                    ) => [
                      value,
                      name,
                    ]}
                  />


                  <Legend
                    wrapperStyle={{
                      paddingTop: "10px",
                    }}
                  />


                  <Bar
                    dataKey="Total"
                    fill="#3b82f6"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                    barSize={18}
                    name="Total Questions"
                  />


                  <Bar
                    dataKey="Correct"
                    fill="#10b981"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                    barSize={18}
                    name="Correct"
                  />


                  <Bar
                    dataKey="Incorrect"
                    fill="#ef4444"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                    barSize={18}
                    name="Incorrect"
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>


            {/* =================================================
                RIGHT BUTTON
            ================================================= */}

            {!hideButtons &&
              needsPagination &&
              canGoRight && (

                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-0 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-amber-500 text-white shadow-lg hover:bg-amber-600 hover:scale-110 cursor-pointer"
                  style={{
                    right: "-5px",
                  }}
                >

                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />

                  </svg>

                </button>

              )}

          </div>

        )}


        {/* =================================================
            PAGE INDICATORS
        ================================================= */}

        {chartData.length >
          visibleCount && (

          <div className="flex justify-center mt-4 gap-2">

            {Array.from({
              length: Math.ceil(
                chartData.length /
                  visibleCount
              ),
            }).map(
              (_, index) => (

                <button
                  type="button"
                  key={index}
                  onClick={() =>
                    setStartIndex(
                      index *
                        visibleCount
                    )
                  }
                  className={`h-2.5 rounded-full transition-all duration-200 ${
                    Math.floor(
                      startIndex /
                        visibleCount
                    ) === index
                      ? "bg-amber-500 w-6"
                      : "bg-gray-300 w-2.5 hover:bg-gray-400"
                  }`}
                />

              )
            )}

          </div>

        )}

      </div>


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">


        {/* TOTAL TESTS */}

        <div className="p-5 rounded-2xl shadow-lg bg-gradient-to-br from-[#FFF8EB] to-[#FFF0D4]">

          <h4 className="text-sm font-semibold uppercase mb-2 text-[#805830]">

            Total Tests

          </h4>


          <div className="text-4xl font-black text-[#F59403]">

            {totalTests}

          </div>


          <p className="mt-2 text-xs text-[#805830]">

            FLT + Practice

          </p>

        </div>


        {/* FULL LENGTH */}

        <div className="p-5 rounded-2xl shadow-lg bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE]">

          <h4 className="text-sm font-semibold uppercase mb-2 text-[#6d28d9]">

            Full Length Tests

          </h4>


          <div className="text-4xl font-black text-[#7c3aed]">

            {fullLengthCount}

          </div>


          <p className="mt-2 text-xs text-[#6d28d9]">

            Tests completed

          </p>

        </div>


        {/* PRACTICE */}

        <div className="p-5 rounded-2xl shadow-lg bg-gradient-to-br from-[#FFF8EB] to-[#FFEDD5]">

          <h4 className="text-sm font-semibold uppercase mb-2 text-[#9a3412]">

            Practice Tests

          </h4>


          <div className="text-4xl font-black text-[#ea580c]">

            {practiceCount}

          </div>


          <p className="mt-2 text-xs text-[#9a3412]">

            Tests completed

          </p>

        </div>


        {/* OVERALL ACCURACY */}

        <div className="p-5 rounded-2xl shadow-lg bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5]">

          <h4 className="text-sm font-semibold uppercase mb-2 text-[#065f46]">

            Overall Accuracy

          </h4>


          <div className="text-4xl font-black text-[#10b981]">

            {overallAccuracy}%

          </div>


          <div className="mt-2 w-full bg-green-200 rounded-full h-2">

            <div
              className="h-2 rounded-full"
              style={{
                width:
                  `${Math.min(
                    overallAccuracy,
                    100
                  )}%`,
                background:
                  "linear-gradient(90deg, #10b981, #6ee7b7)",
              }}
            />

          </div>

        </div>


        {/* TOTAL CORRECT */}

        <div className="p-5 rounded-2xl shadow-lg bg-gradient-to-br from-[#EBF4FF] to-[#D4E4FF]">

          <h4 className="text-sm font-semibold uppercase mb-2 text-[#1e40af]">

            Total Correct

          </h4>


          <div className="text-4xl font-black text-[#3b82f6]">

            {totalCorrect}

          </div>


          <div className="text-sm text-[#60a5fa]">

            out of {totalQuestions}

          </div>

        </div>


        {/* TOTAL INCORRECT */}

        <div className="p-5 rounded-2xl shadow-lg bg-gradient-to-br from-[#FEF2F2] to-[#FECACA]">

          <h4 className="text-sm font-semibold uppercase mb-2 text-[#991b1b]">

            Total Incorrect

          </h4>


          <div className="text-4xl font-black text-[#ef4444]">

            {totalIncorrect}

          </div>


          <p className="mt-2 text-xs text-[#b91c1c]">

            Questions to review

          </p>

        </div>

      </div>

    </div>

  );
}