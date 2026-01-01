"use client";
import React from "react";
import { CalendarIcon } from "@/components/icons/dashboard-icons";

export default function DashboardHeader({ name }) {
  
  // Format current date
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const currentDate = today.toLocaleDateString('en-US', options);

  return (
    <div className="bg-gradient-to-r from-[#F59403] via-[#FFD36A] to-[#F59403] rounded-lg p-6 mb-6 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-20 w-24 h-24 bg-white/10 rounded-full translate-y-1/2"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#2E2725]">
            Welcome back, <span className="text-[#2E2725] underline">{name}</span>! 👋
          </h1>
        </div>
        
        <div className="flex items-center gap-4 font-medium">
          <div className="flex items-center gap-2 text-2xl">
            <CalendarIcon className="text-white w-6 h-6" />
            <p className="text-[#ffffff] text-2xl font-medium">{currentDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
