"use client";

import CourseForm from "@/components/CourseForm";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import React from "react";

function CreateSubjectPage() {
  const router = useRouter();
  return (
    <>
      <div className="flex items-center gap-2 mb-4 justify-between">

        <div className="text-xl font-bold text-gray-800">
          Create Course
        </div>

        <div
          onClick={() => router.back()}
          className="cursor-pointer bg-white p-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftOutlined className="text-gray-600 text-sm me-2" />
          Back
        </div>
      </div>
      <CourseForm />
    </>
  );
}

export default CreateSubjectPage;
