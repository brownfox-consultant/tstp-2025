"use client";

import React from "react";
import PracticeDonut from "./PracticeDonut";
import AccuracyChart from "./AccuracyChart";
import TimeCompact from "./TimeCompact";
import Heatmap from "./Heatmap";

export default function TopicWiseReport({ title, practice, accuracy, timeMetrics, heatmapData }) {
  return (
    <div className="topic-report-container">
      <h2 style={{ textAlign: "center", marginBottom: "15px" }}>{title}</h2>

      <div className="data-grid-v2">
        <PracticeDonut practice={practice} />
        <AccuracyChart accuracy={accuracy} />
        <TimeCompact timeMetrics={timeMetrics} />
        <Heatmap dateWise={heatmapData} />
      </div>
    </div>
  );
}
