import React, { useMemo, useState } from 'react';
import '@/app/student/[id]/(base-layout)/report/Dashboard.css';
import { PieChart, Pie, Cell, Legend } from "recharts";


// TSTP palette
const COLORS = {
  ORANGE: '#F59403',
  LIGHT_ORANGE: '#FFD36A',
  DARK_BROWN: '#2E2725',
  MID_BROWN: '#8D5B30',
  BLUE: '#0071BC',
  CYAN: '#70D9E4',
};


// Icons
const PracticeIcon = () => (
  <svg className="data-icon" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
    />
  </svg>
);

const AccuracyIcon = () => (
  <svg className="data-icon" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 14l-4-4 1.41-1.41L11 13.17l4.59-4.58L17 10l-6 6z"
    />
  </svg>
);

const TimeIcon = () => (
  <svg className="data-icon" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.24 14.24L11 11.41V7h2v3.59l4.59 4.59-1.35 1.35z"
    />
  </svg>
);

/**
 * Example data structure.
 * Replace these with API results for each student.
 */
const reportData = {
  fullLength: {
    subjects: [
      {
        name: 'English',
        practicedQuestions: 65,
        totalQuestionsInDb: 100,
        rightQuestions: 78,
        totalAttempted: 90,
        totalTimeSeconds: 280, // total time spent till now
      },
      {
        name: 'Math',
        practicedQuestions: 35,
        totalQuestionsInDb: 100,
        rightQuestions: 52,
        totalAttempted: 80,
        totalTimeSeconds: 420,
      },
    ],
    dateWiseTime: [
      // total seconds per day (for current month, sample)
      { dayLabel: '1', seconds: 120 },
      { dayLabel: '2', seconds: 0 },
      { dayLabel: '3', seconds: 300 },
      { dayLabel: '4', seconds: 480 },
      { dayLabel: '5', seconds: 60 },
      { dayLabel: '6', seconds: 0 },
      { dayLabel: '7', seconds: 900 },
      { dayLabel: '8', seconds: 240 },
      { dayLabel: '9', seconds: 120 },
      { dayLabel: '10', seconds: 60 },
      { dayLabel: '11', seconds: 0 },
      { dayLabel: '12', seconds: 420 },
      { dayLabel: '13', seconds: 180 },
      { dayLabel: '14', seconds: 600 },
    ],
  },
  practiceTest: {
    subjects: [
      {
        name: 'English',
        practicedQuestions: 45,
        totalQuestionsInDb: 100,
        rightQuestions: 60,
        totalAttempted: 80,
        totalTimeSeconds: 210,
      },
      {
        name: 'Math',
        practicedQuestions: 55,
        totalQuestionsInDb: 100,
        rightQuestions: 58,
        totalAttempted: 90,
        totalTimeSeconds: 360,
      },
    ],
    dateWiseTime: [
      { dayLabel: '1', seconds: 60 },
      { dayLabel: '2', seconds: 20 },
      { dayLabel: '3', seconds: 300 },
      { dayLabel: '4', seconds: 0 },
      { dayLabel: '5', seconds: 600 },
      { dayLabel: '6', seconds: 90 },
      { dayLabel: '7', seconds: 480 },
      { dayLabel: '8', seconds: 0 },
    ],
  },
};

// helper: subject -> palette colors
const subjectColors = {
  English: {
    practice: COLORS.ORANGE,
    accuracy: COLORS.BLUE,
  },
  Math: {
    practice: COLORS.LIGHT_ORANGE,
    accuracy: COLORS.CYAN,
  },
};

const circumference = 2 * Math.PI * 50; // r = 50 for donut

function formatTotalTime(seconds) {
  const mins = Math.round(seconds / 60);
  return `${seconds}s / ${mins}min`;
}

function levelForSeconds(seconds) {
  // 0 = none, 1 = low, 2 = medium, 3 = high
  if (seconds === 0) return 0;
  if (seconds < 180) return 1; // < 3 min
  if (seconds < 600) return 2; // < 10 min
  return 3;
}

