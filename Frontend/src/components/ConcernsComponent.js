"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import ConcernsList from "./ConcernsList";
import RaiseConcernModal from "./RaiseConcernModal";

function ConcernsComponent() {
  const [updated, setUpdated] = useState(false);
  const pathname = usePathname();
  let role = pathname.split("/")[1];
  return (
    <>
      <div className="text-xl flex justify-between font-semibold mb-2">
        Concerns List
        {role == "parent" && (
          <RaiseConcernModal updated={updated} setUpdated={setUpdated} />
        )}
      </div>
      <ConcernsList updated={updated} setUpdated={setUpdated} />
    </>
  );
}

export default ConcernsComponent;
