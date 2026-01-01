"use client";

import ChangePasswordModal from "@/components/ChangePasswordModal";
import Dashboard from "@/components/demo";
import React, { useEffect, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";

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
      
      <DashboardHeader name={username} onRefresh={() => window.location.reload()} />

      <Dashboard />
    </div>
  );
}

export default DashboardPage;
