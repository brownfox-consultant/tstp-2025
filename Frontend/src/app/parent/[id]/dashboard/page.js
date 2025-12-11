"use client";

import ChangePasswordModal from "@/components/ChangePasswordModal";
import Dashbord from "@/components/ParentDashbord";
import React from "react";

function DashboardPage() {
  const change_password_flag = window.localStorage.getItem("change_password");

  return (
    <div>
      <ChangePasswordModal
        buttonVisible={false}
        changePasswordFlag={change_password_flag == "true"}
      />
      <Dashbord />
    </div>
  );
}

export default DashboardPage;
