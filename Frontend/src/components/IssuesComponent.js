"use client";

import React, { useState } from "react";
import IssuesList from "./IssuesList";
import RaiseIssueModal from "./RaiseIssueModal";
import { usePathname } from "next/navigation";

function IssuesComponent() {
  const [updated, setUpdated] = useState(false);
  const pathname = usePathname();
  let role = pathname.split("/")[2];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800 m-0">Issues</h1>
        {role == "student" && (
          <RaiseIssueModal updated={updated} setUpdated={setUpdated} />
        )}
      </div>
      <IssuesList updated={updated} setUpdated={setUpdated} />
    </div>
  );
}

export default IssuesComponent;
