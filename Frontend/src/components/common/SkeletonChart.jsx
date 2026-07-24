"use client";
import React from "react";

export default function SkeletonChart({ height = "320px", className = "" }) {
  return (
    <div className={`w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse flex flex-col justify-between ${className}`} style={{ height }}>
      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={`metric-${idx}`} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-300 rounded w-3/4"></div>
          </div>
        ))}
      </div>

      {/* Chart Canvas Skeleton */}
      <div className="flex-1 flex items-end gap-3 px-4 pt-4 border-b border-l border-gray-200">
        {[40, 65, 30, 85, 50, 75, 90, 60, 45, 80].map((h, i) => (
          <div key={`bar-${i}`} className="flex-1 flex flex-col items-center justify-end h-full">
            <div 
              className="w-full bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-md" 
              style={{ height: `${h}%` }}
            ></div>
            <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
