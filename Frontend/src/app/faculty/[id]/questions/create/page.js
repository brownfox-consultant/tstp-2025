"use client";

import React from "react";
import { LeftOutlined } from "@ant-design/icons";

import { useRouter } from "next/navigation";
import QuestionForm from "@/components/QuestionForm";

function page() {
  const router = useRouter();
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-black tracking-tight">
          Create New Question
        </h1>

        <button
          onClick={handleBack}
          className="group flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-300 hover:border-[#F59405] bg-white hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <LeftOutlined className="text-base text-gray-600 group-hover:text-[#F59405] transition-colors duration-300" />
          <span className="font-semibold text-gray-700 group-hover:text-[#F59405] transition-colors duration-300">
            Back
          </span>
        </button>
      </div>

      <div className="w-full">
        <QuestionForm />
      </div>
    </div>
  );
}

export default page;
