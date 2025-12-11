"use client";

import { useRouter, useParams } from "next/navigation";
import { message } from "antd";

export default function FreeUserPage() {
  const router = useRouter();
  const { id } = useParams();

  const courses = [
    { id: 1, name: "SAT" },
    { id: 2, name: "GRE" },
    { id: 29, name: "Vocab Builder" },
    { id: 30, name: "DSAT - Scholarship Test", freeAccess: true },
    { id: 31, name: "DSAT -Math Only" },
    { id: 32, name: "DSAT - English Only" },
  ];

  function handleClick(course) {
    if (course.freeAccess) {
      router.push(`/student/${id}/test/full`);
      return;
    }

    message.warning(
      "You are a FREE USER. To access this course, please upgrade to a PAID SUBSCRIPTION. Contact @7574824766."
    );
  }

  return (
    <div className="p-6 min-h-screen">

      <h1 className="text-2xl font-bold text-gray-900">Our Courses</h1>

      <p className="mt-2 text-gray-600 text-[14px] font-medium">
        You are a <span className="font-bold text-black">FREE USER</span>.  
        Only Scholarship Test is available.  
        Upgrade to a <span className="font-bold text-black">PAID SUBSCRIPTION</span>.
      </p>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 mt-10">
        {courses.map((course) => {
          const isFree = course.freeAccess;

          return (
            <div
              key={course.id}
              onClick={() => handleClick(course)}
              className={`
                flex flex-col items-center justify-center
                h-40 w-64 mx-auto
                rounded-3xl
                text-center font-semibold text-[17px]
                transition-all duration-300 cursor-pointer
                bg-[#F2F2F3]

                /* TRUE NEUMORPHIC 3D SHADOW */
                shadow-[10px_10px_25px_#b8b8b8,-10px_-10px_25px_#ffffff]

                hover:shadow-[6px_6px_20px_#b8b8b8,-6px_-6px_20px_#ffffff]
                hover:-translate-y-[4px]

                ${isFree ? "border-2 border-orange-400" : ""}
              `}
            >
              {course.name}

              {isFree && (
                <div className="mt-2 h-[3px] w-14 bg-orange-400 rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
