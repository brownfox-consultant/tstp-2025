import React from "react";

function ReportTabs({ options, selectedValue, handleChange }) {
  return (
    <div className="flex gap-4 flex-wrap">
      {options.map((option) => (
        <div
          key={option.value}
          onClick={() => handleChange(option.value)}
          className="flex-1 md:min-w-[550px] min-w-full cursor-pointer"
        >
          {option.label}
        </div>
      ))}
    </div>
  );
}

export default ReportTabs;
