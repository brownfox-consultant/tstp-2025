"use client";

import ChangePasswordModal from "@/components/ChangePasswordModal";
import NotificationComponent from "@/components/ParentDashbord";
import Dashboard from "@/components/demo";
import React, { useEffect, useState } from "react";


function DashboardPage() {
  const [changePasswordFlag, setChangePasswordFlag] = useState(false);
  const [username, setusername] = useState("");

  useEffect(() => {
    // Ensure code only runs on the client
    const flag = window.localStorage.getItem("change_password");
    const user_name = window.localStorage.getItem("name");
    setusername(user_name)
    setChangePasswordFlag(flag === "true");
  }, []);

  return (
    
    <div>

      <ChangePasswordModal buttonVisible={false} changePasswordFlag={changePasswordFlag} />
      <div className="text-xl font-semibold mb-3 flex align-middle">
        Welcome back,{username}
      </div> 
      <Dashboard/> 
     {/* <NotificationComponent /> */}
    </div>
    
  );
}

export default DashboardPage;
