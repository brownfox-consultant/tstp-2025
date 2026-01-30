import { Tabs, Table, Tag, Space, Input, Button, Modal, Segmented, Select, Row, Col, message } from "antd";
import React, { useState, useMemo, useEffect } from "react";
import { CheckCircleFilled, CloseCircleFilled, CalculatorOutlined, CalendarOutlined, ClockCircleOutlined, ThunderboltOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons";
import MathContent from "./MathContent"; 

const { Option } = Select;

function StudentQuestionsComponent() {
  // Hierarchy Filters
  const [selectedCourse, setSelectedCourse] = useState("SAT");
  const [selectedSubject, setSelectedSubject] = useState("Math");
  
  const [activeTestType, setActiveTestType] = useState("FULL_LENGTH_TEST");
  
  // existing filters
  const [statusFilter, setStatusFilter] = useState("ALL"); 
  const [searchText, setSearchText] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [topicFilter, setTopicFilter] = useState("ALL");

  // Pagination State
  const [fullLengthPage, setFullLengthPage] = useState(1);
  const [fullLengthPageSize, setFullLengthPageSize] = useState(10);
  
  const [practicePage, setPracticePage] = useState(1);
  const [practicePageSize, setPracticePageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  
  // Personal Notes State
  const [questionNotes, setQuestionNotes] = useState({});
  const [currentNote, setCurrentNote] = useState("");

  // Constants for Data Generation
  const coursesList = ["SAT", "ACT"];
  // Map Course -> Subjects
  const subjectsMap = {
      "SAT": ["Math", "English"],
      "ACT": ["Math", "English"]
  };
  
  // Topics Map (Subject -> Topics)
  const topicsMap = {
      "Math": ["Algebra", "Geometry", "Arithmetic", "Trigonometry"],
      "English": ["Reading Component", "Grammar", "Vocabulary"],
      "Science": ["Data Representation", "Research Summaries", "Conflicting Viewpoints"]
  };

  const difficultiesList = ["EASY", "MEDIUM", "HARD"];

  // Update selected subject when course changes if current subject invalid
  useEffect(() => {
      const validSubjects = subjectsMap[selectedCourse];
      if (!validSubjects.includes(selectedSubject)) {
          setSelectedSubject(validSubjects[0]);
      }
  }, [selectedCourse]);


  // Generate dummy data
  const dummyQuestions = useMemo(() => {
    const questions = [];
    const types = ["MCQ", "GRIDIN"];
    const statuses = ["CORRECT", "INCORRECT", "SKIPPED"];

    const generateOptions = (questionId) => [
       { label: "A", text: `Option A for Q${questionId}` },
       { label: "B", text: `Option B for Q${questionId}` },
       { label: "C", text: `Option C for Q${questionId}` },
       { label: "D", text: `Option D for Q${questionId}` },
    ];

    const assignAnswers = (status, options) => {
        const correctIndex = Math.floor(Math.random() * 4);
        const correctOpt = options[correctIndex].label;
        let userOpt = null;
        if (status === "CORRECT") userOpt = correctOpt;
        else if (status === "INCORRECT") userOpt = options[(correctIndex + 1) % 4].label;
        return { correctOpt, userOpt };
    };

    const getRandomDate = () => {
        const start = new Date(2024, 0, 1);
        const end = new Date();
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    // Helper to generate a batch of questions
    const generateBatch = (startId, count, course, subject, testTypeBase) => {
        for (let i = 0; i < count; i++) {
            const id = startId + i;
            const difficulty = difficultiesList[id % 3];
            
            // Pick Topic based on Subject
            const validTopics = topicsMap[subject] || ["General"];
            const topic = validTopics[id % validTopics.length];
            const subTopic = "General Subtopic"; // Simplified for this batch

            const currentStatus = statuses[id % 3];
            const currentOptions = generateOptions(id);
            const { correctOpt, userOpt } = assignAnswers(currentStatus, currentOptions);
            const timeSpent = Math.floor(Math.random() * 100) + 20;

            const testName = testTypeBase === "FULL_LENGTH_TEST" 
                ? `${course} Full Test #${(id % 5) + 1}`
                : `${course} Practice Set #${(id % 10) + 1}`;

            questions.push({
                id: id,
                course: course,
                subject: subject,
                test_name: testName,
                description: `${course} ${subject} Q${id}: Solve this problem...`,
                difficulty: difficulty,
                topic: topic,
                sub_topic: subTopic,
                question_type: types[id % 2],
                status: currentStatus,
                is_marked: id % 10 === 0,
                test_type: testTypeBase,
                options: currentOptions,
                correct_option: correctOpt,
                user_selected_option: userOpt,
                attempted_date: getRandomDate(),
                time_spent: timeSpent,
                ideal_time: 60,
                calculator_allowed: id % 3 !== 0,
            });
        }
    };

    // Generate Data Distribution
    // Full Length
    generateBatch(1, 50, "SAT", "Math", "FULL_LENGTH_TEST");
    generateBatch(51, 50, "SAT", "English", "FULL_LENGTH_TEST");
    generateBatch(101, 50, "ACT", "Math", "FULL_LENGTH_TEST");
    generateBatch(151, 50, "ACT", "English", "FULL_LENGTH_TEST");

    // Practice
    generateBatch(201, 50, "SAT", "Math", "SELF_PRACTICE_TEST");
    generateBatch(251, 50, "SAT", "English", "SELF_PRACTICE_TEST");
    generateBatch(301, 50, "ACT", "Math", "SELF_PRACTICE_TEST");
    generateBatch(351, 50, "ACT", "English", "SELF_PRACTICE_TEST");

    return questions;
  }, []);

  const getFilteredData = (testType) => {
    return dummyQuestions.filter(q => {
        // 0. Hierarchy Filters (Course & Subject)
        if (q.course !== selectedCourse) return false;
        if (q.subject !== selectedSubject) return false;

        // 1. Test Type (Tab)
        if (q.test_type !== testType) return false;
        
        // 2. Status Filter
        if (statusFilter !== "ALL") {
             if (statusFilter === "MARKED") {
                if (!q.is_marked) return false;
            } else {
                if (q.status !== statusFilter) return false;
            }
        }

        // 3. Search
        if (searchText) {
            const lowerSearch = searchText.toLowerCase();
            if (!q.description.toLowerCase().includes(lowerSearch) && 
                !q.test_name.toLowerCase().includes(lowerSearch) &&
                !q.id.toString().includes(lowerSearch)) {
                return false;
            }
        }

        // 4. Difficulty
        if (difficultyFilter !== "ALL" && q.difficulty !== difficultyFilter) return false;

        // 5. Topic
        if (topicFilter !== "ALL" && q.topic !== topicFilter) return false;
        
        return true;
    });
  };

  const difficultyWeight = { "EASY": 1, "MEDIUM": 2, "HARD": 3 };

  const columns = [
    {
      title: "Que. Id",
      dataIndex: "id",
      key: "id",
      width: 90,
      sorter: (a, b) => a.id - b.id,
      responsive: ['md'],
    },
    {
      title: "Date",
      dataIndex: "attempted_date",
      key: "attempted_date",
      width: 110,
      render: (date) => <span className="text-gray-500 text-sm whitespace-nowrap">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>,
      sorter: (a, b) => a.attempted_date - b.attempted_date,
      responsive: ['lg'],
    },
    {
      title: "Test Name",
      dataIndex: "test_name",
      key: "test_name",
      width: 190,
      render: (text) => <span className="font-medium text-gray-700">{text}</span>,
      sorter: (a, b) => a.test_name.localeCompare(b.test_name),
      responsive: ['sm'],
    },
    {
      title: "Question",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => <div dangerouslySetInnerHTML={{ __html: text}} className="truncate" />,
    },
    {
      title: "Status",
      key: "status",
      width: 130,
      filters: [
        { text: 'Correct', value: 'CORRECT' },
        { text: 'Incorrect', value: 'INCORRECT' },
        { text: 'Skipped', value: 'SKIPPED' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (_, record) => {
        const { status, is_marked } = record;
        let color = "default";
        switch (status) {
          case "CORRECT":
            color = "success";
            break;
          case "INCORRECT":
            color = "error";
            break;
          case "SKIPPED":
            color = "warning";
            break;
          default:
            color = "default";
        }

        return (
          <Space direction="vertical" size={2}>
            <Tag color={color}>{status}</Tag>
            {is_marked && <Tag color="processing">MARKED</Tag>}
          </Space>
        );
      },
    },
    {
      title: "Time",
      key: "time_spent",
      width: 100,
      sorter: (a, b) => a.time_spent - b.time_spent,
      render: (_, record) => (
        <span className={record.time_spent > record.ideal_time ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
          {record.time_spent}s
        </span>
      ),
      responsive: ['md'],
    },
    {
      title: "Difficulty",
      dataIndex: "difficulty",
      key: "difficulty",
      width: 100,
      sorter: (a, b) => difficultyWeight[a.difficulty] - difficultyWeight[b.difficulty],
      render: (text) => {
        let color = text === "EASY" ? "green" : text === "MEDIUM" ? "orange" : "red";
        return <Tag color={color}>{text}</Tag>;
      },
      responsive: ['lg'],
    },
    {
      title: "Topic",
      key: "topic",
      width: 150,
      sorter: (a, b) => a.topic.localeCompare(b.topic),
      render: (_, record) => (
          <div className="flex flex-col text-xs">
              <span className="font-semibold">{record.topic}</span>
              <span className="text-gray-500">{record.sub_topic}</span>
          </div>
      ),
      responsive: ['xl'],
    },
    {
      title: "Type",
      dataIndex: "question_type",
      key: "question_type",
      width: 80,
      render: (text) => <Tag>{text}</Tag>,
      responsive: ['lg'],
    },
  ];

  const RenderShowTotal = ({ total, range, setPage }) => {
    const [inputVal, setInputVal] = useState("");

    const handleGo = () => {
      const p = parseInt(inputVal, 10);
      if (!isNaN(p) && p > 0) {
        setPage(p);
        setInputVal(""); 
      }
    };

    return (
      <div className="flex items-center flex-wrap gap-2" style={{ marginRight: 20 }}>
        <span className="text-sm">
          Showing {range[0]}–{range[1]} of {total}
        </span>
        <span className="hidden sm:inline text-gray-400">|</span>
        <span className="hidden sm:inline text-sm">Go to page:</span>
        <Input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onPressEnter={handleGo}
          size="small"
          style={{ width: 50, marginRight: 8 }}
        />
        <Button 
            type="primary" 
            size="small" 
            onClick={handleGo} 
            style={{ backgroundColor: "#F59E0B", borderColor: "#F59E0B" }} 
        >
          Go
        </Button>
      </div>
    );
  };

  const handleRowClick = (record) => {
    setSelectedQuestion(record);
    setCurrentNote(questionNotes[record.id] || "");
    setIsModalOpen(true);
  };

  const handleSaveNote = () => {
    if (selectedQuestion) {
        setQuestionNotes(prev => ({
            ...prev,
            [selectedQuestion.id]: currentNote
        }));
        message.success("Note saved successfully!");
    }
  };

  const filterOptions = [
      { label: 'All', value: 'ALL' },
      { label: <span className="text-green-600">Correct</span>, value: 'CORRECT' },
      { label: <span className="text-red-500">Incorrect</span>, value: 'INCORRECT' },
      { label: <span className="text-orange-500">Skipped</span>, value: 'SKIPPED' },
      { label: <span className="text-blue-500">Marked</span>, value: 'MARKED' },
  ];

  const currentTopics = topicsMap[selectedSubject] || [];

  return (
    <>
      {/* Course & Subject Selection */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
          <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                  <div className="text-xs text-gray-500 uppercase font-bold mb-2">Select Course</div>
                  <Segmented
                    options={coursesList}
                    value={selectedCourse}
                    onChange={setSelectedCourse}
                    size="large"
                    block
                  />
              </Col>
              
              <Col xs={24} md={12}>
                   <div className="text-xs text-gray-500 uppercase font-bold mb-2">Select Subject</div>
                   <Segmented
                      options={subjectsMap[selectedCourse]}
                      value={selectedSubject}
                      onChange={setSelectedSubject}
                      size="large"
                      block 
                   />
              </Col>
          </Row>
      </div>

      {/* Filters Row */}
      <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <Row gutter={[12, 12]} align="middle">
              {/* Status Segment */}
              <Col xs={24} lg={10}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-gray-600 font-medium whitespace-nowrap text-sm">Filter Status:</span>
                    <div className="w-full sm:w-auto overflow-x-auto">
                      <Segmented 
                          options={filterOptions} 
                          value={statusFilter} 
                          onChange={setStatusFilter}
                          size="middle"
                      />
                    </div>
                </div>
              </Col>
              
              {/* Search Bar */}
              <Col xs={24} sm={12} lg={6}>
                 <Input 
                    placeholder="Search Question..." 
                    prefix={<SearchOutlined className="text-gray-400"/>} 
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                 />
              </Col>

              {/* Advanced Dropdowns */}
              <Col xs={12} sm={6} lg={4}>
                  <Select 
                    placeholder="Difficulty" 
                    style={{ width: '100%' }}
                    value={difficultyFilter}
                    onChange={setDifficultyFilter}
                  >
                      <Option value="ALL">All Difficulties</Option>
                      {difficultiesList.map(d => <Option key={d} value={d}>{d}</Option>)}
                  </Select>
              </Col>
              <Col xs={12} sm={6} lg={4}>
                  <Select 
                    placeholder="Topic" 
                    style={{ width: '100%' }}
                    value={topicFilter}
                    onChange={setTopicFilter}
                  >
                      <Option value="ALL">All Topics</Option>
                      {currentTopics.map(t => <Option key={t} value={t}>{t}</Option>)}
                  </Select>
              </Col>
          </Row>
      </div>

      {/* Performance Summary Card */}
      <div className="mb-4 bg-indigo-50 border border-indigo-100 p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white rounded-full text-indigo-600 shadow-sm"><FilterOutlined className="text-lg" /></div>
                 <div>
                    <div className="text-xs text-indigo-500 uppercase font-bold tracking-wider">Showing</div>
                    <div className="text-xl font-bold text-gray-800">{getFilteredData(activeTestType).length} Questions</div>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white rounded-full text-green-600 shadow-sm"><CheckCircleFilled className="text-lg" /></div>
                 <div>
                    <div className="text-xs text-indigo-500 uppercase font-bold tracking-wider">Accuracy</div>
                    <div className="text-xl font-bold text-gray-800">
                        {Math.round((getFilteredData(activeTestType).filter(q => q.status === "CORRECT").length / (getFilteredData(activeTestType).length || 1)) * 100)}%
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white rounded-full text-blue-600 shadow-sm"><ClockCircleOutlined className="text-lg" /></div>
                 <div>
                    <div className="text-xs text-indigo-500 uppercase font-bold tracking-wider">Avg Time</div>
                    <div className="text-xl font-bold text-gray-800">
                        {Math.round(getFilteredData(activeTestType).reduce((acc, q) => acc + q.time_spent, 0) / (getFilteredData(activeTestType).length || 1))}s
                    </div>
                 </div>
              </div>
          </div>
      </div>

      {/* Questions Table */}
      <Tabs
        activeKey={activeTestType}
        onChange={(key) => {
            setActiveTestType(key);
            setFullLengthPage(1);
            setPracticePage(1);
        }}
        type="card"
        items={[
          {
            key: "FULL_LENGTH_TEST",
            label: "Full Length Test",
            children: (
              <Table 
                  dataSource={getFilteredData("FULL_LENGTH_TEST")} 
                  columns={columns} 
                  rowKey="id" 
                  onRow={(record) => ({
                    onClick: () => handleRowClick(record), 
                    style: { cursor: 'pointer' }
                  })}
                  pagination={{
                      current: fullLengthPage,
                      pageSize: fullLengthPageSize,
                      onChange: (page, pageSize) => {
                          setFullLengthPage(page);
                          setFullLengthPageSize(pageSize);
                      },
                      showTotal: (total, range) => <RenderShowTotal total={total} range={range} setPage={setFullLengthPage} />,
                      showSizeChanger: true,
                      pageSizeOptions: ["10", "25", "50", "100"],
                      position: ["topRight", "bottomRight"], 
                  }}
                  scroll={{ x: 800 }}
              />
            ),
          },
          {
            key: "SELF_PRACTICE_TEST",
            label: "Practice Test",
            children: (
               <Table 
                  dataSource={getFilteredData("SELF_PRACTICE_TEST")} 
                  columns={columns} 
                  rowKey="id" 
                  onRow={(record) => ({
                    onClick: () => handleRowClick(record),
                    style: { cursor: 'pointer' }
                  })}
                  pagination={{
                      current: practicePage,
                      pageSize: practicePageSize,
                      onChange: (page, pageSize) => {
                          setPracticePage(page);
                          setPracticePageSize(pageSize);
                      },
                      showTotal: (total, range) => <RenderShowTotal total={total} range={range} setPage={setPracticePage} />,
                      showSizeChanger: true,
                      pageSizeOptions: ["10", "25", "50", "100"],
                      position: ["topRight", "bottomRight"],
                  }}
                  scroll={{ x: 800 }}
              />
            ),
          },
        ]}
      />

      {/* Modal */}
      <Modal
        title={`Question Details (ID: ${selectedQuestion?.id})`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedQuestion && (
          <div className="space-y-6">
             {/* 1. Header Metadata (Test Name, Date) */}
             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-gray-100 p-3 rounded-md">
                <span className="font-semibold text-lg">{selectedQuestion.test_name}</span>
                <div className="flex items-center gap-2 text-gray-500">
                    <CalendarOutlined />
                    <span>Attempted on: {selectedQuestion.attempted_date.toLocaleDateString()}</span>
                </div>
             </div>

             {/* 2. Analytical Data (Time, Calc, Status) */}
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col items-center justify-center text-center">
                     <ClockCircleOutlined className="text-xl text-blue-500 mb-1" />
                     <span className="text-xs text-gray-500 uppercase">Time Spent</span>
                     <span className={`font-bold ${selectedQuestion.time_spent > selectedQuestion.ideal_time ? 'text-red-500' : 'text-green-600'}`}>
                         {selectedQuestion.time_spent}s <span className="text-xs font-normal text-gray-400">/ {selectedQuestion.ideal_time}s</span>
                     </span>
                 </div>

                 <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex flex-col items-center justify-center text-center">
                     <ThunderboltOutlined className="text-xl text-purple-500 mb-1" />
                     <span className="text-xs text-gray-500 uppercase">Difficulty</span>
                     <Tag color={selectedQuestion.difficulty === "HARD" ? "red" : selectedQuestion.difficulty === "MEDIUM" ? "orange" : "green"}>{selectedQuestion.difficulty}</Tag>
                 </div>

                 <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col items-center justify-center text-center">
                     <CalculatorOutlined className="text-xl text-gray-600 mb-1" />
                     <span className="text-xs text-gray-500 uppercase">Calculator</span>
                     <span className="font-semibold text-sm">{selectedQuestion.calculator_allowed ? "Allowed" : "Not Allowed"}</span>
                 </div>

                 <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex flex-col items-center justify-center text-center">
                     <span className="text-xs text-gray-500 uppercase mb-1">Status</span>
                     <Space direction="vertical" size={0}>
                        <Tag color={selectedQuestion.status === "CORRECT" ? "success" : selectedQuestion.status === "INCORRECT" ? "error" : "warning"}>{selectedQuestion.status}</Tag>
                     </Space>
                 </div>
             </div>

             {/* 3. Concept Info */}
             <div className="flex flex-wrap items-center gap-2 text-sm">
                 <span className="font-bold text-gray-700">Course:</span>
                 <Tag>{selectedQuestion.course}</Tag>
                 <span className="font-bold text-gray-700">Subject:</span>
                 <Tag>{selectedQuestion.subject}</Tag>
                 <span className="font-bold text-gray-700">Concept:</span>
                 <Tag>{selectedQuestion.topic}</Tag> 
             </div>

             <hr />

             {/* 4. Question Content */}
             <div>
                <h3 className="font-semibold mb-2 text-gray-800">Question:</h3>
                <div className="p-4 bg-white border border-gray-300 rounded shadow-sm text-lg" dangerouslySetInnerHTML={{ __html: selectedQuestion.description }} />
             </div>

             {/* 5. Options & Answers */}
             {selectedQuestion.question_type === "MCQ" && (
                 <div>
                    <h3 className="font-semibold mb-2 text-gray-800">Options:</h3>
                    <div className="space-y-3">
                        {selectedQuestion.options?.map((opt) => {
                            const isSelected = selectedQuestion.user_selected_option === opt.label;
                            const isCorrect = selectedQuestion.correct_option === opt.label;

                            let containerStyle = "border p-3 rounded-lg flex items-center gap-3 transition-all ";
                            let icon = null;

                            if (isCorrect) {
                                containerStyle += "bg-green-50 border-green-500 text-green-800 shadow-sm";
                                icon = <CheckCircleFilled className="text-green-600 text-xl" />;
                            } else if (isSelected && !isCorrect) {
                                containerStyle += "bg-red-50 border-red-500 text-red-800 shadow-sm";
                                icon = <CloseCircleFilled className="text-red-500 text-xl" />;
                            } else {
                                containerStyle += "bg-white border-gray-200 hover:bg-gray-50";
                            }

                            return (
                                <div key={opt.label} className={containerStyle}>
                                    <div className="bg-white border border-gray-300 w-8 h-8 rounded-full flex items-center justify-center font-bold text-gray-600 shadow-sm">{opt.label}</div>
                                    <div className="flex-1 font-medium">{opt.text}</div>
                                    <div className="flex items-center gap-2">
                                        {isSelected && <Tag color={isCorrect ? "success" : "error"}>YOU</Tag>}
                                        {isCorrect && <Tag color="success">ANSWER</Tag>}
                                        {icon}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 </div>
             )}

             {selectedQuestion.question_type !== "MCQ" && (
                 <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                    Detailed solution view for Non-MCQ questions is not fully implemented in this demo.
                 </div>
             )}

             {/* Personal Notes Section */}
             <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
                 <h3 className="font-semibold mb-2 text-yellow-800">My Personal Notes (Study Aid):</h3>
                 <Input.TextArea 
                     rows={3} 
                     placeholder="Write down why you made a mistake or key concepts to remember..." 
                     value={currentNote}
                     onChange={(e) => setCurrentNote(e.target.value)}
                     className="mb-2"
                 />
                 <Button type="primary" onClick={handleSaveNote} size="small" className="bg-yellow-600 border-yellow-600">Save Note</Button>
             </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default StudentQuestionsComponent;
