"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useParams } from "next/navigation";
import axios from "axios";

import { BASE_URL } from "@/app/constants/apiConstants";


/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const IMPROVEMENT_THRESHOLD = 70;


/*
|--------------------------------------------------------------------------
| SCORE HELPERS
|--------------------------------------------------------------------------
*/

function getScore(value) {
  const score = Number(value);

  if (Number.isNaN(score)) {
    return 0;
  }

  return Math.min(
    Math.max(score, 0),
    100
  );
}


function getScoreStatus(score) {
  const numericScore = getScore(score);

  if (numericScore >= 85) {
    return {
      label: "Excellent",
      text: "text-emerald-700",
      bg: "bg-emerald-100",
    };
  }

  if (numericScore >= 70) {
    return {
      label: "Strong",
      text: "text-emerald-600",
      bg: "bg-emerald-50",
    };
  }

  if (numericScore >= 50) {
    return {
      label: "Needs Practice",
      text: "text-orange-600",
      bg: "bg-orange-50",
    };
  }

  return {
    label: "Needs Attention",
    text: "text-red-600",
    bg: "bg-red-50",
  };
}


/*
|--------------------------------------------------------------------------
| SCORE BAR
|--------------------------------------------------------------------------
*/

function ScoreBar({ score }) {
  const numericScore = getScore(score);

  const isGood =
    numericScore >= IMPROVEMENT_THRESHOLD;

  return (
    <div className="flex items-center gap-3">

      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">

        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isGood
              ? "bg-emerald-500"
              : "bg-orange-400"
          }`}
          style={{
            width: `${numericScore}%`,
          }}
        />

      </div>

      <span className="w-12 text-right text-sm font-bold text-gray-700">
        {Math.round(numericScore)}%
      </span>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| TOPIC ROW
|--------------------------------------------------------------------------
*/

function TopicRow({
  topic,
  rank,
}) {

  const score = getScore(
    topic?.score
  );

  const isGood =
    score >= IMPROVEMENT_THRESHOLD;

  const status =
    getScoreStatus(score);

  return (
    <div className="group rounded-xl border border-gray-100 bg-white p-4 transition hover:border-gray-200 hover:shadow-sm">

      <div className="mb-3 flex items-center gap-3">

        {/* Rank */}

        {rank && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
            {rank}
          </div>
        )}


        {/* Topic */}

        <div className="min-w-0 flex-1">

          <p className="truncate text-sm font-semibold text-gray-800">
            {topic?.name || "Unknown Topic"}
          </p>

          {topic?.total_attempted !== undefined && (
            <p className="mt-0.5 text-xs text-gray-400">
              {topic.total_attempted}{" "}
              {topic.total_attempted === 1
                ? "question"
                : "questions"}{" "}
              attempted
            </p>
          )}

        </div>


        {/* Status */}

        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.bg} ${status.text}`}
        >
          {isGood
            ? "Strong"
            : "Improve"}
        </span>

      </div>


      {/* Score */}

      <ScoreBar score={score} />

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| RADAR CHART
|--------------------------------------------------------------------------
*/

