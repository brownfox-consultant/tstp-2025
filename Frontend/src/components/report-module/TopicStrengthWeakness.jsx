import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
);


// =====================================================
// BUILD TOPIC PERFORMANCE FROM ALL SECTIONS
// =====================================================

const getTopicPerformance = (sections = []) => {
  const topicMap = {};

  if (!Array.isArray(sections)) {
    return [];
  }

  // Merge ALL sections
  sections.forEach((section) => {
    const questions = section?.questions_data || [];

    questions.forEach((q) => {
      const topic =
        typeof q?.topic === "string" &&
        q.topic.trim()
          ? q.topic.trim()
          : "Unknown";

      if (!topicMap[topic]) {
        topicMap[topic] = {
          total: 0,
          correct: 0,
          incorrect: 0,
          blank: 0,
        };
      }

      topicMap[topic].total += 1;

      // Blank / skipped
      if (
        q?.is_skipped === true ||
        q?.is_blank === true ||
        q?.result === null ||
        q?.result === undefined
      ) {
        topicMap[topic].blank += 1;
      }

      // Correct
      else if (q?.result === true) {
        topicMap[topic].correct += 1;
      }

      // Incorrect
      else {
        topicMap[topic].incorrect += 1;
      }
    });
  });

  return Object.entries(topicMap)
    .map(([topic, stats]) => {

      const answered =
        stats.correct + stats.incorrect;

      const accuracy =
        answered > 0
          ? Math.round(
              (stats.correct / answered) * 100
            )
          : 0;

      return {
        topic,
        ...stats,
        answered,
        accuracy,
      };
    })
    .sort((a, b) => b.accuracy - a.accuracy);
};


// =====================================================
// COMPONENT
// =====================================================

