import FeedbackList from "@/components/FeedbackList";
import React from "react";

function page() {
  return (
    <div>
      {" "}
      <div className="text-xl ml-3 mb-3 font-bold">Student Feedbacks List</div>
      <FeedbackList />
    </div>
  );
}

export default page;
