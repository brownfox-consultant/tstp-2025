"use client";

import { useRouter, useParams } from "next/navigation";
import { message } from "antd";
import { useState, useEffect } from "react";
import { LockIcon, UnlockIcon, StarIcon, CrownIcon, FreeUserRocketIcon as RocketIcon } from "@/components/icons/free-user-icons";

export default function FreeUserPage() {
  const router = useRouter();
  const { id } = useParams();
  const [name, setName] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setName(window.localStorage.getItem("name") || "Student");
    }
  }, []);

  const courses = [
    { id: 1, name: "SAT", description: "Complete SAT preparation", icon: "📚" },
    { id: 2, name: "GRE", description: "Graduate exam prep", icon: "🎓" },
    { id: 29, name: "Vocab Builder", description: "Expand your vocabulary", icon: "📖" },
    { id: 30, name: "DSAT - Scholarship Test", description: "Free scholarship test", icon: "🏆", freeAccess: true },
    { id: 31, name: "DSAT - Math Only", description: "Math focused prep", icon: "🔢" },
    { id: 32, name: "DSAT - English Only", description: "English focused prep", icon: "✍️" },
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
    <div className="p-4 md:p-6 min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              <span className="text-gray-800">Welcome, </span>
              <span className="text-orange-500">{name}</span>
              <span className="inline-block ml-2 animate-bounce">👋</span>
            </h1>
            <p className="text-gray-500 mt-1 text-md">Explore our courses and start learning</p>
          </div>
        </div>
      </div>

      {/* Free User Banner */}
      <div className="mb-8 bg-gradient-to-r from-orange-500 to-amber-400 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <CrownIcon />
            </div>
            <div className="text-white">
              <h3 className="font-bold text-lg">Free Plan</h3>
              <p className="text-white/80 text-sm">Only Scholarship Test is available</p>
            </div>
          </div>
          <button className="px-6 py-3 bg-white text-orange-500 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2">
            <StarIcon />
            Upgrade to Premium
          </button>
        </div>
      </div>

      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
          <span className="w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-400 rounded-full"></span>
          Our Courses
        </h2>
        <p className="text-gray-500 text-sm mt-1 ml-4">Select a course to begin your preparation journey</p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const isFree = course.freeAccess;

          return (
            <div
              key={course.id}
              onClick={() => handleClick(course)}
              className={`
                relative group
                bg-white rounded-2xl p-6
                border-2 transition-all duration-300 cursor-pointer
                hover:shadow-xl hover:-translate-y-1
                ${isFree 
                  ? "border-orange-400 shadow-lg shadow-orange-100" 
                  : "border-gray-100 hover:border-orange-200"
                }
              `}
            >
              {/* Free Badge */}
              {isFree && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                  <RocketIcon className="w-3 h-3" />
                  FREE ACCESS
                </div>
              )}

              {/* Locked Badge */}
              {!isFree && (
                <div className="absolute top-4 right-4 text-gray-300 group-hover:text-gray-400 transition-colors">
                  <LockIcon />
                </div>
              )}

              {/* Course Content */}
              <div className="flex flex-col items-center text-center">
                {/* Icon */}
                <div className={`
                  w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4
                  transition-all duration-300
                  ${isFree 
                    ? "bg-gradient-to-br from-orange-100 to-amber-50" 
                    : "bg-gray-50 group-hover:bg-orange-50"
                  }
                `}>
                  {course.icon}
                </div>

                {/* Course Name */}
                <h3 className={`
                  font-semibold text-lg mb-1
                  ${isFree ? "text-orange-600" : "text-gray-800"}
                `}>
                  {course.name}
                </h3>

                {/* Description */}
                <p className="text-gray-500 text-sm">{course.description}</p>

                {/* Action Button */}
                <div className={`
                  mt-4 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-300
                  ${isFree 
                    ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md" 
                    : "bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600"
                  }
                `}>
                  {isFree ? (
                    <span className="flex items-center gap-2">
                      <UnlockIcon />
                      Start Now
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LockIcon />
                      Upgrade to Access
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Accent for Free Course */}
              {isFree && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-orange-500 to-amber-400 rounded-t-full"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Premium Features Section */}
      <div className="mt-12 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CrownIcon />
          Premium Benefits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500 flex-shrink-0">
              📊
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Full Practice Tests</h4>
              <p className="text-sm text-gray-500">Access all 6 courses with unlimited tests</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-500 flex-shrink-0">
              📈
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Detailed Analytics</h4>
              <p className="text-sm text-gray-500">Track your progress with insights</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-500 flex-shrink-0">
              🎯
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Personalized Reports</h4>
              <p className="text-sm text-gray-500">Get topic-wise performance analysis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          Want to upgrade? Contact us at{" "}
          <a href="tel:7574824766" className="text-orange-500 font-semibold hover:underline">
            +91 7574824766
          </a>
        </p>
      </div>
    </div>
  );
}
