"use client";

import SuggestionsList from "@/components/SuggestionsList";
import React from "react";

function page() {
  return (
    <div>
      {" "}
      <div className="text-xl ml-3 mb-3 font-bold">Suggestions</div>
      <SuggestionsList />
    </div>
  );
}

export default page;
