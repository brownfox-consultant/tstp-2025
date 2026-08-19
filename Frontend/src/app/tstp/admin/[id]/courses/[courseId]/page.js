"use client";

import { getCourseDetails } from "@/app/services/authService";
import CourseForm from "@/components/CourseForm";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

function Page() {
  const { courseId } = useParams();
  const [courseDetails, setCourseDetails] = useState({});
  const router = useRouter();

  useEffect(() => {
    getCourseDetails(courseId)
      .then((res) => {
        setCourseDetails(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <>
      <div className="flex items-center gap-2 mb-4 justify-between">
        <div className="text-xl font-bold text-gray-800">
          Update Course
        </div>
        <div
          onClick={() => router.back()}
          className="cursor-pointer bg-white p-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftOutlined className="text-gray-600 text-sm me-2" />
          Back
        </div>
      </div>
      {Object.keys(courseDetails).length !== 0 && (
        <CourseForm isEdit={true} courseData={courseDetails} />
      )}
    </>
  );
}

export default Page;
