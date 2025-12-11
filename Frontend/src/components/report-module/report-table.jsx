import Loading from "@/app/loading";
import { getQuestionDetails } from "@/app/services/authService";
import {
  alphatbetArray,
  questionSubTypeMap,
  questionTypeMap,
  timeInMMSS,
} from "@/utils/utils";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { Modal, Popover, Table,Button, Radio, Checkbox } from "antd";
import React, { useEffect, useState } from "react";
import MathContent from "../MathContent";
import BookmarkIcon from "../../../public/bookmark2.svg";
import Image from "next/image";
import RaiseDoubtModal from "../RaiseDoubtModal";
import { usePathname } from "next/navigation";
import GridInOptions from "../question-list/gridin-options";


const buildOptions = (data, field) =>
  [...new Set(data.map((q) => q[field]).filter(Boolean))].map((t) => ({
    label: t,
    value: t,
  }));

function ReportTable({ sectionData , testSubmissionId}) {
   if (!sectionData) {
    console.warn("ReportTable: sectionData is undefined");
    return null; // or return <Loading />
  }
  console.log("sectionData",sectionData.test_type)
  
  const pathname = usePathname();
  const role = pathname.split("/")[1];
  const { questions_data = [], section_id, test_id, course_subject_id, test_type } =
  sectionData || {};


  const [showModal, setShowModal] = useState(null);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null); // NEW
  const [modalData, setModalData] = useState({});
  const [selectedOptions, setSelectedOptions] = useState([]);

  // Fetch details of the selected question
  useEffect(() => {
       let params = {};

if (sectionData.test_type === "FULL_LENGTH_TEST") {
  params.test_submission_id = testSubmissionId;
} else {
  params.practice_test_result_id = testSubmissionId;
}

  console.log("params.test_submission_id",params.test_submission_id)
  console.log("params.practice_test_result_id",params.practice_test_result_id)
    if (currentQuestionId) {
      getQuestionDetails(currentQuestionId,params).then((res) => {
        setModalData(res.data.detail);
      });
    }
  }, [currentQuestionId]);

  // Open modal & set index when question is clicked
  const handleQuestionClick = (record, index) => {
    setShowModal(record.sr_no);
    setCurrentQuestionId(record.question_id);
    setCurrentQuestionIndex(index);
    let selectedQuestion = questions_data.find(
      (question) => question.question_id === record.question_id
    );
    setSelectedOptions(selectedQuestion.selected_options);
  };

  // Navigate between questions
  const handleNavigation = (direction) => {
    const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < questions_data.length) {
      const newQuestion = questions_data[newIndex];
      setShowModal(newQuestion.sr_no);
      setCurrentQuestionId(newQuestion.question_id);
      setCurrentQuestionIndex(newIndex);
      setSelectedOptions(newQuestion.selected_options);
    }
  };

  const questionViewCols = [
    role !== "student" && {
    title: "Question Id",
    dataIndex: "db_Srno",
    key: "db_Srno",
    align: "center",
    sorter: (a, b) => a.db_Srno - b.db_Srno,
    render: (value) => <span className="font-semibold text-gray-700">{value}</span>,
    },
  {
      title: "Q#",
      dataIndex: "sr_no",
      key: "sr_no",
      align: "center",
      sorter: (a, b) => a.sr_no - b.sr_no,
      render: (value) => (
        <div className=" text-blue-600 cursor-pointer">
          <Popover content="Click to see the question details">
            {value}
          </Popover>
        </div>
      ),
    },
    {
      title: "Difficulty",
      dataIndex: "difficulty",
      key: "difficulty",
      align: "center",
    
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Radio.Group
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <Radio value="VERY_EASY">Very Easy</Radio>
            <Radio value="EASY">Easy</Radio>
            <Radio value="MEDIUM">Moderate</Radio>
            <Radio value="HARD">Hard</Radio>
            <Radio value="VERY_HARD">Very Hard</Radio>
          </Radio.Group>
          <div style={{ marginTop: 8, textAlign: "right" }}>
            <Button
              size="small"
              onClick={() => {
                clearFilters();
                confirm();
              }}
              style={{ marginRight: 8 }}
            >
              Reset
            </Button>
            <Button type="primary" size="small" onClick={() => confirm()}>
              OK
            </Button>
          </div>
        </div>
      ),
      onFilter: (value, record) => record.difficulty === value,
    },
  // {
  //     title: "Test Type",
  //     dataIndex: "test_type",
  //     key: "test_type",
  //     align: "center",
 
  //     render: (value) =>
  //       value === "SELF_PRACTICE_TEST" ? "Practice Questions" : value,
  //     filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
  //       <div style={{ padding: 8 }}>
  //         <Radio.Group
  //           value={selectedKeys[0]}
  //           onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
  //           style={{ display: "flex", flexDirection: "column", gap: 4 }}
  //         >
  //           {[...new Set(questions_data.map((q) => q.test_type))].map((t) => (
  //             <Radio key={t} value={t}>
  //               {t === "SELF_PRACTICE_TEST" ? "Practice Questions" : t}
  //             </Radio>
  //           ))}
  //         </Radio.Group>
  //         <div style={{ marginTop: 8, textAlign: "right" }}>
  //           <Button size="small" onClick={() => { clearFilters(); confirm(); }} style={{ marginRight: 8 }}>
  //             Reset
  //           </Button>
  //           <Button type="primary" size="small" onClick={() => confirm()}>
  //             OK
  //           </Button>
  //         </div>
  //       </div>
  //     ),
  //     onFilter: (value, record) => record.test_type === value,
  //   },

    {
      title: "Sub Topic",
      dataIndex: "sub_topic",
      key: "sub_topic",
      align: "center",
    
      render: (value) => value || "-",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8, width: 200 }}>
          <Checkbox.Group
            value={selectedKeys}
            options={buildOptions(questions_data, "sub_topic")}
            onChange={(vals) => setSelectedKeys(vals)}
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          />
          <div style={{ marginTop: 8, textAlign: "right" }}>
            <Button size="small" onClick={() => { clearFilters(); confirm(); }} style={{ marginRight: 8 }}>
              Reset
            </Button>
            <Button type="primary" size="small" onClick={() => confirm()}>
              OK
            </Button>
          </div>
        </div>
      ),
      onFilter: (value, record) => record.sub_topic === value,
    },
    
     {
      title: "Question Type",
      dataIndex: "question_type",
      key: "question_type",
      align: "center",
      render: (text) => questionTypeMap[text],
     
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8, width: 200 }}>
          <Checkbox.Group
            value={selectedKeys}
            options={buildOptions(questions_data, "question_type")}
            onChange={(vals) => setSelectedKeys(vals)}
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          />
          <div style={{ marginTop: 8, textAlign: "right" }}>
            <Button size="small" onClick={() => { clearFilters(); confirm(); }} style={{ marginRight: 8 }}>
              Reset
            </Button>
            <Button type="primary" size="small" onClick={() => confirm()}>
              OK
            </Button>
          </div>
        </div>
      ),
      onFilter: (value, record) => record.question_type === value,
    },
   {
      title: "Topic Area",
      dataIndex: "topic",
      key: "topic",
      align: "center",
      
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8, width: 200 }}>
          <Checkbox.Group
            value={selectedKeys}
            options={buildOptions(questions_data, "topic")}
            onChange={(vals) => setSelectedKeys(vals)}
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          />
          <div style={{ marginTop: 8, textAlign: "right" }}>
            <Button size="small" onClick={() => { clearFilters(); confirm(); }} style={{ marginRight: 8 }}>
              Reset
            </Button>
            <Button type="primary" size="small" onClick={() => confirm()}>
              OK
            </Button>
          </div>
        </div>
      ),
      onFilter: (value, record) => record.topic === value,
    },
   {
  title: "Result",
  dataIndex: "result",
  key: "result",
  align: "center",
 
  render: (value, rowData) => {
    return rowData.is_skipped ? (
      <div className="h-3 w-3 border border-black rounded-full mx-auto"></div>
    ) : value ? (
      <CheckCircleTwoTone twoToneColor="#52c41a" />
    ) : (
      <CloseCircleTwoTone twoToneColor="#ff0000" />
    );
  },
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
    <div style={{ padding: 8 }}>
      <Radio.Group
        value={selectedKeys[0]}
        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
        style={{ display: "flex", flexDirection: "column", gap: 4 }}
      >
        <Radio value="CORRECT">Correct</Radio>
        <Radio value="WRONG">Wrong</Radio>
        <Radio value="SKIPPED">Skipped</Radio>
      </Radio.Group>
      <div style={{ marginTop: 8, textAlign: "right" }}>
        <Button
          size="small"
          onClick={() => {
            clearFilters();
            confirm();
          }}
          style={{ marginRight: 8 }}
        >
          Reset
        </Button>
        <Button type="primary" size="small" onClick={() => confirm()}>
          OK
        </Button>
      </div>
    </div>
  ),
  onFilter: (value, record) => {
    if (value === "CORRECT") return record.result === true && !record.is_skipped;
    if (value === "WRONG") return record.result === false && !record.is_skipped;
    if (value === "SKIPPED") return record.is_skipped === true;
    return true;
  },
},
    {
      title: "Times Viewed",
      dataIndex: "times_visited",
      key: "times_visited",
      align: "center",
      sorter: (a, b) => a.times_visited - b.times_visited,
    },
    {
      title: (
        <div>
          Time on 1<sup>st</sup> Visit
        </div>
      ),
      dataIndex: "first_time_taken",
      key: "first_time_taken",
      align: "center",
      render: (value, rowData) => {
        return rowData.times_visited ? timeInMMSS(value) : "-";
      },
      sorter: (a, b) => a.times_visited - b.times_visited,
    },
    {
      title: (
        <div>
          Time on 2<sup>nd</sup> Visit
        </div>
      ),
      dataIndex: "second_time_taken",
      key: "second_time_taken",
      align: "center",
      render: (value, rowData) => {
        return rowData.times_visited > 1 ? timeInMMSS(value) : "-";
      },
      sorter: (a, b) => a.second_time_taken - b.second_time_taken,
      hidden: test_type === "PRACTICE_TEST",
    },
    {
      title: (
        <div>
          Time on 3<sup>rd</sup> Visit
        </div>
      ),
      dataIndex: "third_time_taken",
      key: "third_time_taken",
      align: "center",
      render: (value, rowData) => {
        return rowData.times_visited > 2 ? timeInMMSS(value) : "-";
      },
      sorter: (a, b) => a.third_time_taken - b.third_time_taken,
      hidden: test_type === "PRACTICE_TEST",
    },
    {
  title: "Total Time",
  key: "total_time",
  align: "center",
  render: (_, rowData) => {
    const totalSeconds =
      (rowData.first_time_taken || 0) +
      (rowData.second_time_taken || 0) +
      (rowData.third_time_taken || 0);

    return rowData.times_visited ? timeInMMSS(totalSeconds) : "-";
  },
  sorter: (a, b) => {
    const aTotal =
      (a.first_time_taken || 0) +
      (a.second_time_taken || 0) +
      (a.third_time_taken || 0);
    const bTotal =
      (b.first_time_taken || 0) +
      (b.second_time_taken || 0) +
      (b.third_time_taken || 0);

    return aTotal - bTotal;
  },
},

    {
  title: 'Selection History',
  dataIndex: 'selection_history',
  key: 'selection_history',
  render: (selection_history) => {
    if (!selection_history || selection_history.length === 0) return '-';
    // Convert selected option indexes (like [0,2]) into letters (A,B)
    const alphabets = ['A', 'B', 'C', 'D', 'E'];
    const allSelections = selection_history
      .filter((item) => item.selected_options && item.selected_options.length > 0)
      .map((item) =>
        item.selected_options.map((opt) => alphabets[opt]).join(',')
      );
    return allSelections.join(', ');
  },
},

    {
      title: "Marked",
      dataIndex: "marked",
      align: "center",
      key: "marked",
      render: (value) =>
        value ? (
          <Image
            src={BookmarkIcon}
            height={14}
            width={14}
            className="mx-auto"
          />
        ) : (
          "-"
        ),
    },
  ].filter(Boolean);;

  return (
    <>
      <Table
        pagination={false}
        className="my-4"
        columns={questionViewCols}
        dataSource={questions_data}
        onRow={(record, rowIndex) => ({
          onClick: () => handleQuestionClick(record, rowIndex),
        })}
      />
      <Modal
        width={modalData.question_type === "MCQ" ? "80rem" : "64rem"}
        open={showModal}
        title={
  role === "student"
    ? `Reviewing Question ${currentQuestionIndex + 1}`
    : `Reviewing Question ${currentQuestionIndex + 1} (Question Id : ${modalData?.srno})`
}


        onCancel={() => {
          setShowModal(false);
          setModalData({});
          setCurrentQuestionId(null);
          setSelectedOptions([]);
          setCurrentQuestionIndex(null);
        }}
        footer={
          <div className="flex justify-between">
            <button
  disabled={!questions_data.length || currentQuestionIndex === 0}
  onClick={() => handleNavigation(-1)}
  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
>
  Previous
</button>

<button
  disabled={
    !questions_data.length ||
    currentQuestionIndex === questions_data.length - 1
  }
  onClick={() => handleNavigation(1)}
  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
>
  Next
</button>
          </div>
        }
      >
        {Object.keys(modalData).length === 0 ? (
          <Loading />
        ) : (
         <>

         {/* ===== Question Meta Info (Compact Inline) ===== */}
{/* ===== Question Meta Info (Horizontal Line) ===== */}
<div className="w-full h-[2px] bg-gray-300 mt-2"></div>
<div className="flex items-center flex-wrap gap-10 my-2 text-xs md:text-sm text-gray-800">

  <span className="flex items-center gap-1">
    <span className="font-bold">Difficulty:</span> {modalData.difficulty || "N/A"}
  </span>

  <span className="text-gray-400">|</span>

  <span className="flex items-center gap-1">
    <span className="font-bold">Question Type:</span> {modalData.question_type || "N/A"}
  </span>

  <span className="text-gray-400">|</span>

  <span className="flex items-center gap-1">
    <span className="font-bold">Topic:</span> {modalData.topic || "N/A"}
  </span>

  <span className="text-gray-400">|</span>

  <span className="flex items-center gap-1">
    <span className="font-bold">Sub Topic:</span> {modalData.sub_topic || "N/A"}
  </span>

  <span className="text-gray-400">|</span>

  <span className="flex items-center gap-1">
    <span className="font-bold">Total Time:</span>
    {modalData.time_taken ? timeInMMSS(modalData.time_taken) : "0s"}
  </span>

</div>

 <div className="w-full h-[2px] bg-gray-300 mt-2"></div>




  <div className="w-full flex gap-8">
    {/* Reading Comprehension Passage */}
    {modalData.question_subtype === "READING_COMPREHENSION" && (
      <div className="flex-1 mx-auto border overflow-y-scroll overflow-x-hidden max-h-full">
        <MathContent
          cls="p-4"
          content={modalData?.reading_comprehension_passage}
        />
      </div>
    )}

    {/* Question Description */}
    <div className="flex-1 my-4 question-desc">
      <MathContent cls="px-2" content={modalData.description} />
    </div>
  </div>

  {/* MCQ Options */}
  {modalData.question_type === "MCQ" && (
    <div>
      <div className="font-bold my-3">Options:</div>

      <div className="grid grid-cols-1 lg:grid-cols-2 auto-rows-fr gap-x-8 gap-y-2">
        {modalData.options?.map(({ description, is_correct }, index) => {
          const isSelected = (selectedOptions ?? []).includes(index);
          const isCorrect = is_correct;

          let optionClass =
            "bg-white border-2 border-r-4 rounded-lg px-2 py-5";

          if (isSelected && isCorrect)
            optionClass =
              "font-bold border-2 bg-green-200 border-r-4 rounded-lg px-2 py-5";
          else if (isSelected)
            optionClass =
              "font-bold border-2 bg-red-200 border-r-4 rounded-lg px-2 py-5";
          else if (isCorrect)
            optionClass =
              "font-bold border-2 bg-green-200 border-r-4 rounded-lg px-2 py-5";

          return (
            <div key={index} className="flex w-full items-center gap-1">
              <div>{alphatbetArray[index]}.</div>
              <div className="flex-1">
                <MathContent cls={optionClass} content={description} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}

  {/* Grid-In Type Question */}
  {modalData.question_type === "GRIDIN" && (
    <div>
      <div className="font-bold my-3">Your Answer:</div>
      <span className="border-2 border-r-4 rounded-lg px-2 py-1">
        {selectedOptions}
      </span>
      <GridInOptions question={modalData} />
    </div>
  )}

  {/* Explanation */}
  {modalData.explanation && (
    <>
      <div className="font-bold mt-4 mb-2">Explanation:</div>
      <div className="bg-white border-2 p-2 rounded-md max-h-80 overflow-auto mb-3">
        <MathContent cls="p-2" content={modalData.explanation} />
      </div>
    </>
  )}

  {/* Raise Doubt Button */}
  {/* {role === "student"  && test_type === "FULL_LENGTH_TEST" && (
    <div className="w-full flex justify-center my-8">
      <RaiseDoubtModal
        question={currentQuestionId}
        section={section_id}
        course_subject={course_subject_id}
        test={test_id}
      />
    </div>
  )} */}
  {role === "student"  &&  (
    <div className="w-full flex justify-center my-8">
      <RaiseDoubtModal
        question={currentQuestionId}
        section={section_id}
        course_subject={course_subject_id}
        test={test_id}
      />
    </div>
  )}
</>

        )}
      </Modal>
    </>
  );
}

export default ReportTable;
