"use client";

import { getCourseDetails } from "@/app/services/authService";
import CourseForm from "@/components/CourseForm";
import { LeftOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

function page() {
  const { courseId } = useParams();
  const [courseDetails, setCourseDetails] = useState({});
  const router = useRouter();

  useEffect(() => {
    getCourseDetails(courseId)
      .then((res) => {
        setCourseDetails(res.data);
      })
      .catch(() => console.log(err));
  }, []);

  return (
    <>
      <div className="text-xl font-bold mb-2 flex items-center">
        <LeftOutlined
          className="mr-2 text-sm hover:font-extrabold cursor-pointer"
          onClick={() => router.back()}
        />
        Update Course
      </div>
      {Object.keys(courseDetails).length !== 0 && (
        <CourseForm isEdit={true} courseData={courseDetails} />
      )}
    </>
  );
}

export default page;
