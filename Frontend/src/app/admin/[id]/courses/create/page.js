"use client";

import CourseForm from "@/components/CourseForm";
import { LeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import React from "react";

function CreateSubjectPage() {
  const router = useRouter();
  return (
    <>
      <div className="text-xl font-semibold mb-2 flex align-middle">
        <LeftOutlined
          onClick={() => router.back()}
          className="mr-2 text-base hover:font-extrabold"
        />{" "}
        Create Course
      </div>
      <CourseForm />
    </>
  );
}

export default CreateSubjectPage;
