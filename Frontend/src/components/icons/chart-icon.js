import React from "react";

function ChartIcon({ className = "", style = {} }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="12" width="4" height="9" rx="1" fill="white" />
      <rect x="10" y="8" width="4" height="13" rx="1" fill="white" />
      <rect x="17" y="4" width="4" height="17" rx="1" fill="white" />
      <circle cx="5" cy="9" r="2" fill="white" />
      <circle cx="12" cy="5" r="2" fill="white" />
      <circle cx="19" cy="2" r="2" fill="white" />
      <path
        d="M5 9L12 5L19 2"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default ChartIcon;