const TopicStrengthWeakness = ({
  sections = [],
}) => {

  const topicPerformance =
    getTopicPerformance(sections);


  // ===================================================
  // STRONG / WEAK
  // ===================================================

  const strongTopics =
    topicPerformance.filter(
      (topic) =>
        topic.answered > 0 &&
        topic.accuracy >= 70
    );

  const weakTopics =
    topicPerformance.filter(
      (topic) =>
        topic.answered > 0 &&
        topic.accuracy < 70
    );


  // ===================================================
  // COUNTS
  // ===================================================

  const strongCount = strongTopics.length;
  const weakCount = weakTopics.length;

  const totalTopicCount =
    strongCount + weakCount;


  // ===================================================
  // PIE DATA
  // ===================================================

  const pieData = {
    labels: [
      "Strong At",
      "Needs Improvement",
    ],

    datasets: [
      {
        data: [
          strongCount,
          weakCount,
        ],

        backgroundColor: [
          "#22c55e",
          "#ef4444",
        ],

        borderColor: "#ffffff",

        borderWidth: 4,

        hoverOffset: 8,
      },
    ],
  };


  // ===================================================
  // PIE OPTIONS
  // ===================================================

  const pieOptions = {

    responsive: true,

    maintainAspectRatio: false,

    cutout: "58%",

    plugins: {

      legend: {
        display: false,
      },

      tooltip: {

        callbacks: {

          label: (context) => {

            const value =
              Number(context.raw || 0);

            const total =
              context.dataset.data.reduce(
                (sum, item) =>
                  sum + Number(item || 0),
                0
              );

            const percentage =
              total > 0
                ? Math.round(
                    (value / total) * 100
                  )
                : 0;

            return `${context.label}: ${value} topics (${percentage}%)`;
          },
        },
      },

      datalabels: {

        formatter: (
          value,
          context
        ) => {

          const total =
            context.dataset.data.reduce(
              (sum, item) =>
                sum + Number(item || 0),
              0
            );

          if (!total || !value) {
            return "";
          }

          const percentage =
            Math.round(
              (Number(value) / total) * 100
            );

          return `${percentage}%`;
        },

        color: "#ffffff",

        font: {
          weight: "bold",
          size: 13,
        },

        anchor: "center",

        align: "center",
      },
    },
  };


  // ===================================================
  // NO DATA
  // ===================================================

  if (totalTopicCount === 0) {

    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">

        <h3 className="text-lg font-bold text-gray-800">
          Topic Analysis
        </h3>

        <p className="text-sm text-gray-400 mt-2">
          No topic data available.
        </p>

      </div>
    );
  }


  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">


      {/* =================================================
          HEADER
      ================================================== */}

      <div className="flex items-center gap-2 mb-5">

        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">

          <svg
            className="w-4 h-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
            />

          </svg>

        </div>


        <div>

          <h3 className="text-lg font-bold text-gray-800">
            Topic Analysis
          </h3>

          <p className="text-xs text-gray-500">
            Combined English Section A &amp; B performance
          </p>

        </div>

      </div>


      {/* =================================================
          PIE + STRONG / WEAK TOPICS
      ================================================== */}

      <div className="flex flex-col lg:flex-row gap-6 items-center">


        {/* =================================================
            PIE CHART
        ================================================== */}

        <div className="w-full lg:w-[280px] h-[260px] flex-shrink-0">

          <Pie
            data={pieData}
            options={pieOptions}
          />

        </div>


        {/* =================================================
            STRONG / WEAK LEGEND
        ================================================== */}

        <div className="flex-1 w-full">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">


            {/* =================================================
                STRONG SUMMARY
            ================================================== */}

            <div className="rounded-xl border border-green-100 bg-green-50 p-4">

              <div className="flex items-center justify-between mb-2">

                <div className="flex items-center gap-2">

                  <span className="w-3 h-3 rounded-full bg-green-500" />

                  <span className="text-sm font-semibold text-green-800">
                    Strong At
                  </span>

                </div>

                <span className="text-lg font-black text-green-700">
                  {strongCount}
                </span>

              </div>

              <p className="text-[11px] text-green-600 mb-3">
                Accuracy 70% and above
              </p>


              {/* Strong topics */}

              <div className="space-y-2">

                {strongTopics.length > 0 ? (

                  strongTopics.map(
                    (item, index) => (

                      <div
                        key={`${item.topic}-${index}`}
                        className="bg-white rounded-lg px-3 py-2 border border-green-100"
                      >

                        <div className="flex items-center justify-between gap-2">

                          <span
                            className="text-xs text-gray-700 truncate"
                            title={item.topic}
                          >
                            {item.topic}
                          </span>

                          <span className="text-xs font-bold text-green-600">
                            {item.accuracy}%
                          </span>

                        </div>

                        <div className="text-[10px] text-gray-400 mt-1">

                          {item.correct} correct /{" "}
                          {item.answered} answered

                        </div>

                      </div>

                    )
                  )

                ) : (

                  <div className="text-xs text-gray-400">
                    No strong topics
                  </div>

                )}

              </div>

            </div>


            {/* =================================================
                WEAK SUMMARY
            ================================================== */}

            <div className="rounded-xl border border-red-100 bg-red-50 p-4">

              <div className="flex items-center justify-between mb-2">

                <div className="flex items-center gap-2">

                  <span className="w-3 h-3 rounded-full bg-red-500" />

                  <span className="text-sm font-semibold text-red-800">
                    Weak At
                  </span>

                </div>

                <span className="text-lg font-black text-red-700">
                  {weakCount}
                </span>

              </div>

              <p className="text-[11px] text-red-600 mb-3">
                Accuracy below 70%
              </p>


              {/* Weak topics */}

              <div className="space-y-2">

                {weakTopics.length > 0 ? (

                  weakTopics.map(
                    (item, index) => (

                      <div
                        key={`${item.topic}-${index}`}
                        className="bg-white rounded-lg px-3 py-2 border border-red-100"
                      >

                        <div className="flex items-center justify-between gap-2">

                          <span
                            className="text-xs text-gray-700 truncate"
                            title={item.topic}
                          >
                            {item.topic}
                          </span>

                          <span className="text-xs font-bold text-red-600">
                            {item.accuracy}%
                          </span>

                        </div>

                        <div className="text-[10px] text-gray-400 mt-1">

                          {item.correct} correct /{" "}
                          {item.answered} answered

                        </div>

                      </div>

                    )
                  )

                ) : (

                  <div className="text-xs text-gray-400">
                    No topics need improvement
                  </div>

                )}

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default TopicStrengthWeakness;