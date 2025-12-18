import React from "react";

function FullLengthTestIcon({ className = "", style = {} }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Clipboard base */}
      <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H14" />
      
      {/* Clipboard top clip */}
      <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V6H9V5Z" />
      <path d="M15 5H17C18.1046 5 19 5.89543 19 7V10" />
      
      {/* Checklist item 1 */}
      <rect x="8" y="9" width="2" height="2" rx="0.5" />
      <line x1="12" y1="10" x2="16" y2="10" />
      
      {/* Checklist item 2 */}
      <rect x="8" y="13" width="2" height="2" rx="0.5" />
      <line x1="12" y1="14" x2="14" y2="14" />
      
      {/* Checklist item 3 */}
      <rect x="8" y="17" width="2" height="2" rx="0.5" />
      <line x1="12" y1="18" x2="14" y2="18" />
      
      {/* Pencil */}
      <path d="M18 12L21 15L17 19L14 19L14 16L18 12Z" />
      <line x1="17" y1="13" x2="20" y2="16" />
    </svg>
  );
}

export default FullLengthTestIcon;
