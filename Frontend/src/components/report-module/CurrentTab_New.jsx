import React, { useEffect, useState } from "react";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import ReportTabs from "./report-tabs";
import ReportTable from "./report-table";
import ReportStats from "./report-stats";
import SectionSegmentLabel from "./section-segment-label";
import QuestionReviewModal from "../QuestionReviewModal";
import { getQuestionDetails } from "@/app/services/authService";
import RaiseDoubtModal from "../RaiseDoubtModal";
import { usePathname } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart, Tooltip } from "recharts";

function CurrentTab_New({ selectedSubject, data, testSubmissionId }) {
  const currentSubject = data.subjects[selectedSubject];
  const { sections } = currentSubject;
  const pathname = usePathname();
  const role = pathname.split("/")[1];
  const [selectedSection, setSelectedSection] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewInfo, setReviewInfo] = useState({
    questionId: null,
    selectedOptions: [],
    sectionId: null,
    courseSubjectId: null,
    testId: null,
    questionsList: [],
  });
  // modal state
  console.log("Current Subject:", currentSubject);
  console.log("Data:", data);
  useEffect(() => {
    setSelectedSection(0);
  }, [selectedSubject]);

  const openReview = (questionObj, section) => {
    setReviewInfo({
      questionId: questionObj.question_id,
      selectedOptions: questionObj.selected_options || [],
      sectionId: section.section_id,
      courseSubjectId: section.course_subject_id,
      testId: section.test_id,
      questionsList: section.questions_data || [],
    });
    setReviewOpen(true);
  };

  const getTotalCount = (section) =>

    section.section_correct_count +
    section.section_incorrect_count +
    section.section_blank_count;

  const generateBubbleData = (section) => {
    const bubbles = [];

    const questions = section.questions_data || [];

    questions.forEach((q, i) => {
      let type = "blank";
      if (!q.is_skipped && q.result === true) type = "correct";
      else if (!q.is_skipped && q.result === false) type = "incorrect";

      bubbles.push({
        index: q.sr_no || i + 1,
        question_id: q.question_id,
        type,
      });
    });

    return bubbles;
  };

  // Generate chart data for score visualization
  const scorePercent = Math.round((currentSubject.subject_score / currentSubject.subject_max_score) * 100);
  const chartData = [
    { name: '0', value: 0 },
    { name: '25', value: scorePercent * 0.3 },
    { name: '50', value: scorePercent * 0.6 },
    { name: '75', value: scorePercent * 0.85 },
    { name: '100', value: scorePercent },
  ];

  return (
    <div className="w-full my-6 space-y-6">
      {/* Summary Section - Horizontal Layout */}
      <div>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Score Card with Progress - Left Side */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col items-center justify-center min-w-[200px]">
            <div className="text-sm font-semibold text-gray-600 mb-2">
              {currentSubject.name} Score
            </div>
            <div className="text-5xl font-black text-[#F59403]">
              {currentSubject.subject_score}
            </div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
              OUT OF {currentSubject.subject_max_score}
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#F59403] to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${scorePercent}%` }}
              />
            </div>
          </div>

          {/* Analysis Overview - Right Side */}
          <div className="flex-1 bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex  justify-between flex-wrap">
              <div className="text-lg font-bold mb-3 text-gray-800">Analysis Overview</div>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {currentSubject.subject_correct_count} Correct
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full font-medium">
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {currentSubject.subject_incorrect_count} Incorrect
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                  <span className="w-3 h-3 border-2 border-gray-400 rounded-full" />
                  {currentSubject.subject_blank_count} Blank
                </span>
              </div>
            </div>
            {/* Section Bubbles */}
            <div className="space-y-3">
              {sections.map((section, index) => {
                const totalCount = getTotalCount(section);
                if (totalCount === 0) return null;

                const bubbles = generateBubbleData(section);

                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-20 md:w-24 text-xs font-semibold text-gray-500 shrink-0">{section.name}</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {bubbles.map((bubble) => {
                        const { type, index, question_id } = bubble;

                        let bgColor = "";
                        if (type === "correct") bgColor = "bg-green-500 hover:bg-green-600";
                        else if (type === "incorrect") bgColor = "bg-red-500 hover:bg-red-600";
                        else bgColor = "bg-gray-200 text-gray-600 hover:bg-gray-300";

                        return (
                          <button
                            key={index}
                            title={`Q${index} - ${type}`}
                            className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center transition-all duration-200 shadow-sm ${bgColor} ${type !== "blank" ? "text-white" : ""}`}
                            onClick={() => openReview(section.questions_data[index - 1], section)}
                          >
                            {index}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ReportTabs
        options={sections.map((section, index) => ({
          label: <SectionSegmentLabel data={section} />,
          value: index,
        }))}
        selectedValue={selectedSection}
        handleChange={(val) => setSelectedSection(val)}
        testSubmissionId={testSubmissionId}
      />

      {/* Section Content */}
      {/* <div className="rounded-lg shadow border p-4"> */}
        {/* <ReportTable sectionData={sections[selectedSection]} /> */}
        {/* <ReportStats sectionData={sections[selectedSection]} /> */}
      {/* </div> */}

      {/* Modal */}
      <QuestionReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        questionId={reviewInfo.questionId}
        selectedOptions={reviewInfo.selectedOptions}
        sectionId={reviewInfo.sectionId}
        courseSubjectId={reviewInfo.courseSubjectId}
        testId={reviewInfo.testId}
        questionsList={reviewInfo.questionsList}
        role={role}
        testType={sections[selectedSection]?.test_type || "FULL_LENGTH_TEST"}
        testSubmissionId={testSubmissionId}
      />

    </div>
  );
}

export default CurrentTab_New;
