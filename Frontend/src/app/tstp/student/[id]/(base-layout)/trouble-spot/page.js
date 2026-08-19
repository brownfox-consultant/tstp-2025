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

import axios from "axios";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { BASE_URL } from "@/app/constants/apiConstants";

const { Option } = Select;

function TroubleSpotPage() {
  // Filters
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [accuracyFilter, setAccuracyFilter] = useState("ALL");
  const [performanceTrend, setPerformanceTrend] = useState(0);
const [timeOveragePercent, setTimeOveragePercent] = useState(0);
const getAccuracyStatus = (accuracy) => {
  if (accuracy <= 19) return { label: "Critical", color: "red" };
  if (accuracy <= 39) return { label: "Major Improvement Required", color: "volcano" };
  if (accuracy <= 54) return { label: "Needs Significant Improvement", color: "orange" };
  if (accuracy <= 69) return { label: "Needs Improvement", color: "gold" };
  if (accuracy <= 79) return { label: "Satisfactory", color: "blue" };
  if (accuracy <= 89) return { label: "Good", color: "green" };
  if (accuracy <= 95) return { label: "Very Good", color: "cyan" };
  return { label: "Excellent", color: "purple" };
};

  const params = useParams();
const studentId = params.id;

const [performanceTopics, setPerformanceTopics] = useState([]);
const [performanceLoading, setPerformanceLoading] = useState(true);
const [proTip, setProTip] = useState("");

const [detailedTopics, setDetailedTopics] = useState([]);
const [detailedLoading, setDetailedLoading] = useState(true);

const [modalQuestions, setModalQuestions] = useState([]);
const [modalLoading, setModalLoading] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [focusTopics, setFocusTopics] = useState([]);
const [quickWins, setQuickWins] = useState([]);
const [patternData, setPatternData] = useState(null);
const [timeData, setTimeData] = useState(null);
const [recommendationData, setRecommendationData] = useState(null);
const [insightsLoading, setInsightsLoading] = useState(true);

  // ===== Dynamic Summary Calculations =====

// Weak topics = accuracy < 40
const weakTopics = detailedTopics.filter(t => t.accuracy < 40);

// Most Challenging Subject
const subjectAccuracyMap = detailedTopics.reduce((acc, topic) => {
  if (!acc[topic.subject]) {
    acc[topic.subject] = { correct: 0, attempted: 0 };
  }
  acc[topic.subject].correct += topic.correct;
  acc[topic.subject].attempted += topic.attempted;
  return acc;
}, {});

let mostChallengingSubject = "-";
let mostChallengingSubjectAccuracy = 0;

Object.keys(subjectAccuracyMap).forEach(subject => {
  const data = subjectAccuracyMap[subject];
  const accuracy =
    data.attempted > 0
      ? Math.round((data.correct / data.attempted) * 100)
      : 0;

  if (
    mostChallengingSubject === "-" ||
    accuracy < mostChallengingSubjectAccuracy
  ) {
    mostChallengingSubject = subject;
    mostChallengingSubjectAccuracy = accuracy;
  }
});

// Average accuracy of weak areas
const overallWeakAccuracy =
  weakTopics.length > 0
    ? Math.round(
        weakTopics.reduce((sum, t) => sum + t.accuracy, 0) /
          weakTopics.length
      )
    : 0;



  // Generate dummy questions for each subtopic
 

  // Generate dummy data for trouble spots
  

  // Generate dummy trouble topics data
  

  // Filter topics
  const filteredTopics = useMemo(() => {
  return detailedTopics.filter(topic => {

    if (subjectFilter !== "ALL" && topic.subject !== subjectFilter) {
      return false;
    }

    if (accuracyFilter === "CRITICAL" && topic.accuracy >= 40) {
      return false;
    }

    if (accuracyFilter === "NEEDS_WORK" && (topic.accuracy < 40 || topic.accuracy >= 60)) {
      return false;
    }

    if (accuracyFilter === "ALMOST_THERE" && (topic.accuracy < 60 || topic.accuracy >= 70)) {
      return false;
    }

    return true;
  });
}, [detailedTopics, subjectFilter, accuracyFilter]);



  useEffect(() => {
  fetchPerformance();
  fetchDetailedTopics();
  fetchSmartInsights();
}, []);

  
const fetchSmartInsights = async () => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/test/smart-insights/`,
      {
        params: { student_id: studentId },
        withCredentials: true,
      }
    );

    setFocusTopics(res.data.focus_this_week || []);
    setQuickWins(res.data.quick_wins || []);
    setPatternData(res.data.pattern_detected || null);
    setTimeData(res.data.time_management || null);
    setRecommendationData(res.data.recommendation || null);

  } catch (err) {
    console.error("Smart Insights API Error:", err);
  }

  setInsightsLoading(false);
};


const fetchPerformance = async () => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/test/performance-visualization/`,
      {
        params: { student_id: studentId },
        withCredentials: true,
      }
    );

    setPerformanceTopics(res.data.topics || []);
    setProTip(res.data.pro_tip || "");
    setPerformanceTrend(res.data.performance_trend || 0);
    setTimeOveragePercent(res.data.time_overage_percent || 0);

  } catch (err) {
    console.error("Performance API Error:", err);
  }

  setPerformanceLoading(false);
};

