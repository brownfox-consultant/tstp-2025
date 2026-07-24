"use client";
import React from "react";

export default function SkeletonTable({ rows = 5, columns = 4, className = "" }) {
  return (
    <div className={`w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm animate-pulse ${className}`}>
      {/* Table Header Skeleton */}
      <div className="flex items-center border-b border-gray-200 bg-gray-50/80 px-6 py-4">
        {Array.from({ length: columns }).map((_, idx) => (
          <div key={`head-${idx}`} className="flex-1 px-3">
            <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
          </div>
        ))}
      </div>

      {/* Table Rows Skeleton */}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={`row-${rowIdx}`} className="flex items-center px-6 py-4 hover:bg-gray-50/50 transition-colors">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div key={`col-${rowIdx}-${colIdx}`} className="flex-1 px-3">
                <div 
                  className="h-4 bg-gray-200 rounded-md" 
                  style={{ width: `${Math.max(40, Math.floor(Math.sin(rowIdx + colIdx) * 30 + 60))}%` }}
                ></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
