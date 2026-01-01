"use client";

import { useState } from "react";

export default function PracticeDonut({ practice }) {
  // Default data when no practice data available
  const defaultPractice = [
    { subject: "English", percent: 0, color: "#FFD36A" },
    { subject: "Math", percent: 0, color: "#F7931E" },
  ];

  // Use practice data if available, otherwise use default
  const displayData = practice && practice.length > 0 ? practice : defaultPractice;

  return (
    <div className="card-layout">
      {/* TITLE */}
      <h3 className="text-[18px] font-bold text-[#333] mb-5">
        Subject Practice Progress
      </h3>

      {/* CHARTS CONTAINER (FLEX) */}
      <div className="flex justify-center items-center flex-wrap gap-[60px] max-[1630px]:gap-[40px] max-[1310px]:gap-[30px]">
        {displayData.map((item, index) => {
          const percent = item.percent;

          const waveHeight = 180 - (percent / 100) * 160; 

          return (
            <div key={index} className="flex flex-col items-center">
              <svg 
                className="w-[240px] h-[240px] transition-all duration-300 ease-in-out max-[1630px]:w-[170px] max-[1630px]:h-[170px] max-[1310px]:w-[160px] max-[1310px]:h-[160px]  max-[1200px]:w-[200px] max-[1200px]:h-[200px]"
                viewBox="0 0 200 200"
              >
                <defs>
                  {/* Clip path for circle */}
                  <clipPath id={`circleClip-${index}`}>
                    <circle cx="100" cy="100" r="85" />
                  </clipPath>

                  {/* Gradient for wave */}
                  <linearGradient id={`waveGradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFE5B4" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#FFD36A" stopOpacity="1" />
                  </linearGradient>
                </defs>

                {/* Outer circle border */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#FFD36A"
                  strokeWidth="3"
                />

                {/* Inner white background */}
                <circle cx="100" cy="100" r="85" fill="#fff" />

                {/* Wave fill */}
                <g clipPath={`url(#circleClip-${index})`}>
                  <path
                    d={`
                      M 0 ${waveHeight}
                      Q 25 ${waveHeight - 15} 50 ${waveHeight}
                      T 100 ${waveHeight}
                      T 150 ${waveHeight}
                      T 200 ${waveHeight}
                      L 200 200
                      L 0 200
                      Z
                    `}
                    fill={`url(#waveGradient-${index})`}
                  >
                    {/* Wave animation */}
                    <animate
                      attributeName="d"
                      dur="3s"
                      repeatCount="indefinite"
                      values={`
                        M 0 ${waveHeight} Q 25 ${waveHeight - 12} 50 ${waveHeight} T 100 ${waveHeight} T 150 ${waveHeight} T 200 ${waveHeight} L 200 200 L 0 200 Z;
                        M 0 ${waveHeight} Q 25 ${waveHeight + 12} 50 ${waveHeight} T 100 ${waveHeight} T 150 ${waveHeight} T 200 ${waveHeight} L 200 200 L 0 200 Z;
                        M 0 ${waveHeight} Q 25 ${waveHeight - 12} 50 ${waveHeight} T 100 ${waveHeight} T 150 ${waveHeight} T 200 ${waveHeight} L 200 200 L 0 200 Z
                      `}
                    />
                  </path>
                </g>

                {/* Percentage text */}
                <text
                  x="100"
                  y="110"
                  textAnchor="middle"
                  className="text-[42px] font-bold fill-[#333]"
                >
                  {percent}%
                </text>
              </svg>

              {/* Subject label below circle */}
              <div className="mt-2.5 text-[20px] font-bold text-[#F7931E] max-[1630px]:text-[18px]">
                {item.subject}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
