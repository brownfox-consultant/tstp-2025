"use client";

import ChangePasswordModal from "@/components/ChangePasswordModal";
import React from "react";
import Dashboard from "@/components/mentorDashboard"

function DashboardPage() {
  const change_password_flag = window.localStorage.getItem("change_password");

  return (
    <div>
      <ChangePasswordModal
        buttonVisible={false}
        changePasswordFlag={change_password_flag == "true"}
      />
    <Dashboard/>
    </div>
  );
}

export default DashboardPage;
