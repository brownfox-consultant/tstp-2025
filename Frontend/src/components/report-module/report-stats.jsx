import React from "react";
import RingChart from "./ring-chart";

function ReportStats({ sectionData }) {
  // Always default to {} if the property is missing
  const {
    areas_of_focus = {},
    areas_of_strength = {},
  } = sectionData || {};

  return (
    <div className="w-full my-10">
      <div className="text-4xl border-b mb-5 pb-3">
        Now let's look at what to do next:
      </div>

      <div className="flex my-2 gap-2 h-44">
        {/* Strength Section */}
        <div className="flex-grow border-r">
          <div>
            <div className="font-medium text-2xl">Areas of Strength</div>
            <div className="font-light">
              Based on this exam, here's where you're scoring well:
            </div>

            {Object.entries(areas_of_strength ?? {}).map(([key, value]) => (
              <div
                key={key}
                className="my-2 line-clamp-2 uppercase font-light flex items-center gap-2"
              >
                <RingChart data={value} />
                <span>{key}</span>
              </div>
            ))}

            {Object.keys(areas_of_strength ?? {}).length === 0 && (
              <div className="text-sm text-gray-400 italic mt-2">
                No strengths identified yet.
              </div>
            )}
          </div>
        </div>

        {/* Focus Section */}
        <div className="flex-grow">
          <div>
            <div className="font-medium text-2xl">Areas of Focus</div>
            <div className="font-light">
              Based on this exam, here's where you can improve:
            </div>

            {Object.entries(areas_of_focus ?? {}).map(([key, value]) => (
              <div
                key={key}
                className="my-2 line-clamp-2 uppercase font-light flex items-center gap-2"
              >
                <RingChart data={value} />
                <span>{key}</span>
              </div>
            ))}

            {Object.keys(areas_of_focus ?? {}).length === 0 && (
              <div className="text-sm text-gray-400 italic mt-2">
                No focus areas identified yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportStats;
