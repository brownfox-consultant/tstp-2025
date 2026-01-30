"use client";
import StudentQuestionsComponent from "@/components/StudentQuestionsComponent";
import React from "react";

function QuestionPage() {
  return (
    <div className="h-full">
       <h1 className="text-2xl font-bold mb-4">Attempted Questions</h1>
       <StudentQuestionsComponent />
    </div>
  );
}

export default QuestionPage;
