"use client";

import React, { useMemo, useState } from "react";
import { Card, Row, Col, Statistic, Progress, Table, Tag, Button, Select, Space, Modal } from "antd";
import { 
  WarningOutlined, 
  BookOutlined, 
  TrophyOutlined, 
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined,
  FilterOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  BarChartOutlined,
  CheckCircleFilled,
  CloseCircleFilled
} from "@ant-design/icons";

const { Option } = Select;

function TroubleSpotPage() {
  // Filters
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [accuracyFilter, setAccuracyFilter] = useState("ALL");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Generate dummy questions for each subtopic
  const generateQuestionsForTopic = (topicData) => {
    const questions = [];
    const statuses = ["CORRECT", "INCORRECT", "SKIPPED"];
    
    for (let i = 1; i <= topicData.attempted; i++) {
      const status = i <= topicData.correct ? "CORRECT" : statuses[i % 2 === 0 ? 1 : 2];
      questions.push({
        id: `${topicData.id}-Q${i}`,
        questionNumber: i,
        description: `${topicData.topic} - ${topicData.subTopic} Question ${i}`,
        status: status,
        timeSpent: Math.floor(Math.random() * 40) + topicData.avgTime - 20,
        idealTime: topicData.idealTime,
        difficulty: topicData.difficulty,
        testName: `Practice Test ${Math.ceil(i / 5)}`,
        attemptedDate: new Date(2024, 0, Math.floor(Math.random() * 26) + 1).toLocaleDateString(),
      });
    }
    return questions;
  };

  // Generate dummy data for trouble spots
  const troubleSpotData = useMemo(() => {
    return {
      totalWeakTopics: 8,
      mostChallengingSubject: "Math",
      mostChallengingSubjectAccuracy: 42,
      overallAccuracy: 58,
      topicsNeedingAttention: 5,
      totalTopicsAttempted: 15,
      averageTimeOverage: 35, // percentage over ideal time
      improvementTrend: -5, // negative means declining
    };
  }, []);

  // Generate dummy trouble topics data
  const troubleTopics = useMemo(() => {
    const topics = [
      { id: 1, topic: "Algebra", subTopic: "Quadratic Equations", subject: "Math", attempted: 25, correct: 8, accuracy: 32, avgTime: 95, idealTime: 60, repeatedMistakes: 12, difficulty: "HARD", lastAttempted: "2024-01-25" },
      { id: 2, topic: "Geometry", subTopic: "Circle Theorems", subject: "Math", attempted: 18, correct: 7, accuracy: 39, avgTime: 85, idealTime: 60, repeatedMistakes: 8, difficulty: "MEDIUM", lastAttempted: "2024-01-24" },
      { id: 3, topic: "Trigonometry", subTopic: "Identities", subject: "Math", attempted: 22, correct: 9, accuracy: 41, avgTime: 78, idealTime: 60, repeatedMistakes: 10, difficulty: "HARD", lastAttempted: "2024-01-26" },
      { id: 4, topic: "Reading Component", subTopic: "Inference Questions", subject: "English", attempted: 30, correct: 14, accuracy: 47, avgTime: 120, idealTime: 90, repeatedMistakes: 15, difficulty: "MEDIUM", lastAttempted: "2024-01-23" },
      { id: 5, topic: "Grammar", subTopic: "Subject-Verb Agreement", subject: "English", attempted: 20, correct: 11, accuracy: 55, avgTime: 45, idealTime: 40, repeatedMistakes: 6, difficulty: "EASY", lastAttempted: "2024-01-25" },
      { id: 6, topic: "Arithmetic", subTopic: "Percentages", subject: "Math", attempted: 28, correct: 16, accuracy: 57, avgTime: 52, idealTime: 50, repeatedMistakes: 9, difficulty: "EASY", lastAttempted: "2024-01-22" },
      { id: 7, topic: "Vocabulary", subTopic: "Context Clues", subject: "English", attempted: 24, correct: 14, accuracy: 58, avgTime: 65, idealTime: 50, repeatedMistakes: 7, difficulty: "MEDIUM", lastAttempted: "2024-01-26" },
      { id: 8, topic: "Geometry", subTopic: "Coordinate Geometry", subject: "Math", attempted: 16, correct: 10, accuracy: 63, avgTime: 70, idealTime: 60, repeatedMistakes: 4, difficulty: "MEDIUM", lastAttempted: "2024-01-21" },
    ];
    return topics;
  }, []);

  // Filter topics
  const filteredTopics = useMemo(() => {
    return troubleTopics.filter(topic => {
      if (subjectFilter !== "ALL" && topic.subject !== subjectFilter) return false;
      
      if (accuracyFilter === "CRITICAL" && topic.accuracy >= 40) return false;
      if (accuracyFilter === "NEEDS_WORK" && (topic.accuracy < 40 || topic.accuracy >= 60)) return false;
      if (accuracyFilter === "ALMOST_THERE" && (topic.accuracy < 60 || topic.accuracy >= 70)) return false;
      
      return true;
    });
  }, [troubleTopics, subjectFilter, accuracyFilter]);

  // Table columns
  const columns = [
    {
      title: "Topic",
      key: "topic",
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-semibold text-gray-800">{record.topic}</div>
          <div className="text-xs text-gray-500">{record.subTopic}</div>
        </div>
      ),
      sorter: (a, b) => a.topic.localeCompare(b.topic),
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      width: 100,
      render: (subject) => (
        <Tag color={subject === "Math" ? "blue" : "green"}>{subject}</Tag>
      ),
      filters: [
        { text: 'Math', value: 'Math' },
        { text: 'English', value: 'English' },
      ],
      onFilter: (value, record) => record.subject === value,
    },
    {
      title: "Attempted",
      dataIndex: "attempted",
      key: "attempted",
      width: 100,
      align: "center",
      sorter: (a, b) => a.attempted - b.attempted,
    },
    {
      title: "Accuracy",
      key: "accuracy",
      width: 150,
      render: (_, record) => {
        let color = "red";
        let status = "Critical";
        if (record.accuracy >= 60) {
          color = "orange";
          status = "Almost There";
        } else if (record.accuracy >= 40) {
          color = "orange";
          status = "Needs Work";
        }
        
        return (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-bold ${record.accuracy < 40 ? 'text-red-600' : record.accuracy < 60 ? 'text-orange-600' : 'text-yellow-600'}`}>
                {record.accuracy}%
              </span>
              <Tag color={color} className="text-xs">{status}</Tag>
            </div>
            <Progress 
              percent={record.accuracy} 
              strokeColor={record.accuracy < 40 ? "#dc2626" : record.accuracy < 60 ? "#ea580c" : "#ca8a04"}
              showInfo={false}
              size="small"
            />
          </div>
        );
      },
      sorter: (a, b) => a.accuracy - b.accuracy,
    },
    {
      title: "Avg Time",
      key: "avgTime",
      width: 120,
      render: (_, record) => {
        const isOverTime = record.avgTime > record.idealTime;
        const overagePercent = Math.round(((record.avgTime - record.idealTime) / record.idealTime) * 100);
        
        return (
          <div>
            <div className={`font-semibold ${isOverTime ? 'text-red-600' : 'text-green-600'}`}>
              {record.avgTime}s
            </div>
            <div className="text-xs text-gray-500">
              Ideal: {record.idealTime}s
            </div>
            {isOverTime && (
              <div className="text-xs text-red-500">+{overagePercent}%</div>
            )}
          </div>
        );
      },
      sorter: (a, b) => a.avgTime - b.avgTime,
    },
    {
      title: "Repeated Mistakes",
      dataIndex: "repeatedMistakes",
      key: "repeatedMistakes",
      width: 120,
      align: "center",
      render: (mistakes) => (
        <div className="flex flex-col items-center">
          <span className="font-bold text-red-600 text-lg">{mistakes}</span>
          {mistakes > 10 && <span className="text-xs text-red-500">⚠️ High</span>}
        </div>
      ),
      sorter: (a, b) => a.repeatedMistakes - b.repeatedMistakes,
    },
    {
      title: "Difficulty",
      dataIndex: "difficulty",
      key: "difficulty",
      width: 100,
      render: (difficulty) => {
        const color = difficulty === "EASY" ? "green" : difficulty === "MEDIUM" ? "orange" : "red";
        return <Tag color={color}>{difficulty}</Tag>;
      },
      filters: [
        { text: 'Easy', value: 'EASY' },
        { text: 'Medium', value: 'MEDIUM' },
        { text: 'Hard', value: 'HARD' },
      ],
      onFilter: (value, record) => record.difficulty === value,
    },
    {
      title: "Last Attempted",
      dataIndex: "lastAttempted",
      key: "lastAttempted",
      width: 120,
      render: (date) => (
        <span className="text-gray-600 text-sm">
          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      ),
      sorter: (a, b) => new Date(a.lastAttempted) - new Date(b.lastAttempted),
    },
  ];

  return (
    <div className="">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <div className=" bg-red-100 rounded-lg h-12 w-12 flex items-center justify-center">
            <WarningOutlined className="text-red-600 text-xl" />
          </div>
          Trouble Spot Analysis
        </h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Identify and improve topics where you consistently struggle
        </p>
      </div>

      {/* Overview Summary Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        {/* Total Weak Topics */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-red-500"
            bodyStyle={{ padding: '20px' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-gray-500 text-xs uppercase font-semibold mb-1">
                  Weak Topics
                </div>
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {troubleSpotData.totalWeakTopics}
                </div>
                <div className="text-xs text-gray-500">
                  out of {troubleSpotData.totalTopicsAttempted} topics
                </div>
                <Progress 
                  percent={Math.round((troubleSpotData.totalWeakTopics / troubleSpotData.totalTopicsAttempted) * 100)} 
                  strokeColor="#dc2626"
                  showInfo={false}
                  size="small"
                  className="mt-2"
                />
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <WarningOutlined className="text-2xl text-red-500" />
              </div>
            </div>
          </Card>
        </Col>

        {/* Most Challenging Subject */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-orange-500"
            bodyStyle={{ padding: '20px' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-gray-500 text-xs uppercase font-semibold mb-1">
                  Most Challenging
                </div>
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {troubleSpotData.mostChallengingSubject}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {troubleSpotData.mostChallengingSubjectAccuracy}% accuracy
                </div>
                <Progress 
                  percent={troubleSpotData.mostChallengingSubjectAccuracy} 
                  strokeColor="#ea580c"
                  size="small"
                  format={(percent) => `${percent}%`}
                />
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <BookOutlined className="text-2xl text-orange-500" />
              </div>
            </div>
          </Card>
        </Col>

        {/* Overall Accuracy in Weak Areas */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-yellow-500"
            bodyStyle={{ padding: '20px' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-gray-500 text-xs uppercase font-semibold mb-1">
                  Avg Accuracy (Weak Areas)
                </div>
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {troubleSpotData.overallAccuracy}%
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Target: 70%+
                </div>
                <Progress 
                  percent={troubleSpotData.overallAccuracy} 
                  strokeColor="#ca8a04"
                  size="small"
                  format={(percent) => `${percent}%`}
                />
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <TrophyOutlined className="text-2xl text-yellow-600" />
              </div>
            </div>
          </Card>
        </Col>

        {/* Immediate Attention Needed */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-purple-500"
            bodyStyle={{ padding: '20px' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-gray-500 text-xs uppercase font-semibold mb-1">
                  Immediate Attention
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {troubleSpotData.topicsNeedingAttention}
                </div>
                <div className="text-xs text-gray-500">
                  Critical topics (&lt;40% accuracy)
                </div>
                <div className="mt-2 text-xs font-semibold text-purple-600">
                  🔥 Requires urgent focus
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <ClockCircleOutlined className="text-2xl text-purple-500" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Additional Insights Row */}
      <Row gutter={[16, 16]} className="mb-6">
        {/* Time Management Issue */}
        <Col xs={24} md={12}>
          <Card 
            className="shadow-sm border border-blue-100 bg-blue-50"
            bodyStyle={{ padding: '20px' }}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <ClockCircleOutlined className="text-2xl text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 mb-1">Time Management Alert</div>
                <div className="text-sm text-gray-600 mb-2">
                  You're spending <span className="font-bold text-blue-600">{troubleSpotData.averageTimeOverage}% more time</span> than ideal on weak topics
                </div>
                <div className="text-xs text-gray-500">
                  💡 Tip: Focus on understanding core concepts to improve speed
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Performance Trend */}
        <Col xs={24} md={12}>
          <Card 
            className={`shadow-sm border ${troubleSpotData.improvementTrend >= 0 ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}
            bodyStyle={{ padding: '20px' }}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                {troubleSpotData.improvementTrend >= 0 ? (
                  <RiseOutlined className="text-2xl text-green-600" />
                ) : (
                  <FallOutlined className="text-2xl text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 mb-1">Performance Trend</div>
                <div className="text-sm text-gray-600 mb-2">
                  {troubleSpotData.improvementTrend >= 0 ? (
                    <>
                      Accuracy improved by <span className="font-bold text-green-600">+{troubleSpotData.improvementTrend}%</span> this week
                    </>
                  ) : (
                    <>
                      Accuracy declined by <span className="font-bold text-red-600">{troubleSpotData.improvementTrend}%</span> this week
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {troubleSpotData.improvementTrend >= 0 
                    ? "🎉 Keep up the great work!" 
                    : "⚠️ Time to refocus and practice more"}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Smart Recommendations & Priority Focus */}
      <Row gutter={[16, 16]} className="mb-6">
        {/* Priority Focus This Week */}
        <Col xs={24} lg={8}>
          <Card 
            className="shadow-sm h-full"
            title={
              <div className="flex items-center gap-2">
                <ThunderboltOutlined className="text-orange-500" />
                <span className="font-bold">Focus This Week</span>
              </div>
            }
          >
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-800">Algebra</span>
                  <Tag color="red">32%</Tag>
                </div>
                <div className="text-xs text-gray-600 mb-2">Quadratic Equations</div>
                <div className="text-xs text-red-600 font-semibold">
                  🎯 12 repeated mistakes - Review fundamentals
                </div>
              </div>

              <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-800">Geometry</span>
                  <Tag color="orange">39%</Tag>
                </div>
                <div className="text-xs text-gray-600 mb-2">Circle Theorems</div>
                <div className="text-xs text-orange-600 font-semibold">
                  ⏱️ Taking 42% longer than ideal time
                </div>
              </div>

              <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-800">Trigonometry</span>
                  <Tag color="orange">41%</Tag>
                </div>
                <div className="text-xs text-gray-600 mb-2">Identities</div>
                <div className="text-xs text-orange-600 font-semibold">
                  📊 10 repeated mistakes on hard questions
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Quick Wins - Easy to Improve */}
        <Col xs={24} lg={8}>
          <Card 
            className="shadow-sm h-full"
            title={
              <div className="flex items-center gap-2">
                <TrophyOutlined className="text-green-500" />
                <span className="font-bold">Quick Wins</span>
              </div>
            }
          >
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-800">Geometry</span>
                  <Tag color="orange">63%</Tag>
                </div>
                <div className="text-xs text-gray-600 mb-2">Coordinate Geometry</div>
                <div className="text-xs text-green-600 font-semibold">
                  ✨ Just 7% away from target - Easy to improve!
                </div>
              </div>

              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-800">Vocabulary</span>
                  <Tag color="orange">58%</Tag>
                </div>
                <div className="text-xs text-gray-600 mb-2">Context Clues</div>
                <div className="text-xs text-green-600 font-semibold">
                  💪 Practice 10 more questions to reach 70%
                </div>
              </div>

              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-800">Arithmetic</span>
                  <Tag color="orange">57%</Tag>
                </div>
                <div className="text-xs text-gray-600 mb-2">Percentages</div>
                <div className="text-xs text-green-600 font-semibold">
                  🚀 Low difficulty - High success potential
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Actionable Insights */}
        <Col xs={24} lg={8}>
          <Card 
            className="shadow-sm h-full"
            title={
              <div className="flex items-center gap-2">
                <BookOutlined className="text-blue-500" />
                <span className="font-bold">Smart Insights</span>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  Pattern Detected
                </div>
                <div className="text-sm text-gray-700">
                  You struggle most with <span className="font-bold">HARD difficulty</span> questions in Math. 
                  Consider reviewing fundamentals before attempting harder problems.
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <span className="text-lg">⏰</span>
                  Time Management
                </div>
                <div className="text-sm text-gray-700">
                  Reading Component questions take <span className="font-bold">33% longer</span> than ideal. 
                  Practice speed reading techniques.
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  Recommendation
                </div>
                <div className="text-sm text-gray-700">
                  Focus on <span className="font-bold">3 topics</span> this week. 
                  Consistent practice on fewer topics yields better results.
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Visual Performance Chart */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24}>
          <Card 
            className="shadow-sm"
            title={
              <div className="flex items-center gap-2">
                <BarChartOutlined className="text-indigo-500" />
                <span className="font-bold">Performance Visualization</span>
              </div>
            }
          >
            <div className="space-y-4">
              {troubleTopics.slice(0, 5).map((topic) => (
                <div key={topic.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-gray-800">{topic.topic}</span>
                      <span className="text-xs text-gray-500 ml-2">({topic.subTopic})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${topic.accuracy < 40 ? 'text-red-600' : topic.accuracy < 60 ? 'text-orange-600' : 'text-yellow-600'}`}>
                        {topic.accuracy}%
                      </span>
                      <Tag color={topic.subject === "Math" ? "blue" : "green"} className="text-xs">
                        {topic.subject}
                      </Tag>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      percent={topic.accuracy} 
                      strokeColor={topic.accuracy < 40 ? "#dc2626" : topic.accuracy < 60 ? "#ea580c" : "#ca8a04"}
                      showInfo={false}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500 w-24 text-right">
                      {topic.attempted} attempts
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded text-center">
              <div className="text-sm text-gray-600">
                💡 <span className="font-semibold">Pro Tip:</span> Topics below 40% need immediate attention. 
                Start with understanding core concepts before practicing more questions.
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Trouble Topics Table */}
      <Card 
        className="shadow-sm"
        title={
          <div className="flex items-center justify-between flex-wrap gap-4">
            <span className="font-bold text-lg">Detailed Topic Analysis</span>
            <Space wrap>
              <Select
                value={subjectFilter}
                onChange={setSubjectFilter}
                style={{ width: 120 }}
                size="middle"
              >
                <Option value="ALL">All Subjects</Option>
                <Option value="Math">Math</Option>
                <Option value="English">English</Option>
              </Select>
              <Select
                value={accuracyFilter}
                onChange={setAccuracyFilter}
                style={{ width: 150 }}
                size="middle"
              >
                <Option value="ALL">All Accuracy</Option>
                <Option value="CRITICAL">Critical (&lt;40%)</Option>
                <Option value="NEEDS_WORK">Needs Work (40-60%)</Option>
                <Option value="ALMOST_THERE">Almost There (60-70%)</Option>
              </Select>
            </Space>
          </div>
        }
      >
        <Table
          dataSource={filteredTopics}
          columns={columns}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => {
              setSelectedTopic(record);
              setIsModalOpen(true);
            },
            style: { cursor: 'pointer' }
          })}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} topics`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Questions Modal */}
      <Modal
        title={
          selectedTopic ? (
            <div className="flex items-center gap-3">
              <BookOutlined className="text-blue-600" />
              <div>
                <div className="font-bold text-lg">{selectedTopic.topic} - {selectedTopic.subTopic}</div>
                <div className="text-sm text-gray-500 font-normal">
                  {selectedTopic.attempted} questions attempted • {selectedTopic.accuracy}% accuracy
                </div>
              </div>
            </div>
          ) : "Questions"
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedTopic(null);
        }}
        footer={null}
        width={900}
        className="top-4"
      >
        {selectedTopic && (
          <div className="space-y-4">
            {/* Summary Stats */}
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={12} sm={6}>
                <Card className="text-center bg-blue-50 border-blue-200">
                  <div className="text-xs text-gray-600">Total</div>
                  <div className="text-2xl font-bold text-blue-600">{selectedTopic.attempted}</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="text-center bg-green-50 border-green-200">
                  <div className="text-xs text-gray-600">Correct</div>
                  <div className="text-2xl font-bold text-green-600">{selectedTopic.correct}</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="text-center bg-red-50 border-red-200">
                  <div className="text-xs text-gray-600">Incorrect</div>
                  <div className="text-2xl font-bold text-red-600">{selectedTopic.attempted - selectedTopic.correct}</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="text-center bg-orange-50 border-orange-200">
                  <div className="text-xs text-gray-600">Accuracy</div>
                  <div className="text-2xl font-bold text-orange-600">{selectedTopic.accuracy}%</div>
                </Card>
              </Col>
            </Row>

            {/* Questions List */}
            <div className="max-h-96 overflow-y-auto">
              <Table
                dataSource={generateQuestionsForTopic(selectedTopic)}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: "Q#",
                    dataIndex: "questionNumber",
                    key: "questionNumber",
                    width: 60,
                    align: "center",
                    render: (num) => <span className="font-semibold text-gray-700">#{num}</span>
                  },
                  {
                    title: "Question",
                    dataIndex: "description",
                    key: "description",
                    ellipsis: true,
                  },
                  {
                    title: "Test",
                    dataIndex: "testName",
                    key: "testName",
                    width: 140,
                    render: (text) => <span className="text-xs text-gray-600">{text}</span>
                  },
                  {
                    title: "Status",
                    dataIndex: "status",
                    key: "status",
                    width: 120,
                    render: (status) => {
                      const config = {
                        CORRECT: { color: "success", icon: <CheckCircleFilled />, text: "Correct" },
                        INCORRECT: { color: "error", icon: <CloseCircleFilled />, text: "Incorrect" },
                        SKIPPED: { color: "warning", icon: null, text: "Skipped" }
                      };
                      const { color, icon, text } = config[status];
                      return (
                        <Tag color={color} icon={icon}>
                          {text}
                        </Tag>
                      );
                    }
                  },
                  {
                    title: "Time",
                    dataIndex: "timeSpent",
                    key: "timeSpent",
                    width: 100,
                    render: (time, record) => (
                      <span className={time > record.idealTime ? "text-red-600 font-semibold" : "text-green-600"}>
                        {time}s
                      </span>
                    )
                  },
                  {
                    title: "Date",
                    dataIndex: "attemptedDate",
                    key: "attemptedDate",
                    width: 100,
                    render: (date) => <span className="text-xs text-gray-500">{date}</span>
                  }
                ]}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button type="primary" icon={<ThunderboltOutlined />} size="large" block>
                Practice These Questions Again
              </Button>
              <Button icon={<BookOutlined />} size="large" block>
                View Detailed Solutions
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default TroubleSpotPage;
