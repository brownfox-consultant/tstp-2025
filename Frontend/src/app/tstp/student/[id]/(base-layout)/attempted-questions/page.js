"use client";

import { useParams } from "next/navigation";
import StudentQuestionsComponent from "@/components/StudentQuestionsComponent";

export default function QuestionPage() {
  const params = useParams();
  const studentId = params.id;

 

  return (
    <div className="h-full">
      <h1 className="text-2xl font-bold mb-4">Attempted Questions</h1>
      <StudentQuestionsComponent studentId={studentId} />
    </div>
  );
}
