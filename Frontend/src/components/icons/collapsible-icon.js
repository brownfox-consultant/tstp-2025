import React from "react";

function CollapsibleIcon({ className }) {
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="6" fill="#FFF5E5" />
      <path
        d="M17 11V29M13 11H27C28.1046 11 29 11.8954 29 13V27C29 28.1046 28.1046 29 27 29H13C11.8954 29 11 28.1046 11 27V13C11 11.8954 11.8954 11 13 11Z"
        stroke="#F59403"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default CollapsibleIcon;