function RadarChart({ topics }) {

  const size = 500;

  const center =
    size / 2;

  const radius = 125;

  const maxScore = 100;

  const levels = [
    20,
    40,
    60,
    80,
    100,
  ];

  const angleStep =
    topics.length > 0
      ? (Math.PI * 2) /
        topics.length
      : 0;


  const getPoint = (
    score,
    index,
    customRadius
  ) => {

    const angle =
      -Math.PI / 2 +
      index * angleStep;

    const pointRadius =
      customRadius !== undefined
        ? customRadius
        : (getScore(score) /
            maxScore) *
          radius;

    return {
      x:
        center +
        Math.cos(angle) *
          pointRadius,

      y:
        center +
        Math.sin(angle) *
          pointRadius,
    };
  };


  const createPolygonPoints = (
    level
  ) => {

    return topics
      .map((topic, index) => {

        const point =
          getPoint(
            level,
            index
          );

        return `${point.x},${point.y}`;

      })
      .join(" ");
  };


  const studentPoints =
    topics
      .map((topic, index) => {

        const point =
          getPoint(
            topic?.score,
            index
          );

        return `${point.x},${point.y}`;

      })
      .join(" ");


  if (!topics.length) {

    return (
      <div className="flex min-h-[380px] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            —
          </div>

          <p className="text-sm font-medium text-gray-600">
            No topic performance available
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Complete some questions to see your
            performance graph.
          </p>

        </div>

      </div>
    );
  }


  const average =
    topics.reduce(
      (total, topic) =>
        total +
        getScore(
          topic?.score
        ),
      0
    ) / topics.length;


  return (

    <div className="w-full">

      <div className="flex justify-center">

        <svg
          viewBox={`0 0 ${size} ${size}`}
         className="h-auto w-full max-w-[500px]"
        >

          {/* Radar levels */}

          {levels.map(
            (level) => (

              <polygon
                key={`level-${level}`}
                points={
                  createPolygonPoints(
                    level
                  )
                }
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="1"
              />

            )
          )}


          {/* Axes */}

          {topics.map(
            (topic, index) => {

              const point =
                getPoint(
                  100,
                  index
                );

              return (
                <line
                  key={`axis-${index}`}
                  x1={center}
                  y1={center}
                  x2={point.x}
                  y2={point.y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              );

            }
          )}


          {/* 70% reference */}

          <polygon
            points={
              createPolygonPoints(
                IMPROVEMENT_THRESHOLD
              )
            }
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />


          {/* Student performance */}

          <polygon
            points={studentPoints}
            fill="rgba(16, 185, 129, 0.12)"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinejoin="round"
          />


          {/* Points */}

          {topics.map(
            (topic, index) => {

              const score =
                getScore(
                  topic?.score
                );

              const point =
                getPoint(
                  score,
                  index
                );

              const isGood =
                score >=
                IMPROVEMENT_THRESHOLD;

              return (
                <circle
                  key={`point-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill={
                    isGood
                      ? "#10b981"
                      : "#f97316"
                  }
                  stroke="white"
                  strokeWidth="3"
                />
              );

            }
          )}


          {/* Labels */}

          {topics.map(
            (topic, index) => {

              const labelPoint =
                getPoint(
                  118,
                  index
                );

              let textAnchor =
                "middle";

              if (
                labelPoint.x <
                center - 40
              ) {
                textAnchor = "end";
              }

              if (
                labelPoint.x >
                center + 40
              ) {
                textAnchor = "start";
              }

              return (
                <text
                  key={`label-${index}`}
                  x={
                    labelPoint.x
                  }
                  y={
                    labelPoint.y
                  }
                  textAnchor={
                    textAnchor
                  }
                  dominantBaseline="middle"
                  className="fill-gray-600 text-[11px] font-medium"
                >
                  {topic?.name}
                </text>
              );

            }
          )}


          {/* Center */}

          <circle
            cx={center}
            cy={center}
            r="38"
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="1"
          />

          <text
            x={center}
            y={center - 4}
            textAnchor="middle"
            className="fill-gray-900 text-[19px] font-bold"
          >
            {Math.round(
              average
            )}
            %
          </text>

          <text
            x={center}
            y={center + 15}
            textAnchor="middle"
            className="fill-gray-400 text-[9px]"
          >
            Average
          </text>

        </svg>

      </div>


      {/* Legend */}

      <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2">

        <div className="flex items-center gap-2">

          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

          <span className="text-xs text-gray-500">
            Strong — 70%+
          </span>

        </div>

        <div className="flex items-center gap-2">

          <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />

          <span className="text-xs text-gray-500">
            Improve — below 70%
          </span>

        </div>

      </div>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

function StatCard({
  label,
  value,
  description,
  icon,
  iconClass,
}) {

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-xs font-medium text-gray-400">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-gray-400">
              {description}
            </p>
          )}

        </div>


        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| MAIN COMPONENT
|--------------------------------------------------------------------------
*/

export default function StudentDashboardImprovement() {

  /*
  |--------------------------------------------------------------------------
  | STUDENT ID
  |--------------------------------------------------------------------------
  */

  const params =
    useParams();

  const studentId =
    params?.id ||
    params?.student_id ||
    "";


  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    courses,
    setCourses,
  ] = useState([]);

  const [
    selectedCourseId,
    setSelectedCourseId,
  ] = useState("");


  const [
    subjects,
    setSubjects,
  ] = useState([]);

  const [
    selectedSubjectId,
    setSelectedSubjectId,
  ] = useState("");


  const [
    loadingCourses,
    setLoadingCourses,
  ] = useState(false);

  const [
    loadingImprovement,
    setLoadingImprovement,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | LOAD COURSES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (!studentId) {
      return;
    }


    const loadCourses =
      async () => {

        try {

          setLoadingCourses(
            true
          );

          setError("");


          const response =
            await axios.get(
              `${BASE_URL}/api/course/student-courses/`,
              {
                params: {
                  user_id:
                    studentId,
                },

                withCredentials:
                  true,
              }
            );


          let courseData = [];


          if (
            Array.isArray(
              response.data
            )
          ) {

            courseData =
              response.data;

          } else if (
            Array.isArray(
              response.data?.results
            )
          ) {

            courseData =
              response.data.results;

          } else if (
            Array.isArray(
              response.data?.courses
            )
          ) {

            courseData =
              response.data.courses;

          }


          setCourses(
            courseData
          );


          if (
            courseData.length
          ) {

            setSelectedCourseId(
              String(
                courseData[0].id
              )
            );

          } else {

            setSelectedCourseId(
              ""
            );

          }

        } catch (error) {

          console.error(
            "Error loading courses:",
            error
          );

          setCourses([]);

          setSelectedCourseId(
            ""
          );

          setError(
            "Unable to load courses."
          );

        } finally {

          setLoadingCourses(
            false
          );

        }

      };


    loadCourses();

  }, [studentId]);


  /*
  |--------------------------------------------------------------------------
  | LOAD IMPROVEMENT DATA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (
      !studentId ||
      !selectedCourseId
    ) {
      return;
    }


    const loadImprovementData =
      async () => {

        try {

          setLoadingImprovement(
            true
          );

          setError("");


          const response =
            await axios.get(
              `${BASE_URL}/api/result/student-improvement/`,
              {
                params: {

                  student_id:
                    studentId,

                  course_id:
                    selectedCourseId,

                  test_type:
                    "fullLength",

                },

                withCredentials:
                  true,
              }
            );


          const responseSubjects =
            Array.isArray(
              response.data?.subjects
            )
              ? response.data.subjects
              : [];


          setSubjects(
            responseSubjects
          );


          if (
            responseSubjects.length
          ) {

            setSelectedSubjectId(
              String(
                responseSubjects[0].id
              )
            );

          } else {

            setSelectedSubjectId(
              ""
            );

          }

        } catch (error) {

          console.error(
            "Error loading improvement data:",
            error
          );

          setSubjects([]);

          setSelectedSubjectId(
            ""
          );

          setError(
            error?.response?.data?.error ||
            "Unable to load improvement data."
          );

        } finally {

          setLoadingImprovement(
            false
          );

        }

      };


    loadImprovementData();

  }, [
    studentId,
    selectedCourseId,
  ]);


  /*
  |--------------------------------------------------------------------------
  | SELECTED COURSE
  |--------------------------------------------------------------------------
  */

  const selectedCourse =
    courses.find(
      (course) =>
        String(
          course.id
        ) ===
        String(
          selectedCourseId
        )
    ) || null;


  /*
  |--------------------------------------------------------------------------
  | SELECTED SUBJECT
  |--------------------------------------------------------------------------
  */

  const selectedSubject =
    subjects.find(
      (subject) =>
        String(
          subject.id
        ) ===
        String(
          selectedSubjectId
        )
    ) || null;


  /*
  |--------------------------------------------------------------------------
  | TOPICS
  |--------------------------------------------------------------------------
  */

  const allTopics =
    useMemo(() => {

      if (
        !selectedSubject
      ) {
        return [];
      }

      return Array.isArray(
        selectedSubject.topics
      )
        ? selectedSubject.topics
        : [];

    }, [
      selectedSubject,
    ]);


  /*
  |--------------------------------------------------------------------------
  | GOOD TOPICS
  |--------------------------------------------------------------------------
  */

  const goodTopics =
    useMemo(() => {

      if (
        selectedSubject &&
        Array.isArray(
          selectedSubject.good_at
        )
      ) {

        return selectedSubject.good_at;

      }

      return allTopics
        .filter(
          (topic) =>
            getScore(
              topic?.score
            ) >=
            IMPROVEMENT_THRESHOLD
        )
        .sort(
          (a, b) =>
            getScore(
              b?.score
            ) -
            getScore(
              a?.score
            )
        );

    }, [
      selectedSubject,
      allTopics,
    ]);


  /*
  |--------------------------------------------------------------------------
  | IMPROVEMENT TOPICS
  |--------------------------------------------------------------------------
  */

  const improvementTopics =
    useMemo(() => {

      if (
        selectedSubject &&
        Array.isArray(
          selectedSubject.needs_improvement
        )
      ) {

        return selectedSubject.needs_improvement;

      }

      return allTopics
        .filter(
          (topic) =>
            getScore(
              topic?.score
            ) <
            IMPROVEMENT_THRESHOLD
        )
        .sort(
          (a, b) =>
            getScore(
              a?.score
            ) -
            getScore(
              b?.score
            )
        );

    }, [
      selectedSubject,
      allTopics,
    ]);


  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const averageScore =
    getScore(
      selectedSubject?.average_score
    );


  const strongCount =
    goodTopics.length;


  const improvementCount =
    improvementTopics.length;


  const totalTopics =
    allTopics.length;


  const performanceStatus =
    getScoreStatus(
      averageScore
    );


  /*
  |--------------------------------------------------------------------------
  | COURSE CHANGE
  |--------------------------------------------------------------------------
  */

  const handleCourseChange =
    (event) => {

      const courseId =
        event.target.value;

      setSelectedCourseId(
        courseId
      );

      setSelectedSubjectId(
        ""
      );

      setSubjects([]);

    };


  /*
  |--------------------------------------------------------------------------
  | SUBJECT CHANGE
  |--------------------------------------------------------------------------
  */

  const handleSubjectChange =
    (subjectId) => {

      setSelectedSubjectId(
        String(subjectId)
      );

    };


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loadingCourses) {

    return (
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">

        <div className="flex min-h-[300px] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-700" />

            <p className="text-sm text-gray-500">
              Loading courses...
            </p>

          </div>

        </div>

      </section>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | NO COURSES
  |--------------------------------------------------------------------------
  */

  if (!courses.length) {

    return (
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">

        <div className="mb-6">

          <h2 className="text-xl font-bold text-gray-900">
            Areas of Improvement
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Understand your strengths and identify topics
            that need more practice.
          </p>

        </div>


        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">

          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
            📚
          </div>

          <p className="text-sm font-semibold text-gray-700">
            No courses available
          </p>

          <p className="mt-1 text-xs text-gray-400">
            There are no courses assigned to this student.
          </p>

        </div>

      </section>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | MAIN UI
  |--------------------------------------------------------------------------
  */

  return (

    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

        <div>

          <div className="mb-2 flex items-center gap-2">

            <span className="h-2 w-2 rounded-full bg-gray-900" />

            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Performance Analysis
            </span>

          </div>


          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Areas of Improvement
          </h2>

          <p className="mt-1.5 max-w-xl text-sm leading-6 text-gray-500">
            Understand your strengths and identify topics
            that need more practice.
          </p>

        </div>


        {/* ====================================================
            COURSE DROPDOWN - RIGHT END
        ==================================================== */}

        <div className="flex shrink-0 items-center gap-3">

          <label
            htmlFor="improvement-course"
            className="whitespace-nowrap text-sm font-semibold text-gray-600"
          >
            Course
          </label>


          <div className="relative">

            <select
              id="improvement-course"
              value={
                selectedCourseId
              }
              onChange={
                handleCourseChange
              }
              className="min-w-[220px] appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-gray-700 shadow-sm outline-none transition hover:border-gray-300 focus:border-gray-400 focus:ring-4 focus:ring-gray-100"
            >

              {courses.map(
                (course) => (

                  <option
                    key={course.id}
                    value={course.id}
                  >
                    {course.name ||
                      course.course_name}
                  </option>

                )
              )}

            </select>


            <svg
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>

          </div>

        </div>

      </div>


      {/* ======================================================
          SUBJECT TABS
      ====================================================== */}

      <div className="mb-7 rounded-xl border border-gray-100 bg-gray-50/70 p-1">

        <div className="flex overflow-x-auto">

          {subjects.map(
            (subject) => {

              const isActive =
                String(
                  selectedSubjectId
                ) ===
                String(
                  subject.id
                );


              return (

                <button
                  key={
                    subject.id
                  }
                  type="button"
                  onClick={() =>
                    handleSubjectChange(
                      subject.id
                    )
                  }
                  className={`relative min-w-[120px] flex-1 whitespace-nowrap rounded-lg px-5 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
                  }`}
                >

                  {subject.name ||
                    subject.subject}

                </button>

              );

            }
          )}

        </div>

      </div>


      {/* ======================================================
          LOADING IMPROVEMENT
      ====================================================== */}

      {loadingImprovement ? (

        <div className="rounded-2xl border border-gray-100 bg-gray-50/60">

          <div className="flex min-h-[420px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800" />

              <p className="text-sm font-medium text-gray-600">
                Analyzing performance...
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Please wait while we load topic performance.
              </p>

            </div>

          </div>

        </div>

      ) : error ? (

        <div className="rounded-xl border border-red-100 bg-red-50 p-5">

          <div className="flex items-start gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
              !
            </div>

            <div>

              <p className="text-sm font-semibold text-red-700">
                Unable to load performance
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>

            </div>

          </div>

        </div>

      ) : !selectedSubject ? (

        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">

          <p className="text-sm font-semibold text-gray-600">
            No subject performance data available
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Try selecting another course.
          </p>

        </div>

      ) : (

        <>

          {/* ==================================================
              SUBJECT HEADER
          ================================================== */}

          <div className="mb-6">

            <div>

              <h3 className="text-lg font-bold text-gray-900">
                {selectedSubject.name ||
                  selectedSubject.subject}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Topic-wise performance analysis
              </p>

            </div>


            

          </div>


          {/* ==================================================
              SUMMARY CARDS
          ================================================== */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

            <StatCard
              label="Average Score"
              value={`${Math.round(
                averageScore
              )}%`}
              description="Overall topic performance"
              icon="↗"
              iconClass="bg-gray-100 text-gray-700"
            />


            <StatCard
              label="Strong Topics"
              value={strongCount}
              description="Topics above 70%"
              icon="✓"
              iconClass="bg-emerald-100 text-emerald-600"
            />


            <StatCard
              label="Needs Improvement"
              value={improvementCount}
              description="Topics below 70%"
              icon="!"
              iconClass="bg-orange-100 text-orange-600"
            />

          </div>


          {/* ==================================================
              MAIN PERFORMANCE GRID
          ================================================== */}

         <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">


            {/* =================================================
                GOOD AT
            ================================================= */}

            <div className="xl:col-span-1 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/30">

              <div className="border-b border-emerald-100 bg-emerald-50/60 px-5 py-4">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg font-bold text-emerald-600">
                      ✓
                    </div>

                    <div>

                      <h4 className="font-bold text-gray-900">
                        Strong
                      </h4>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Your strongest topics
                      </p>

                    </div>

                  </div>


                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-600 shadow-sm">
                    {strongCount}
                  </span>

                </div>

              </div>


              <div className="space-y-3 p-4">

                {goodTopics.length > 0 ? (

                  goodTopics.map(
                    (topic, index) => (

                      <TopicRow
                        key={
                          topic.id ||
                          topic.name ||
                          index
                        }
                        topic={
                          topic
                        }
                        rank={
                          index + 1
                        }
                      />

                    )
                  )

                ) : (

                  <div className="py-8 text-center">

                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                      ✓
                    </div>

                    <p className="text-sm font-medium text-gray-600">
                      No strong topics yet
                    </p>

                  </div>

                )}

              </div>

            </div>


            {/* =================================================
                NEEDS IMPROVEMENT
            ================================================= */}

           <div className="xl:col-span-1 overflow-hidden rounded-2xl border border-orange-100 bg-orange-50/30">

              <div className="border-b border-orange-100 bg-orange-50/60 px-5 py-4">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-lg font-bold text-orange-600">
                      !
                    </div>

                    <div>

                      <h4 className="font-bold text-gray-900">
                        Weak
                      </h4>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Topics that need more practice
                      </p>

                    </div>

                  </div>


                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-orange-600 shadow-sm">
                    {improvementCount}
                  </span>

                </div>

              </div>


              <div className="space-y-3 p-4">

                {improvementTopics.length > 0 ? (

                  improvementTopics.map(
                    (topic, index) => (

                      <TopicRow
                        key={
                          topic.id ||
                          topic.name ||
                          index
                        }
                        topic={
                          topic
                        }
                        rank={
                          index + 1
                        }
                      />

                    )
                  )

                ) : (

                  <div className="py-8 text-center">

                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                      ✓
                    </div>

                    <p className="text-sm font-medium text-gray-600">
                      Great job!
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      No major improvement areas.
                    </p>

                  </div>

                )}

              </div>

            </div>


            {/* =================================================
                RADAR CHART
            ================================================= */}

            <div className="xl:col-span-1 rounded-2xl border border-gray-100 bg-white">

              <div className="border-b border-gray-100 px-5 py-4">

                <h4 className="font-bold text-gray-900">
                  Performance
                </h4>

                <p className="mt-1 text-xs text-gray-500">
                  Topic overview
                </p>

              </div>

              <div className="p-3">

                <RadarChart
                  topics={
                    allTopics
                  }
                />

              </div>

            </div>

          </div>


          {/* ==================================================
              PERFORMANCE SUMMARY
          ================================================== */}

          {totalTopics > 0 && (

            <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/70 px-5 py-4">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-sm font-semibold text-gray-700">
                    Performance Summary
                  </p>

                  <p className="mt-0.5 text-xs text-gray-400">
                    {strongCount} of{" "}
                    {totalTopics} topics
                    are currently above the
                    70% target.
                  </p>

                </div>


                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 sm:w-48">

                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        (
                          strongCount /
                          totalTopics
                        ) *
                          100,
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>

            </div>

          )}

        </>

      )}

    </section>

  );
}