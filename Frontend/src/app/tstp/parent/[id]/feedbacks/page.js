import FeedbackList from "@/components/FeedbackList";
import React from "react";

function page() {
  return (
    <div>
      {" "}
      <div className="text-xl ml-3 mb-3 font-bold">Student's Feedbacks</div>
      <FeedbackList />
    </div>
  );
}

export default page;
