"use client";

import SuggestionsList from "@/components/SuggestionsList";
import React from "react";
// import { LeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

function page() {
  const router = useRouter();
  
  return (
    <div>
      {" "}
      <div className="text-xl ml-3 mb-3 font-bold flex items-center">
        Suggestions
      </div>
      <SuggestionsList />
    </div>
  );
}

export default page;
