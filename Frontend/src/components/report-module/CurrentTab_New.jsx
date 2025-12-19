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

  // Calculate percentage for score
  const scorePercent = currentSubject.subject_max_score > 0
    ? Math.round((currentSubject.subject_score / currentSubject.subject_max_score) * 100)
    : 0;

  // Total counts across all sections
  const totalCorrect = currentSubject.subject_correct_count;
  const totalIncorrect = currentSubject.subject_incorrect_count;
  const totalBlank = currentSubject.subject_blank_count;

  return (
    <div className="w-full my-6 space-y-6">
      {/* Score Card - Full Width on Mobile, Gradient Background */}
      <div className="grid lg:grid-cols-[240px_1fr] gap-6 mb-6">
        <div className="bg-gray-100 text-black rounded-2xl p-6 flex flex-col justify-center items-center animate-scale-in">
          <p className="text-xs uppercase tracking-widest font-semibold opacity-90 mb-1">
            {currentSubject.name} Score
          </p>
          <p className="text-6xl font-black leading-none mb-2">
            {currentSubject.subject_score}
          </p>
          <p className="text-sm opacity-80 mb-3">
            out of {currentSubject.subject_max_score}
          </p>
          <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-orange-500 to-amber-400"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <p className="text-sm font-bold mt-2">{scorePercent}%</p>
        </div>

        {/* Analysis Overview Card */}
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
          {/* Header with Stats Pills */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Analysis Overview</h3>
            </div>

            {/* Stats Inline */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="font-bold text-green-600">{totalCorrect}</span>
                <span className="text-green-600">Correct</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="font-bold text-red-500">{totalIncorrect}</span>
                <span className="text-red-500">Incorrect</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                <span className="font-bold text-gray-600">{totalBlank}</span>
                <span className="text-gray-500">Blank</span>
              </div>
            </div>
          </div>

          {/* Question Bubbles per Section */}
          <div className="space-y-3">
            {sections.map((section, sectionIndex) => {
              const totalCount = getTotalCount(section);
              if (totalCount === 0) return null;

              const bubbles = generateBubbleData(section);

              return (
                <div key={sectionIndex} className="flex items-start gap-3">
                  <span className="text-sm font-semibold text-gray-500 min-w-[50px] pt-1">{section.name}</span>
                  <div className="flex gap-1 flex-wrap">
                    {bubbles.map((bubble) => {
                      const { type, index } = bubble;

                      let bubbleClass = "";
                      if (type === "correct") bubbleClass = "bg-green-500 text-white";
                      else if (type === "incorrect") bubbleClass = "bg-red-500 text-white";
                      else bubbleClass = "bg-white text-gray-500 border border-gray-300";

                      return (
                        <button
                          key={index}
                          title={`Q${index} - ${type}`}
                          className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer ${bubbleClass}`}
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
      {/* Section Cards - Sec A & Sec B Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, index) => (
          <SectionSegmentLabel key={index} data={section} />
        ))}
      </div>

      {/* Areas of Strength & Focus */}
      {/* <ReportStats sectionData={sections[selectedSection]} /> */}

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
        testType={sections[selectedSection].test_type}
        testSubmissionId={testSubmissionId}
      />
    </div>
  );
}

export default CurrentTab_New;
