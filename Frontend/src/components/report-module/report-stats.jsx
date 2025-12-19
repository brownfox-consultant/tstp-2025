import React from "react";
import RingChart from "./ring-chart";

function ReportStats({ sectionData }) {
  // Always default to {} if the property is missing
  const {
    areas_of_focus = {},
    areas_of_strength = {},
  } = sectionData || {};

  return (
    <div className="w-full bg-white rounded-2xl p-6 shadow-md border border-gray-100">
      {/* Header */}
      <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-6">
        Now let's look at what to do next:
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Strength Section */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">Areas of Strength</h3>
          <p className="text-sm text-gray-500 mb-4">
            Based on this exam, here's where you're scoring well:
          </p>

          {Object.entries(areas_of_strength ?? {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(areas_of_strength).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="uppercase text-sm font-semibold text-green-700">{key}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No strengths identified yet.
            </p>
          )}
        </div>

        {/* Focus Section */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">Areas of Focus</h3>
          <p className="text-sm text-gray-500 mb-4">
            Based on this exam, here's where you can improve:
          </p>

          {Object.entries(areas_of_focus ?? {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(areas_of_focus).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100"
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    </svg>
                  </div>
                  <span className="uppercase text-sm font-semibold text-red-700">{key}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No focus areas identified yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportStats;
