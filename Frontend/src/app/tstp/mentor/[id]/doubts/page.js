import DoubtsList from "@/components/DoubtsList";
import React from "react";

function page() {
  return (
    <div>
      {" "}
      <div className="text-xl ml-3 mb-3 font-bold">Doubts</div>
      <DoubtsList />
    </div>
  );
}

export default page;
