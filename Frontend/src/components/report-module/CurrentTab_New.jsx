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
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'correct', 'incorrect', 'blank'

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
    <div className="w-full mb-4 space-y-6">
      {/* Summary Section - Horizontal Layout */}

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
              <button 
                onClick={() => setFilterStatus('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all border ${
                  filterStatus === 'all' 
                    ? 'bg-gray-800 text-white border-gray-600 ring-2 ring-gray-600 ring-offset-1' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${filterStatus === 'all' ? 'bg-white' : 'bg-gray-400'}`}></div>
                {currentSubject.subject_correct_count + currentSubject.subject_incorrect_count + currentSubject.subject_blank_count} All
              </button>
              
              <button 
                onClick={() => setFilterStatus(filterStatus === 'correct' ? 'all' : 'correct')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all border ${
                  filterStatus === 'correct' 
                    ? 'bg-green-100 text-green-700 border-green-200 ring-2 ring-green-500 ring-offset-1' 
                    : 'bg-green-50 text-green-700 border-transparent hover:bg-green-100'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${filterStatus === 'correct' ? 'bg-green-500' : 'bg-green-400'}`}></div>
                {currentSubject.subject_correct_count} Correct
              </button>
              
              <button 
                onClick={() => setFilterStatus(filterStatus === 'incorrect' ? 'all' : 'incorrect')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all border ${
                  filterStatus === 'incorrect' 
                    ? 'bg-red-100 text-red-700 border-red-200 ring-2 ring-red-500 ring-offset-1' 
                    : 'bg-red-50 text-red-700 border-transparent hover:bg-red-100'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${filterStatus === 'incorrect' ? 'bg-red-500' : 'bg-red-400'}`}></div>
                {currentSubject.subject_incorrect_count} Incorrect
              </button>

              <button 
                onClick={() => setFilterStatus(filterStatus === 'blank' ? 'all' : 'blank')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all border ${
                  filterStatus === 'blank' 
                    ? 'bg-gray-200 text-gray-700 border-gray-300 ring-2 ring-gray-400 ring-offset-1' 
                    : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
                }`}
              >
                 <div className={`w-2.5 h-2.5 rounded-full ${filterStatus === 'blank' ? 'bg-gray-500' : 'bg-gray-400'}`}></div>
                {currentSubject.subject_blank_count} Blank
              </button>
            </div>
          </div>
          {/* Section Bubbles */}
          <div className="space-y-3">
            {sections.map((section, index) => {
              const totalCount = getTotalCount(section);
              if (totalCount === 0) return null;

              const bubbles = generateBubbleData(section);

              // Filter bubbles based on filterStatus
              const filteredBubbles = bubbles.filter(bubble => {
                if (filterStatus === 'all') return true;
                return bubble.type === filterStatus;
              });

              if (filteredBubbles.length === 0 && filterStatus !== 'all') return null;

              return (
                <div key={index} className="flex items-center gap-3 flex-wrap">
                  <div className="w-20 md:w-24 text-xs font-semibold text-gray-500 shrink-0">{section.name}</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {filteredBubbles.map((bubble) => {
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
