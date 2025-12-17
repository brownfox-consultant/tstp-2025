"use client";

import React from "react";
import { FaBookOpen, FaCalculator } from "react-icons/fa";
import { BiSolidCircle } from "react-icons/bi";

export default function UtilisationOfResources() {
  
  const ChartCard = ({ title, icon: Icon, answered, unanswered, color, gradientColors }) => {
    const total = answered + unanswered;
    const answeredPercentage = (answered / total) * 100;
    const unansweredPercentage = (unanswered / total) * 100;

    return (
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-8 border border-gray-100 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-gray-50">
          <div className={`p-3 rounded-xl ${color === 'orange' ? 'bg-gradient-to-br from-orange-50 to-orange-100' : 'bg-gradient-to-br from-amber-50 to-amber-100'}`}>
            <Icon className={color === 'orange' ? 'text-orange-600' : 'text-amber-600'} size={24} />
          </div>
          <div className="flex items-center gap-2">
            <BiSolidCircle className={color === 'orange' ? 'text-orange-500' : 'text-amber-500'} size={12} />
            <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
          </div>
        </div>

        {/* Y-Axis Labels and Bars Container */}
        <div className="space-y-6">
          
          {/* Answered Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600">Answered</span>
              <span className="text-sm font-bold text-gray-400">{answeredPercentage.toFixed(1)}%</span>
            </div>
            <div className="relative h-16 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-inner">
              <div 
                className={`absolute inset-y-0 left-0 ${color === 'orange' ? 'bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600' : 'bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500'} rounded-xl flex items-center justify-center shadow-lg transition-all duration-1000 ease-out hover:scale-105`}
                style={{ 
                  width: `${Math.max(answeredPercentage, 8)}%`,
                  animation: 'slideIn 1s ease-out'
                }}
              >
                <span className="text-white font-bold text-lg drop-shadow-md">{answered}</span>
              </div>
            </div>
          </div>

          {/* Unanswered Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600">Unanswered</span>
              <span className="text-sm font-bold text-gray-400">{unansweredPercentage.toFixed(1)}%</span>
            </div>
            <div className="relative h-16 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-inner">
              <div 
                className={`absolute inset-y-0 left-0 ${color === 'orange' ? 'bg-gradient-to-r from-orange-200 via-orange-300 to-orange-400 opacity-70' : 'bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 opacity-70'} rounded-xl flex items-center justify-center shadow-lg transition-all duration-1000 ease-out hover:scale-105`}
                style={{ 
                  width: `${Math.max(unansweredPercentage, 8)}%`,
                  animation: 'slideIn 1.2s ease-out'
                }}
              >
                <span className={`font-bold text-lg drop-shadow-md ${color === 'orange' ? 'text-orange-800' : 'text-amber-800'}`}>{unanswered}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Statistics Footer */}
        <div className="mt-8 pt-6 border-t-2 border-gray-50 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-800">{total}</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Done</p>
            <p className="text-2xl font-bold text-green-700">{answered}</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-2xl font-bold text-red-700">{unanswered}</p>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="w-full py-8 bg-transparent">

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto px-4">
        <ChartCard 
          title="English" 
          icon={FaBookOpen} 
          answered={45} 
          unanswered={790} 
          color="orange"
        />
        <ChartCard 
          title="Math" 
          icon={FaCalculator} 
          answered={33} 
          unanswered={790} 
          color="amber"
        />
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            width: 0%;
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
