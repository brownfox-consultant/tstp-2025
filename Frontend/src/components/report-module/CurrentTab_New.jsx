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

function CurrentTab_New({ selectedSubject, data ,testSubmissionId}) {
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

  return (
    <div className="w-full my-6 space-y-8">
      {/* Summary Section */}
      <div className="flex gap-6 flex-wrap ">
        <div className="bg-white shadow-md border border-gray-200 rounded-lg p-4 flex flex-col text-center justify-between gap-4 w-64">
          <div className="text-lg font-semibold text-gray-700">
            {currentSubject.name} Score
          </div>
          <div className="text-6xl font-bold text-red-600">
            {currentSubject.subject_score}
          </div>
          <div className="text-sm text-gray-500">
            OUT OF {currentSubject.subject_max_score}
          </div>
        </div>

        {/* Overview */}
        <div className="flex-1 bg-white p-2 rounded-lg shadow-md border border-gray-200">
          <div className="text-2xl font-bold mb-3 text-gray-800">Analysis Overview</div>
          <div className="flex flex-wrap gap-6 mb-4 text-gray-700 text-lg">
            <span>
              <CheckCircleTwoTone twoToneColor="#52c41a" />{" "}
              {currentSubject.subject_correct_count} Correct
            </span>
            <span>
              <CloseCircleTwoTone twoToneColor="#ff0000" />{" "}
              {currentSubject.subject_incorrect_count} Incorrect
            </span>
            <span>
              <span className="inline-block h-3 w-3 border border-black rounded-full mr-1" />
              {currentSubject.subject_blank_count} Blank
            </span>
          </div>

          {/* Bubbles */}
          <div className="space-y-3">
            {sections.map((section, index) => {
              const totalCount = getTotalCount(section);
              if (totalCount === 0) return null;

              const bubbles = generateBubbleData(section);

              return (
                <div key={index} className="flex items-center ">
                  <div className="w-32 font-medium text-gray-600">{section.name}</div>
                  <div className="flex gap-1 overflow-x-auto whitespace-nowrap">
                    {bubbles.map((bubble) => {
                      const { type, index, question_id } = bubble;

                      let bgColor = "";
                      if (type === "correct") bgColor = "bg-green-500";
                      else if (type === "incorrect") bgColor = "bg-red-500";
                      else bgColor = "bg-gray-300 border border-gray-500";

                      return (
                        <button
                          key={index}
                          title={`Q${index} - ${type}`}
                          className={`w-6 h-6 rounded-full text-[10px] text-white font-bold flex items-center justify-center ${bgColor}`}
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
      <div className="bg-white rounded-md border border-gray-200 p-3 shadow-sm">
        <ReportTabs
          options={sections.map((section, index) => ({
            label: <SectionSegmentLabel data={section} />,
            value: index,
            className: `py-2 px-4 mx-2 border-t-4 rounded transition-all duration-200 ${
              selectedSection === index
                ? "border-yellow-400 font-semibold bg-yellow-50"
                : "border-transparent hover:bg-gray-100"
            }`,
          }))}
          selectedValue={selectedSection}
          handleChange={(val) => setSelectedSection(val)}
          testSubmissionId={testSubmissionId}
        />
      </div>

      {/* Section Content */}
      <div className="bg-white rounded-lg shadow border p-4">
        {/* <ReportTable sectionData={sections[selectedSection]} /> */}
        <ReportStats sectionData={sections[selectedSection]} />
      </div>

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
