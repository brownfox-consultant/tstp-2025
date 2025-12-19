"use client";
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: "Test 1",  Overall: 480, Math: 220, Reading: 260 },
  { name: "Test 2",  Overall: 510, Math: 250, Reading: 260 },
  { name: "Test 3",  Overall: 530, Math: 270, Reading: 260 },
  { name: "Test 4",  Overall: 495, Math: 235, Reading: 260 },
  { name: "Test 5",  Overall: 560, Math: 290, Reading: 270 },
  { name: "Test 6",  Overall: 450, Math: 210, Reading: 240 },
  { name: "Test 7",  Overall: 580, Math: 300, Reading: 280 },
  { name: "Test 8",  Overall: 520, Math: 260, Reading: 260 },
//   { name: "Test 9",  Overall: 490, Math: 230, Reading: 260 },
//   { name: "Test 10", Overall: 600, Math: 320, Reading: 280 },
//   { name: "Test 11", Overall: 540, Math: 280, Reading: 260 },
//   { name: "Test 12", Overall: 470, Math: 215, Reading: 255 },
//   { name: "Test 13", Overall: 610, Math: 330, Reading: 280 },
//   { name: "Test 14", Overall: 525, Math: 265, Reading: 260 },
//   { name: "Test 15", Overall: 505, Math: 245, Reading: 260 },
//   { name: "Test 16", Overall: 590, Math: 310, Reading: 280 },
//   { name: "Test 17", Overall: 460, Math: 200, Reading: 260 },
//   { name: "Test 18", Overall: 550, Math: 285, Reading: 265 },
//   { name: "Test 19", Overall: 575, Math: 295, Reading: 280 },
//   { name: "Test 20", Overall: 500, Math: 240, Reading: 260 },
];

const ITEMS_PER_PAGE = 7;

export default function ScoreAnalysis({ courseName = "Course" }) {
  const [startIndex, setStartIndex] = useState(0);
  
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, data.length);
  const displayData = data.slice(startIndex, endIndex);
  
  const canGoLeft = startIndex > 0;
  const canGoRight = endIndex < data.length;

  const handlePrev = () => {
    setStartIndex(Math.max(0, startIndex - ITEMS_PER_PAGE));
  };

  const handleNext = () => {
    setStartIndex(Math.min(data.length - ITEMS_PER_PAGE, startIndex + ITEMS_PER_PAGE));
  };

  return (
    <div className="space-y-8 animate-fadeIn mb-10">
       {/* Section 1: Score Trends (Bar Chart) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">{courseName} Analysis</h3>
            
            {/* Left Arrow */}
            {canGoLeft && (
                <button
                    onClick={handlePrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                </button>
            )}

            {/* Right Arrow */}
            {canGoRight && (
                <button
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                    </svg>
                </button>
            )}

            <div className="h-[400px] w-full flex justify-center px-12">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={displayData}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                        barGap={10}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#666', fontSize: 14, fontWeight: 500 }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            allowDecimals={false} 
                            domain={[0, 1600]} 
                            tick={{ fill: '#999', fontSize: 12 }}
                        />
                        <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="Overall" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} label={{ position: 'top', fill: '#3b82f6', fontSize: 12, fontWeight: 'bold' }} />
                        <Bar dataKey="Math" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={40} label={{ position: 'top', fill: '#818cf8', fontSize: 12, fontWeight: 'bold' }} />
                        <Bar dataKey="Reading" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} label={{ position: 'top', fill: '#10b981', fontSize: 12, fontWeight: 'bold' }} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            {/* Page Indicator */}
            <div className="flex justify-center items-center gap-2 mt-4">
                <span className="text-sm text-gray-500">
                    Showing {startIndex + 1}-{endIndex} of {data.length} tests
                </span>
            </div>
        </div>

        {/* Section 2: Summary Cards - Brand Colors UI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 - Percentage (Orange/Yellow theme) */}
            <div className="group relative p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ background: 'linear-gradient(135deg, #FFF8EB 0%, #FFF0D4 100%)' }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2" style={{ background: 'linear-gradient(135deg, rgba(245,148,3,0.2) 0%, rgba(255,211,106,0.3) 100%)' }}></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #F59403 0%, #FFD36A 100%)' }}>
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: '#805830' }}>{courseName} Percentage</h4>
                    <div className="text-5xl font-black" style={{ color: '#F59403' }}>74%</div>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: '74%', background: 'linear-gradient(90deg, #F59403 0%, #FFD36A 100%)' }}></div>
                    </div>
                </div>
            </div>

            {/* Card 2 - Highest Score (Blue/Cyan theme) */}
            <div className="group relative p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ background: 'linear-gradient(135deg, #E8F4FC 0%, #D4F1F9 100%)' }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2" style={{ background: 'linear-gradient(135deg, rgba(0,113,188,0.2) 0%, rgba(112,217,228,0.3) 100%)' }}></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #0071BC 0%, #70D9E4 100%)' }}>
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                    </div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: '#2E2725' }}>Highest Score in {courseName}</h4>
                    <div className="text-5xl font-black" style={{ color: '#0071BC' }}>1380</div>
                    <div className="text-lg font-medium mt-1" style={{ color: '#70D9E4' }}>out of 1600</div>
                    <div className="mt-3 flex items-center gap-2 text-sm font-medium" style={{ color: '#0071BC' }}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Personal Best
                    </div>
                </div>
            </div>

            {/* Card 3 - Score Improvement (Brown theme) */}
            <div className="group relative p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ background: 'linear-gradient(135deg, #FAF5F0 0%, #F5EBE0 100%)' }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2" style={{ background: 'linear-gradient(135deg, rgba(128,88,48,0.2) 0%, rgba(46,39,37,0.15) 100%)' }}></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #805830 0%, #2E2725 100%)' }}>
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: '#805830' }}>Score Improvement</h4>
                    <div className="flex items-center gap-2">
                        <svg className="w-8 h-8" fill="none" stroke="#805830" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        <span className="text-5xl font-black" style={{ color: '#805830' }}>230</span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed max-w-[180px]" style={{ color: '#2E2725' }}>
                        Compared to last 2 tests
                    </p>
                    <div className="mt-2 px-3 py-1 text-xs font-semibold rounded-full" style={{ background: 'rgba(128,88,48,0.15)', color: '#805830' }}>
                        ↑ Improving
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
