"use client";

import React, { useState } from "react";
import IssuesList from "./IssuesList";
import RaiseIssueModal from "./RaiseIssueModal";
import { usePathname } from "next/navigation";

function IssuesComponent() {
  const [updated, setUpdated] = useState(false);
  const pathname = usePathname();
  let role = pathname.split("/")[1];
  return (
    <>
      <div className="text-xl flex justify-between font-semibold mb-2">
        Issues
        {role == "student" && (
          <RaiseIssueModal updated={updated} setUpdated={setUpdated} />
        )}
      </div>
      <IssuesList updated={updated} setUpdated={setUpdated} />
    </>
  );
}

export default IssuesComponent;
