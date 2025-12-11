export default function Tabs({ testType, setTestType, activeReportTab, setActiveReportTab }) {
  return (
    <div style={{ width: "100%" }}>

      {/* TEST TYPE TABS */}
      <div
        className="test-type-tabs"
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
      >
        <button
          className={`custom-tab ${testType === "fullLength" ? "active" : ""}`}
          onClick={() => setTestType("fullLength")}
        >
          Full Length Test
        </button>

        <button
          className={`custom-tab ${testType === "practiceTest" ? "active" : ""}`}
          onClick={() => setTestType("practiceTest")}
        >
          Practice Test
        </button>
      </div>

      {/* REPORT TABS */}
      <div
        className="report-buttons"
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
      >
        <button
          className={`custom-tab ${activeReportTab === "subject" ? "active" : ""}`}
          onClick={() => setActiveReportTab("subject")}
        >
          Subject Wise Report
        </button>

        <button
          className={`custom-tab ${activeReportTab === "english" ? "active" : ""}`}
          onClick={() => setActiveReportTab("english")}
        >
          English Topic Wise Report
        </button>

        <button
          className={`custom-tab ${activeReportTab === "math" ? "active" : ""}`}
          onClick={() => setActiveReportTab("math")}
        >
          Math Topic Wise Report
        </button>
      </div>

      {/* INLINE CSS */}
      <style jsx>{`
        .custom-tab {
          background: #f3f3f3;
          color: #444;
          padding: 10px 20px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          transition: 0.25s;
          font-weight: 500;
          margin: 0 5px;
        }

        .custom-tab:hover {
          background: #e5e5e5;
        }

        .custom-tab.active {
          background: #f59403; /* ORANGE */
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}
