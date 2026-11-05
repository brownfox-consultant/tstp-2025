"use client";

import CreateTest from "@/components/CreateTest";
import { Steps, Button } from "antd";

import React, { useState } from "react";

function page() {
  const [testDetails, setTestDetails] = useState({});

  return (
    <div>
      <CreateTest setTestDetails={setTestDetails} />
    </div>
  );
}

export default page;
