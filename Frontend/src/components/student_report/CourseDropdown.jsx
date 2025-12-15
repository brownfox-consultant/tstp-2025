"use client";

import { useState, useRef, useEffect } from "react";

export default function CourseDropdown({ coursesList, selectedCourse, setSelectedCourse }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get selected course name
  const selectedCourseName = coursesList.find((c) => c.id === selectedCourse)?.name || "Select Course";

  return (
    <div className="w-full relative" ref={dropdownRef}>
      {/* Label */}
      <label className="block text-sm font-medium text-amber-600 mb-2">
        Course
      </label>

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full
          flex items-center justify-between
          bg-white
          border-2
          ${isOpen ? "border-orange-400 ring-2 ring-orange-100" : "border-gray-300"}
          rounded-lg
          px-4 py-3
          text-gray-700
          text-base
          font-medium
          cursor-pointer
          transition-all
          duration-200
          hover:border-orange-400
          hover:shadow-md
          shadow-sm
        `}
      >
        <span>{selectedCourseName}</span>
        
        {/* Open/Close Arrow Icon */}
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border-2 border-orange-300 rounded-lg shadow-xl overflow-hidden">
          {coursesList.map((course) => {
            const isSelected = course.id === selectedCourse;
            return (
              <div
                key={course.id}
                onClick={() => {
                  setSelectedCourse(course.id);
                  setIsOpen(false);
                }}
                className={`
                  flex items-center justify-between
                  px-4 py-3
                  cursor-pointer
                  transition-all
                  duration-150
                  ${isSelected 
                    ? "bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold" 
                    : "text-gray-700 hover:bg-orange-50"
                  }
                `}
              >
                <span>{course.name}</span>
                
                {/* Checkmark for selected item */}
                {isSelected && (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