function Dashboard() {
  const [testType, setTestType] = useState('fullLength');
  const [activeReportTab, setActiveReportTab] = useState('subject');

  const activeData = testType === 'fullLength'
    ? reportData.fullLength
    : reportData.practiceTest;

  // Subject wise practice (percentage of DB covered)
  const practice = useMemo(
    () =>
      activeData.subjects.map((subj) => {
        const percent =
          subj.totalQuestionsInDb > 0
            ? (subj.practicedQuestions / subj.totalQuestionsInDb) * 100
            : 0;
        return {
          subject: subj.name,
          percent: Math.round(percent),
          color: subjectColors[subj.name]?.practice || COLORS.ORANGE,
        };
      }),
    [activeData]
  );

  // Accuracy ((right / total attempted) * 100)
  const accuracy = useMemo(
    () =>
      activeData.subjects.map((subj) => {
        const value =
          subj.totalAttempted > 0
            ? (subj.rightQuestions / subj.totalAttempted) * 100
            : 0;
        return {
          subject: subj.name,
          value: Math.round(value),
          color: subjectColors[subj.name]?.accuracy || COLORS.BLUE,
        };
      }),
    [activeData]
  );

  // Time metrics: avg time per question + total time spent
  const timeMetrics = useMemo(
    () =>
      activeData.subjects.map((subj) => {
        const avgSeconds =
          subj.totalAttempted > 0
            ? subj.totalTimeSeconds / subj.totalAttempted
            : 0;

        return {
          subject: subj.name,
          avgSeconds: Math.round(avgSeconds),
          totalSeconds: subj.totalTimeSeconds,
          borderColor: subjectColors[subj.name]?.practice || COLORS.ORANGE,
        };
      }),
    [activeData]
  );

  // donut will show total practice % of first subject (like sample design)
  const primarySubject = practice[0];
  const donutOffset =
    primarySubject && primarySubject.percent
      ? circumference - (primarySubject.percent / 100) * circumference
      : circumference;

  return (
    <div className="dashboard-container">
      <div className="header-section">
        <h2 className="welcome-title">Welcome back, Shail</h2>
        <p className="student-info">Student Dashboard &amp; Report Analysis</p>
      </div>

      {/* Full Length vs Practice Test */}
      <div className="test-type-tabs"  style={{
  
  alignItems: "center",
  justifyContent: "center",
}}>
        <button
          className={
            'test-type-tab ' +
            (testType === 'fullLength' ? 'active' : '')
          }
          onClick={() => setTestType('fullLength')}
        >
          Full Length Test
        </button>
        <button
          className={
            'test-type-tab ' +
            (testType === 'practiceTest' ? 'active' : '')
          }
          onClick={() => setTestType('practiceTest')}
        >
          Practice Test
        </button>
      </div>

      {/* Report-level tabs (for future: subject-wise / topic-wise) */}
      <div className="report-buttons">
        <button
          className={
            'report-button ' + (activeReportTab === 'subject' ? 'active' : '')
          }
          onClick={() => setActiveReportTab('subject')}
        >
          Subject Wise Report
        </button>
        <button
          className={
            'report-button ' + (activeReportTab === 'english' ? 'active' : '')
          }
          onClick={() => setActiveReportTab('english')}
        >
          English Topic Wise Report
        </button>
        <button
          className={
            'report-button ' + (activeReportTab === 'math' ? 'active' : '')
          }
          onClick={() => setActiveReportTab('math')}
        >
          Math Topic Wise Report
        </button>
      </div>

      {/* SUBJECT WISE REPORT GRID (shown when subject tab active) */}
      {activeReportTab === 'subject' && (
        <div className="data-grid-v2">
          {/* Card 1: Subject Wise Practice (donut + legend) */}
          <div className="data-card practice-card">
            <h3 className="card-title">
              <PracticeIcon /> Subject Wise Practice
            </h3>
            <div className="practice-content">
             
   <div style={{ display: "flex", gap: "20px" }}>

  {/* ---------- ENGLISH DONUT ---------- */}
  <PieChart width={150} height={150}>
    <Pie
      data={[{ name: "EN", value: practice[0].percent }]}
      cx="50%"
      cy="50%"
      innerRadius={45}
      outerRadius={60}
      startAngle={90}
      endAngle={-270}
      dataKey="value"
    >
      <Cell fill={COLORS.ORANGE} />
    </Pie>

    <text
      x={75}
      y={70}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="16"
      fontWeight="700"
      fill="#2E2725"
    >
      EN
    </text>

    <text
      x={75}
      y={90}
      textAnchor="middle"
      fontSize="13"
      fontWeight="600"
    >
      {practice[0].percent}%
    </text>
  </PieChart>

  {/* ---------- MATH DONUT ---------- */}
  <PieChart width={150} height={150}>
    <Pie
      data={[{ name: "MA", value: practice[1].percent }]}
      cx="50%"
      cy="50%"
      innerRadius={45}
      outerRadius={60}
      startAngle={90}
      endAngle={-270}
      dataKey="value"
    >
      <Cell fill={COLORS.LIGHT_ORANGE} />
    </Pie>

    <text
      x={75}
      y={70}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="16"
      fontWeight="700"
      fill="#2E2725"
    >
      MA
    </text>

    <text
      x={75}
      y={90}
      textAnchor="middle"
      fontSize="13"
      fontWeight="600"
    >
      {practice[1].percent}%
    </text>
  </PieChart>

</div>




              <div className="practice-labels">
                {practice.map((p) => (
                  <div
                    key={p.subject}
                    className="subject-label"
                    style={{ '--subject-color': p.color }}
                  >
                    <span className="label-dot" />
                    <span className="subject-name">{p.subject}</span>
                    <span className="label-percent">
                      {p.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

     

<div className="data-card accuracy-card">
  <h3 className="card-title" style={{ textAlign: "center" }}>
    Subject Wise Accuracy
  </h3>

  <div className="accuracy-grid">

    {/* Y-axis + horizontal lines */}
    <div className="accuracy-y-axis">
      {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map((n) => (
        <div key={n} className="accuracy-y-row">
          <span>{n}%</span>
          <div className="accuracy-y-line"></div>
        </div>
      ))}
    </div>

    {/* Bars */}
    <div className="accuracy-bars-area">
      {accuracy.map((item) => (
        <div key={item.subject} className="acc-bar-col">

          <div className="acc-bar-wrapper">
            <div
              className="acc-bar"
              style={{
                height: `${item.value}%`,
                background: item.color,
              }}
            ></div>
          </div>

          <span className="acc-bar-label">{item.subject}</span>
        </div>
      ))}
    </div>
  </div>

  {/* Legend */}
  <div className="acc-legend">
    {accuracy.map((item) => (
      <div key={item.subject} className="acc-legend-row">
        
       
      </div>
    ))}
  </div>
</div>




         {/* Card 3: Avg Time Per Q + Total Time Spent (UP–DOWN Layout) */}
<div className="data-card time-compact-card">
  <h3 className="card-title">
    <TimeIcon /> Avg. Time Per Que. & Total Time Spent
  </h3>

  <div className="compact-time-section">

    {/* TOP: Average Time per Question */}
    <div className="compact-block">
      <h4 className="compact-title avg-title">Average Time per Question</h4>

      {timeMetrics.map((t) => {
        const widthPercent = Math.min((t.avgSeconds / 100) * 100, 100);
        return (
          <div key={t.subject} className="compact-row">
            <span className="compact-label">{t.subject}</span>

            <div className="compact-bar-track">
              <div
                className="compact-bar-fill"
                style={{
                  width: `${widthPercent}%`,
                  background: t.borderColor,
                }}
              >
                <span className="compact-bar-text">{t.avgSeconds}s</span>
              </div>
            </div>
          </div>
        );
      })}

      <div className="compact-number-line">
        {Array.from({ length: 11 }).map((_, i) => (
          <span key={i}>{i * 10}</span>
        ))}
      </div>
    </div>

    {/* BOTTOM: Total Time Spent */}
    <div className="compact-block">
      <h4 className="compact-title total-title">Total Time Spent</h4>

      {timeMetrics.map((t) => {
        const widthPercent = Math.min((t.totalSeconds / 600) * 100, 100); 
        // 600s = 10min max scale (adjust anytime)

        return (
          <div key={t.subject} className="compact-row">
            <span className="compact-label">{t.subject}</span>

            <div className="compact-bar-track">
              <div
                className="compact-bar-fill"
                style={{
                  width: `${widthPercent}%`,
                  background: t.borderColor,
                }}
              >
                <span className="compact-bar-text-small">
                  {formatTotalTime(t.totalSeconds)}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      <div className="compact-number-line">
        {Array.from({ length: 11 }).map((_, i) => (
          <span key={i}>{i * 10}</span>
        ))}
      </div>
    </div>

  </div>
</div>





          {/* Card 4: Date-wise Time Spent (heatmap) */}
          <div className="data-card calendar-card">
            <h3 className="card-title">
              <TimeIcon /> Date-wise Time Spent (This Month)
            </h3>
            <div className="calendar-heatmap">
              {activeData.dateWiseTime.map((d) => (
                <div
                  key={d.dayLabel}
                  className="heatmap-cell"
                  data-level={levelForSeconds(d.seconds)}
                  title={`${d.seconds}s on day ${d.dayLabel}`}
                >
                  {d.dayLabel}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NOTE:
         You can render the Topic-wise (English/Math) reports here
         when activeReportTab !== 'subject'.
         For now they are left empty as per your existing implementation.
      */}
    </div>
  );
}

export default Dashboard;
