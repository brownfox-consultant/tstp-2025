import { getSubjectQuestions } from "@/app/services/authService";
import { Card, Col, Empty, Row, Spin } from "antd";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import TableComponent from "./TableComponent";
import EmptyTableComponent from "./EmptyTableComponent";
import {
  ClockCircleOutlined,
  FileTextOutlined,
  BookOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  LeftOutlined
} from "@ant-design/icons";

function TestSubjectInfo({ testDetails, setTestReady, updated, setUpdated }) {
  const [selectedSection, setSelectedSection] = useState("none");
  const { id, testId } = useParams();
  const router = useRouter();
  const role = usePathname().split("/")[1];
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [topics, setTopics] = useState([]);
  const [descSearch, setDescSearch] = useState("");

  const {
    course: courseId,
    course_name,
    format_type,
    test_type,
    id: test_id,
    name: testName,
    subject: subjects,
  } = testDetails;

  useEffect(() => {
    if (selectedSection !== "none") {
      setLoading(true);

      let temp = [];
      let subject = subjects.find(
        (sub) => sub.course_subject === selectedSection.course_subject_id
      );
      if (subject) {
        subject.sections.forEach((section) => {
          if (section.id !== selectedSection.section_id) {
            section.questions.forEach((questionId) =>
              temp.push(Number(questionId))
            );
          }
        });
      }

      getSubjectQuestions({
        courseSubId: selectedSection.course_subject_id,
        page: current,
        params: {
          is_active: true,
          test_type: "FULL_LENGTH_TEST",
          question_text: descSearch,
          page_size: pageSize,
          ...(temp.length > 0 && { exclude_ids: temp.join(',') })
        },
      })
        .then((res) => {
          const { results, count, current_page } = res.data;

          setDataSource(results.questions);
          setTopics(results.topics);
          setCurrent(current_page);
          setTotal(count);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedSection, current, pageSize, descSearch]);

  // ✅ UseEffect to handle test readiness logic safely
  useEffect(() => {
    if (format_type !== "DYNAMIC" && subjects.length) {
      let ready = true;
      subjects.forEach(({ sections }) => {
        sections.forEach(({ questions, no_of_questions }) => {
          if (questions.length !== no_of_questions) {
            ready = false;
          }
        });
      });
      setTestReady(ready);
    }
  }, [format_type, subjects, setTestReady]);

  // Subject colors for variety
  const subjectColors = [
    { gradient: 'from-blue-300 to-blue-500', bg: 'bg-blue-400' },
    { gradient: 'from-purple-300 to-purple-500', bg: 'bg-purple-400' },
    { gradient: 'from-emerald-300 to-emerald-500', bg: 'bg-emerald-400' },
    { gradient: 'from-orange-300 to-orange-500', bg: 'bg-orange-400' },
  ];

  // Professional Subject Header Component
  const SubjectHeader = ({ subjectName, sections, colorIndex }) => {
    const totalQuestions = sections.reduce((acc, s) => acc + s.no_of_questions, 0);
    const completedQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);
    const totalDuration = sections.reduce((acc, s) => acc + s.duration, 0);
    const color = subjectColors[colorIndex % subjectColors.length];

    return (
      <div className={`relative bg-gradient-to-r ${color.gradient} rounded-t-lg px-5 py-4 -mx-6 -mt-6 mb-4 overflow-hidden`}>
        {/* Decorative Circles */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full border-4 border-white"></div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full border-4 border-white"></div>
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: Subject Info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow">
              <BookOutlined className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{subjectName}</h3>
              <p className="text-white/80 text-sm">
                {sections.length} Section{sections.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Right: Stats Badges */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm flex items-center gap-2">
              <FileTextOutlined className="text-white text-sm" />
              <span className="text-white text-sm">
                <span className="font-bold">{completedQuestions}</span>
                <span className="text-white/70">/{totalQuestions}</span>
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm flex items-center gap-2">
              <ClockCircleOutlined className="text-white text-sm" />
              <span className="text-white text-sm font-bold">{totalDuration} min</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Section Card Component
  const SectionCard = ({ section, subjectInfo, colorIndex }) => {
    const { id: section_id, name: section_name, duration, questions, no_of_questions } = section;
    const isComplete = questions.length === no_of_questions;
    const progress = Math.round((questions.length / no_of_questions) * 100);

    return (
      <div
        onClick={() => {
          setSelectedSection({
            ...subjectInfo,
            section_name,
            section_id,
            questions,
            no_of_questions,
            duration,
          });
          setSelectedRowKeys(questions.map((val) => Number(val)));
        }}
        className={`
          relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 bg-white
          ${isComplete
            ? 'border-green-300 hover:border-green-400 hover:shadow-lg hover:shadow-green-100'
            : 'border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100'
          }
        `}
      >
        {/* Status Badge */}
        {/* <div className="absolute -top-2 -right-2">
          {isComplete ? (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 shadow">
              <CheckCircleFilled className="text-white text-xs" />
            </span>
          ) : (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 shadow">
              <ExclamationCircleFilled className="text-white text-xs" />
            </span>
          )}
        </div> */}

        {/* Section Name */}
        <h4 className="font-semibold text-gray-800 mb-3">{section_name}</h4>

        {/* Stats */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <ClockCircleOutlined className="text-gray-400" />
            <span className="text-gray-600">
              <span className="font-medium text-gray-800">{duration}</span> Minutes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-gray-400" />
            <span className="text-gray-600">
              <span className={`font-medium ${isComplete ? 'text-green-600' : 'text-blue-600'}`}>
                {questions.length}
              </span>
              <span className="text-gray-400"> / </span>
              <span className="font-medium text-gray-800">{no_of_questions}</span> Questions
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {/* <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Progress</span>
            <span className={`font-medium ${isComplete ? 'text-green-600' : 'text-blue-600'}`}>
              {progress}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div> */}
      </div>
    );
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm">
          <Spin size="large" />
        </div>
      )}
      {format_type === "DYNAMIC" ? (
    <Empty description="Questions will be added dynamically for subjects and sections." />
  ) : (
    <div className={selectedSection === "none" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}>
      {selectedSection === "none" ? (
        subjects
          .sort((a, b) => a.order - b.order)
          .map(
            ({
              id: subject_id,
              course_subject: course_subject_id,
              name: subject_name,
              order,
              sections,
            }, index) => (
              <div
                key={subject_id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden"
              >
                <SubjectHeader
                  subjectName={subject_name}
                  sections={sections}
                  colorIndex={index}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <SectionCard
                        key={section.id}
                        section={section}
                        subjectInfo={{
                          subject_name,
                          subject_id,
                          test_id,
                          course_subject_id,
                        }}
                        colorIndex={index}
                      />
                    ))}
                </div>
              </div>
            )
          )
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden">
          {/* Selected Subject Header */}
          <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg px-5 py-4 -mx-6 -mt-6 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedSection("none")}
                  className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all shadow-sm"
                >
                  <LeftOutlined />
                </button>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">{selectedSection.section_name}</h3>
                  <p className="text-white/80 text-sm">{selectedSection.subject_name}</p>
                </div>
              </div>

              <div className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm border border-white/10">
                <FileTextOutlined />
                <span>{selectedRowKeys.length} / {selectedSection.no_of_questions}</span>
              </div>
            </div>
          </div>

          {dataSource.length === 0 ? (
            <EmptyTableComponent
              sectionDetails={selectedSection}
              dataSource={dataSource}
              selectedRowKeys={selectedRowKeys}
              setSelectedRowKeys={setSelectedRowKeys}
              setSelectedSection={setSelectedSection}
              selectedSection={selectedSection}
              updated={updated}
              setUpdated={setUpdated}
              total={total}
              setCurrent={setCurrent}
              role={role}
              topics={topics}
              descSearch={descSearch}
              setDescSearch={setDescSearch}
              setDataSource={setDataSource}
              current={current}
              pageSize={pageSize}
              setPageSize={setPageSize}
            />
          ) : (
            <TableComponent
              sectionDetails={selectedSection}
              dataSource={dataSource}
              selectedRowKeys={selectedRowKeys}
              setSelectedRowKeys={setSelectedRowKeys}
              setSelectedSection={setSelectedSection}
              selectedSection={selectedSection}
              updated={updated}
              setUpdated={setUpdated}
              total={total}
              setCurrent={setCurrent}
              role={role}
              topics={topics}
              descSearch={descSearch}
              setDescSearch={setDescSearch}
              setDataSource={setDataSource}
              current={current}
              pageSize={pageSize}
              setPageSize={setPageSize}
            />
          )}
        </div>
      )}
    </div>
      )}
    </>
  );
}

export default TestSubjectInfo;