const fetchDetailedTopics = async () => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/test/detailed-topic-analysis/`,
      {
        params: { student_id: studentId },
        withCredentials: true,
      }
    );

    setDetailedTopics(res.data || []);
  } catch (err) {
    console.error("Detailed Topic API Error:", err);
  }

  setDetailedLoading(false);
};


const openTopicModal = async (record) => {
  setSelectedTopic(record);
  setIsModalOpen(true);
  setModalLoading(true);

  try {
    const res = await axios.get(
      `${BASE_URL}/api/test/topic-question-analysis/`,
      {
        params: {
  student_id: studentId,
  topic: record.topic,
  sub_topic: record.sub_topic,
},
        withCredentials: true,
      }
    );

    setModalQuestions(res.data || []);
  } catch (err) {
    console.error("Modal API Error:", err);
  }

  setModalLoading(false);
};

  // Table columns
  const columns = [
    {
      title: "Topic",
      key: "topic",
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-semibold text-gray-800">{record.topic}</div>
          <div className="text-xs text-gray-500">{record.sub_topic}</div>
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
  const { label, color } = getAccuracyStatus(record.accuracy);

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold">
          {record.accuracy}%
        </span>
        <Tag color={color}>{label}</Tag>
      </div>
      <Progress
        percent={record.accuracy}
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
  key: "avg_time",
  width: 120,
  render: (_, record) => {
    const avg = record.avg_time || 0;
    const ideal = record.ideal_time || 60;

    const isOverTime = avg > ideal;
    const overagePercent =
      ideal > 0 ? Math.round(((avg - ideal) / ideal) * 100) : 0;

    return (
      <div>
        <div
          className={`font-semibold ${
            isOverTime ? "text-red-600" : "text-green-600"
          }`}
        >
          {avg}s
        </div>

        <div className="text-xs text-gray-500">
          Ideal: {ideal}s
        </div>

        {isOverTime && (
          <div className="text-xs text-red-500">
            +{overagePercent}%
          </div>
        )}
      </div>
    );
  },
  sorter: (a, b) => a.avg_time - b.avg_time,
},
    {
      title: "Repeated Mistakes",
      dataIndex: "repeated_mistakes",
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
      dataIndex: "last_attempted",
      key: "lastAttempted",
      width: 120,
      render: (date) => {
  if (!date) return "-";

  const diff = Math.floor(
    (new Date() - new Date(date)) / (1000 * 60 * 60 * 24)
  );

  return (
    <div>
      <div className="font-medium">
        {new Date(date).toLocaleDateString("en-IN")}
      </div>
      <div className="text-xs text-gray-500">
        {diff === 0 ? "Today" : `${diff} days ago`}
      </div>
    </div>
  );
},
      sorter: (a, b) => new Date(a.last_attempted) - new Date(b.last_attempted),
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
                  {performanceTopics.length}
                </div>
                <div className="text-xs text-gray-500">
                  out of {detailedTopics.length} topics
                </div>
                <Progress 
                  percent={
  detailedTopics.length > 0
    ? Math.round((performanceTopics.length / detailedTopics.length) * 100)
    : 0
}
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
                  {mostChallengingSubject}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {mostChallengingSubjectAccuracy}% accuracy
                </div>
                <Progress 
                  percent={mostChallengingSubjectAccuracy} 
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
                  {overallWeakAccuracy}%
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Target: 70%+
                </div>
                <Progress 
                  percent={overallWeakAccuracy} 
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
                  {weakTopics.length}
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
                  You're spending <span className="font-bold text-blue-600">{timeOveragePercent}% more time</span> than ideal on weak topics
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
            className={`shadow-sm border ${performanceTrend >= 0 ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}
            bodyStyle={{ padding: '20px' }}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                {performanceTrend >= 0 ? (
                  <RiseOutlined className="text-2xl text-green-600" />
                ) : (
                  <FallOutlined className="text-2xl text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 mb-1">Performance Trend</div>
                <div className="text-sm text-gray-600 mb-2">
                  {performanceTrend >= 0 ? (
                    <>
                      Accuracy improved by <span className="font-bold text-green-600">+{performanceTrend}%</span> this week
                    </>
                  ) : (
                    <>
                      Accuracy declined by <span className="font-bold text-red-600">{performanceTrend}%</span> this week
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {performanceTrend >= 0 
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
    {insightsLoading ? (
      <div className="text-center py-6 text-gray-500">Loading...</div>
    ) : focusTopics.length === 0 ? (
      <div className="text-green-600 font-semibold text-center">
        🎉 No critical weak topics!
      </div>
    ) : (
      <div className="space-y-3">
        {focusTopics.map((topic, index) => (
          <div
            key={index}
            className="p-3 bg-red-50 border-l-4 border-red-500 rounded"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-gray-800">
                {topic.topic}
              </span>
              <Tag color="red">{topic.accuracy}%</Tag>
            </div>

            <div className="text-xs text-gray-600 mb-2">
              {topic.sub_topic}
            </div>

            <div className="text-xs text-red-600 font-semibold">
              🎯 {topic.attempted} attempts — Needs improvement
            </div>
          </div>
        ))}
      </div>
    )}
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
    {insightsLoading ? (
      <div className="text-center py-6 text-gray-500">Loading...</div>
    ) : quickWins.length === 0 ? (
      <div className="text-gray-500 text-center">
        No quick wins available
      </div>
    ) : (
      <div className="space-y-3">
        {quickWins.map((topic, index) => (
          <div
            key={index}
            className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-gray-800">
                {topic.topic}
              </span>
              <Tag color="orange">{topic.accuracy}%</Tag>
            </div>

            <div className="text-xs text-gray-600 mb-2">
              {topic.sub_topic}
            </div>

            <div className="text-xs text-green-600 font-semibold">
              ✨ Close to 70% — Easy to improve!
            </div>
          </div>
        ))}
      </div>
    )}
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
    {insightsLoading ? (
      <div className="text-center py-6 text-gray-500">Loading...</div>
    ) : (
      <div className="space-y-4">

        {/* Pattern Detected */}
        {patternData && (
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="font-semibold text-purple-800 mb-2">
              🎯 Pattern Detected
            </div>
            <div className="text-sm text-gray-700">
              Hard question accuracy is{" "}
              <span className="font-bold">
                {patternData.hard_accuracy}%
              </span>.
              {patternData.hard_accuracy < 50
                ? " Focus on strengthening fundamentals before attempting difficult problems."
                : " You're improving on hard questions — keep practicing!"}
            </div>
          </div>
        )}

        {/* Time Management */}
        {timeData && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="font-semibold text-blue-800 mb-2">
              ⏰ Time Management
            </div>
            <div className="text-sm text-gray-700">
              You're spending{" "}
              <span className="font-bold">
                {Math.max(0, timeData.overage_percent)}%
              </span>{" "}
              more time than ideal.
            </div>
          </div>
        )}

        {/* Recommendation */}
        {recommendationData && (
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="font-semibold text-green-800 mb-2">
              📈 Recommendation
            </div>
            <div className="text-sm text-gray-700">
              Focus on{" "}
              <span className="font-bold">
                {recommendationData.focus_count}
              </span>{" "}
              topics this week. Consistent practice yields better results.
            </div>
          </div>
        )}

      </div>
    )}
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

            
            <div
    className="space-y-4 max-h-96 overflow-y-auto pr-2"
    style={{ scrollbarWidth: "thin" }}
  >
             {performanceLoading ? (
  <div className="text-center py-10">
    Loading...
  </div>
) : (
  <>
    {performanceTopics.length === 0 && (
      <div className="text-center text-green-600 font-semibold">
        🎉 No weak topics! Great job!
      </div>
    )}

    {performanceTopics.map((topic, index) => (
      <div key={index} className="space-y-2 ">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-semibold text-gray-800">
              {topic.topic}
            </span>
            {topic.sub_topic && (
              <span className="text-xs text-gray-500 ml-2">
                ({topic.sub_topic})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`font-bold ${
                topic.accuracy < 40
                  ? "text-red-600"
                  : topic.accuracy < 60
                  ? "text-orange-600"
                  : "text-yellow-600"
              }`}
            >
              {topic.accuracy}%
            </span>

            <Tag
              color={
                topic.subject === "Math" ? "blue" : "green"
              }
              className="text-xs"
            >
              {topic.subject}
            </Tag>
          </div>
        </div>

        <div className="space-y-1">
  <Progress
    percent={topic.accuracy}
    strokeColor={
      topic.accuracy < 40
        ? "#dc2626"
        : topic.accuracy < 60
        ? "#ea580c"
        : "#ca8a04"
    }
    showInfo={false}
  />

  <div className="flex justify-between text-xs text-gray-500">
    <span>
  {topic.attempted ?? 0} attempts
</span>
    <span>Avg Time: {topic.avg_time}s</span>
  </div>
</div>
      </div>
    ))}

    <div className="mt-4 p-3 bg-gray-50 rounded text-center">
      <div className="text-sm text-gray-600">
        💡 <span className="font-semibold">Pro Tip:</span> {proTip}
      </div>
    </div>
  </>
)}
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded text-center">
              
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
  loading={detailedLoading}
  columns={columns}
  rowKey="id"
  onRow={(record) => ({
    onClick: () => openTopicModal(record),
    style: { cursor: "pointer" },
  })}
  pagination={{
    defaultPageSize: 10,
    pageSizeOptions: ["10", "20", "50"],
    showSizeChanger: true,
    showTotal: (total, range) =>
      `${range[0]}-${range[1]} of ${total} topics`,
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
                dataSource={modalQuestions}
                loading={modalLoading}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
  {
    title: "Q#",
    dataIndex: "question_number",
    width: 60,
  },
  {
  title: "Question",
  render: (_, record) => (
    <div>
      <div className="font-medium">
        Q{record.test_sr_no} (Section {record.section})
      </div>
      <div className="text-xs text-gray-500">
        {record.question_text}
      </div>
    </div>
  ),
},
  {
    title: "Test",
    dataIndex: "test_name",
  },
  {
    title: "Status",
    dataIndex: "status",
    render: (status) => {
      const color =
        status === "Correct"
          ? "success"
          : status === "Incorrect"
          ? "error"
          : "warning";

      return <Tag color={color}>{status}</Tag>;
    },
  },
  {
    title: "Time",
    dataIndex: "time_taken",
    render: (time) => (
      <span className="text-red-600 font-semibold">
        {time}s
      </span>
    ),
  },
  {
    title: "Date",
    dataIndex: "date",
  },
]}
              />
            </div>

            {/* Action Buttons */}
            {/* <div className="flex gap-3 pt-4 border-t">
              <Button type="primary" icon={<ThunderboltOutlined />} size="large" block>
                Practice These Questions Again
              </Button>
              <Button icon={<BookOutlined />} size="large" block>
                View Detailed Solutions
              </Button>
            </div> */}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default TroubleSpotPage;
