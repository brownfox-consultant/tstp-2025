"use client";

import ChangePasswordModal from "@/components/ChangePasswordModal";
import Dashboard from "@/components/demo";
import React, { useEffect, useState } from "react";

function DashboardPage() {
  const [changePasswordFlag, setChangePasswordFlag] = useState(false);
  const [username, setUsername] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Ensure code only runs on the client
    const flag = window.localStorage.getItem("change_password");
    const user_name = window.localStorage.getItem("name");
    setUsername(user_name || "Admin");
    setChangePasswordFlag(flag === "true");

    // Set current time
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }));
    };
    updateTime();
  }, []);

  return (
    <div className="min-h-screen">
      <ChangePasswordModal buttonVisible={false} changePasswordFlag={changePasswordFlag} />
      
      {/* Welcome Header Section */}
      <div className="bg-gradient-to-r from-[#F59403] via-[#FFD36A] to-[#F59403] rounded-2xl p-6 mb-6 shadow-lg relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-20 w-24 h-24 bg-white/10 rounded-full translate-y-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[#805830] text-sm font-medium mb-1">{currentTime}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2E2725]">
              Welcome back, <span className="text-[#805830]">{username}</span>! 👋
            </h1>
            {/* <p className="text-[#805830] mt-2 text-sm md:text-base">
              Here&apos;s what&apos;s happening with your students today.
            </p> */}
          </div>
          
          {/* <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#2E2725] text-white rounded-xl font-medium text-sm shadow-md hover:bg-[#805830] transition-all duration-300 hover:scale-105">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Student
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/80 text-[#2E2725] rounded-xl font-medium text-sm shadow-md hover:bg-white transition-all duration-300 hover:scale-105 border border-[#805830]/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Reports
            </button>
          </div> */}
        </div>
      </div>

      {/* Dashboard Content */}
      <Dashboard />
    </div>
  );
}

export default DashboardPage;
