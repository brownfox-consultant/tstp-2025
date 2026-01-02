"use client";

import { getPracticeResults } from "@/app/services/authService";
import useFullScreen from "@/utils/useFullScreen";
import {
  CaretRightOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  LeftOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  QuestionCircleOutlined,
  PieChartOutlined
} from "@ant-design/icons";
import { Collapse, Skeleton, Card, Tag, Divider, Row, Col } from "antd";
import { useParams, useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import MathContent from "./MathContent";

function PracticeTestResult() {
  const { practice_test_id, id } = useParams();
  const router = useRouter();
  const [resultDetails, setResultDetails] = useState();
  const [skeletonLoading, setSkeletonLoading] = useState(false);
  const pathname = usePathname();
  const role = pathname.split("/")[1];

  useEffect(() => {
    setSkeletonLoading(true);
    getPracticeResults(practice_test_id)
      .then(({ data }) => {
        setResultDetails(data);
      })
      .finally(() => setSkeletonLoading(false));
  }, []);

  // Calculate stats
  const correctCount = resultDetails?.section_correct_count ?? 0;
  const incorrectCount = resultDetails?.section_incorrect_count ?? 0;
  const totalQuestions = resultDetails?.questions_data?.length ?? 0;
  const unansweredCount = totalQuestions - correctCount - incorrectCount;

  const handleBack = () => {
    if (role === "student") {
      router.push(`/${role}/${id}/test/practice`);
    } else {
      router.push(`/${role}/${id}/practice`);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              Practice Test Result
            </h1>
          </div>
          <button
            onClick={handleBack}
            className="w-fit px-5 py-2.5 flex items-center justify-center gap-2 rounded-full bg-white hover:bg-white border border-gray-200 text-gray-700 font-medium shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105"
          >
            <LeftOutlined /> Back to Practice
          </button>
        </div>

        <Skeleton active loading={skeletonLoading}>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4">
            {/* Correct */}
            <Card className="border-0 shadow-sm rounded-xl overflow-hidden relative">
              <div className="absolute right-0 top-0 p-4 opacity-20">
                <CheckCircleFilled className="text-6xl text-gray-300" />
              </div>
              <div className="relative z-10">
                <div className="text-3xl font-bold text-green-600 mb-1">{correctCount}</div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Correct</div>
              </div>
              <div className="h-1 w-full bg-green-100 absolute bottom-0 left-0">
                <div className="h-full bg-green-500" style={{ width: `${(correctCount/totalQuestions)*100}%` }}></div>
              </div>
            </Card>

            {/* Incorrect */}
            <Card className="border-0 shadow-sm rounded-xl overflow-hidden relative">
              <div className="absolute right-0 top-0 p-4 opacity-20">
                <CloseCircleFilled className="text-6xl text-gray-300" />
              </div>
              <div className="relative z-10">
                <div className="text-3xl font-bold text-red-600 mb-1">{incorrectCount}</div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Incorrect</div>
              </div>
              <div className="h-1 w-full bg-red-100 absolute bottom-0 left-0">
                <div className="h-full bg-red-500" style={{ width: `${(incorrectCount/totalQuestions)*100}%` }}></div>
              </div>
            </Card>

            {/* Unanswered/Total */}
            <Card className="border-0 shadow-sm rounded-xl overflow-hidden relative">
              <div className="absolute right-0 top-0 p-4 opacity-20">
                <QuestionCircleOutlined className="text-6xl text-gray-300" />
              </div>
              <div className="relative z-10">
                <div className="text-3xl font-bold text-blue-600 mb-1">{unansweredCount}</div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Unanswered / {totalQuestions} Total</div>
              </div>
              <div className="h-1 w-full bg-blue-100 absolute bottom-0 left-0">
                 <div className="h-full bg-blue-500" style={{ width: `${(unansweredCount/totalQuestions)*100}%` }}></div>
              </div>
            </Card>
          </div>

          {/* Detailed Question List */}
          <Card 
            title={<span className="font-bold text-gray-800 text-lg">Question Analysis</span>} 
            className="shadow-sm border-gray-100 rounded-xl"
            bodyStyle={{ padding: '24px' }}
          >
            <Collapse
              className="bg-transparent border-0"
              expandIconPosition="end"
              expandIcon={({ isActive }) => (
                <CaretRightOutlined rotate={isActive ? 90 : 0} className="text-gray-400" />
              )}
              items={resultDetails?.questions_data?.map((question, index) => {
                const isCorrect = question.result === true;
                const hasMarked = Array.isArray(question.selected_options) && question.selected_options.length > 0;
                
                // Determine Status Color and Icon
                let statusColor = "text-gray-400";
                let statusIcon = <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">Skipped</div>;
                let borderColor = "border-l-4 border-l-gray-300";

                if (hasMarked) {
                  if (isCorrect) {
                     statusColor = "text-green-600";
                     statusIcon = <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1"><CheckOutlined /> Correct</div>;
                     borderColor = "border-l-4 border-l-green-500";
                  } else {
                     statusColor = "text-red-600";
                     statusIcon = <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1"><CloseOutlined /> Incorrect</div>;
                     borderColor = "border-l-4 border-l-red-500";
                  }
                }

                return {
                  key: question.question_id,
                  label: (
                    <div className="flex items-center justify-between w-full py-2">
                       <div className="flex items-center gap-4">
                         <span className="font-bold text-gray-700 w-8">#{question?.sr_no}</span>
                         <div className="flex flex-col">
                           <span className="font-semibold text-gray-900">
                             {question?.topic || "Question"}
                           </span>
                           <span className="text-xs text-gray-500">
                             ID: {question?.question_id}
                           </span>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-4 mr-4">
                          <div className="flex items-center gap-1 text-gray-500 text-sm">
                            <ClockCircleOutlined />
                            <span>{question.total_time}s</span>
                          </div>
                          {statusIcon}
                       </div>
                    </div>
                  ),
                  children: (
                    <div>
                      <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                           <div>
                             <span className="block text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Selections</span>
                             <div className="font-medium text-gray-800">
                               {question.selected_options.length > 0 
                                 ? question.selected_options.join(", ") 
                                 : <span className="text-gray-400 italic">None</span>
                               }
                             </div>
                           </div>
                           
                           <div>
                             <span className="block text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Status details</span>
                             <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Marked:</span>
                                  <span className="font-medium">{question.marked ? "Yes" : "No"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Skipped:</span>
                                  <span className="font-medium">{question.is_skipped ? "Yes" : "No"}</span>
                                </div>
                             </div>
                           </div>

                           {question.description && (
                             <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-gray-200">
                               <span className="block text-gray-500 text-xs uppercase font-bold tracking-wider mb-2">Question Content</span>
                               <MathContent content={question.description} />
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  ),
                  style: {
                    background: 'white',
                    marginBottom: 12,
                    borderRadius: 8,
                    border: '1px solid #f0f0f0',
                    overflow: 'hidden'
                  },
                  className: `${borderColor} hover:shadow-sm transition-shadow duration-200`
                };
              })}
            />
          </Card>
        </Skeleton>
      </div>
    </div>
  );
}

export default PracticeTestResult;
