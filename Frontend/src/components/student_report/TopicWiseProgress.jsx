"use client";

import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';

import { 
  FaRegFileAlt, FaRegLightbulb, FaPencilAlt, FaBookReader, 
  FaChevronDown, FaChevronUp, FaChartLine, FaMinus, FaListUl,
  FaTrophy, FaMedal
} from "react-icons/fa";

const chartData = [
  { id: 1, shortName: 'Information', fullName: 'Information and Ideas', value: 79, status: 'Strong area' },
  { id: 2, shortName: 'Craft', fullName: 'Craft and Structure', value: 68, status: 'On track' },
  { id: 3, shortName: 'Expression', fullName: 'Expression of Ideas', value: 82, status: 'Strong area' },
  { id: 4, shortName: 'Standard', fullName: 'Standard English Conventions', value: 53, status: 'On track' },
];

const colors = {
  green: '#2ecc71',
  orange: '#f39c12',
  textDark: '#333',
  textLight: '#777',
};

const CustomBarShape = (props) => {
  const { fill, x, y, width, height } = props;
  const radius = height / 2;
  const path = `M${x},${y} L${x + width - radius},${y} Q${x + width},${y} ${x + width},${y + radius} Q${x + width},${y + height} ${x + width - radius},${y + height} L${x},${y + height} Z`;
  return <path d={path} stroke="none" fill={fill} />;
};

const CustomHorizontalBarShape = (props) => {
    const { fill, x, y, width, height } = props;
    const radius = 4; 

    if (width < 10) return <rect x={x} y={y} width={width} height={height} fill={fill} rx={radius} />;
    
    const path = `M${x},${y} L${x + width - radius},${y} Q${x + width},${y} ${x + width},${y + radius} Q${x + width},${y + height} ${x + width - radius},${y + height} L${x},${y + height} Z`;
    return <path d={path} stroke="none" fill={fill} />;
};

// --- Custom Tooltips ---
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0].payload;
    const color = dataItem.value >= 75 ? colors.green : colors.orange;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100 min-w-[150px] z-50">
        <p className="font-semibold text-gray-800 text-sm">{dataItem.fullName || dataItem.name}</p>
        {dataItem.parentCategory && <p className="text-xs text-gray-400 mb-1">{dataItem.parentCategory}</p>}
        <p className="my-1 text-2xl font-bold" style={{ color: color }}>{dataItem.value}%</p>
        <p className="text-gray-500 text-xs">{dataItem.status || (dataItem.value >= 75 ? "Strong" : "On Track")}</p>
      </div>
    );
  }
  return null;
};

// ==========================================
// SECTION 2: ACCORDION DATA
// ==========================================

const accordionData = [
  {
    id: 1, title: "Information and Ideas", score: 79, icon: FaRegFileAlt, iconBg: "bg-blue-50 text-blue-500",
    subTopics: [
      { name: "Central Ideas and Details", score: 79, status: "Strong" },
      { name: "Command of Evidence", score: 81, status: "Strong" },
      { name: "Inferences", score: 68, status: "On Track" },
    ]
  },
  {
    id: 2, title: "Craft and Structure", score: 68, icon: FaRegLightbulb, iconBg: "bg-orange-50 text-orange-500",
    subTopics: [
      { name: "Words in Context", score: 53, status: "On Track" },
      { name: "Text Structure and Purpose", score: 79, status: "Strong" },
      { name: "Cross-Text Connections", score: 68, status: "On Track" },
    ]
  },
  {
    id: 3, title: "Expression of Ideas", score: 81, icon: FaPencilAlt, iconBg: "bg-red-50 text-red-500",
    subTopics: [
      { name: "Rhetorical Synthesis", score: 81, status: "Strong" },
      { name: "Transitions", score: 53, status: "On Track" },
    ]
  },
  {
    id: 4, title: "Standard English Conventions", score: 53, icon: FaBookReader, iconBg: "bg-teal-50 text-teal-600",
    subTopics: [
      { name: "Boundaries", score: 81, status: "Strong" },
      { name: "Form, Structure, and Sense", score: 53, status: "On Track" },
    ]
  },
];

// ==========================================
// SECTION 3: COMPONENTS
// ==========================================


const ChartsSection = () => {
  const cardStyle = "bg-white rounded-2xl p-6 shadow-sm flex-1 min-w-[300px] border border-gray-100";
  const titleStyle = "text-lg font-bold text-gray-800 mb-6 flex items-center";

  return (
    <div className="flex flex-wrap gap-6 mb-8">
      {/* Card 1: Bar Chart */}
      <div className={cardStyle}>
        <div className={titleStyle}>
          <span className="w-1 h-5 bg-orange-400 rounded-sm mr-3"></span>
          Topic Progress Comparison
        </div>
        <div className="h-[300px] text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#eee" />
              <YAxis 
                dataKey="shortName" type="category" axisLine={false} tickLine={false} width={80}
                tick={{ fill: colors.textLight, fontSize: '12px' }}
              />
              <XAxis 
                type="number" domain={[0, 100]} axisLine={false} tickLine={false}
                tickFormatter={(tick) => `${tick}%`} ticks={[0, 25, 50, 75, 100]} tick={{ fill: colors.textLight }}
              />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" barSize={24} shape={<CustomBarShape />}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value >= 75 ? colors.green : colors.orange} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Card 2: Radar Chart */}
      <div className={cardStyle}>
        <div className={titleStyle}>
          <span className="w-1 h-5 bg-blue-500 rounded-sm mr-3"></span>
          Skills Overview
        </div>
        <div className="h-[300px] text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid strokeDasharray="3 3" stroke="#eee" />
              <PolarAngleAxis dataKey="shortName" tick={{ fill: colors.textLight, fontSize: '12px' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={5} tickFormatter={(tick) => `${tick}%`} axisLine={false} tick={{ fill: '#ccc', fontSize: '10px' }} />
              <Radar name="Progress" dataKey="value" stroke={colors.orange} fill={colors.orange} fillOpacity={0.5} />
              <Legend iconType="rect" wrapperStyle={{ fontSize: '12px', color: colors.textDark, marginTop: '10px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- 3.2 Accordion Card Component ---
const TopicCard = ({ topic }) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = topic.icon;
  
  const isHighParams = topic.score >= 75;
  const progressColor = isHighParams ? "bg-emerald-500" : "bg-orange-400";
  const textColor = isHighParams ? "text-emerald-500" : "text-orange-500";
  const borderColor = isOpen ? (isHighParams ? "border-emerald-200" : "border-orange-200") : "border-transparent";

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border transition-all duration-300 ${isOpen ? `ring-1 ${borderColor} shadow-md` : "border-gray-100"}`}>
      <div className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-start justify-between gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${topic.iconBg}`}>
            <Icon className="text-xl" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-gray-800 text-base md:text-lg">{topic.title}</h3>
              <div className="flex items-center gap-3">
                <span className={`text-xl font-bold ${textColor}`}>{topic.score}%</span>
                {isOpen ? <FaChevronUp className="text-gray-400 text-sm" /> : <FaChevronDown className="text-gray-400 text-sm" />}
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${topic.score}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="mt-6 pt-6 border-t border-dashed border-gray-200 animate-fadeIn">
          <div className="flex justify-between items-center mb-4 text-xs text-gray-500 font-medium uppercase tracking-wide">
            <span>Sub-Topics ({topic.subTopics.length})</span>
            <span>Sorted by progress</span>
          </div>
          <div className="space-y-4">
            {topic.subTopics.map((sub, idx) => {
              const isSubHigh = sub.score >= 75;
              const subColor = isSubHigh ? "text-emerald-600 bg-emerald-50" : "text-orange-600 bg-orange-50";
              const subBarColor = isSubHigh ? "bg-emerald-500" : "bg-orange-400";
              const SubIcon = isSubHigh ? FaChartLine : FaMinus;

              return (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <SubIcon className={`text-xs ${isSubHigh ? "text-emerald-500" : "text-orange-400"}`} />
                      <span className="text-sm font-semibold text-gray-700">{sub.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${subColor}`}>{sub.status}</span>
                      <span className={`text-sm font-bold ${isSubHigh ? "text-emerald-600" : "text-orange-500"}`}>{sub.score}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${subBarColor}`} style={{ width: `${sub.score}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// --- 3.3 NEW COMPONENT: Overall Topic Leaderboard (Ranked List) ---
// --- 3.3 NEW COMPONENT: Overall Topic Leaderboard (Grid Cards) ---
const TopicLeaderboard = ({ allData }) => {
    // Flatten and sort data
    const flatData = allData.flatMap(topic => 
        topic.subTopics.map(sub => ({
            name: sub.name,
            value: sub.score,
            status: sub.status,
            parentCategory: topic.title,
            // icon: topic.icon // Icon not needed in this specific grid view per screenshot
        }))
    ).sort((a, b) => b.value - a.value);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flatData.map((item, index) => {
                const isHigh = item.value >= 75;
                const barColor = isHigh ? "bg-emerald-500" : "bg-orange-400";
                const scoreColor = isHigh ? "text-emerald-500" : "text-orange-500";
                
                return (
                    <div 
                        key={index} 
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs text-gray-400 font-medium truncate pr-2" title={item.parentCategory}>
                                    {item.parentCategory}
                                </span>
                                <span className={`text-xl font-bold ${scoreColor}`}>
                                    {item.value}%
                                </span>
                            </div>
                            <h4 className="text-base font-bold text-gray-800 mb-4 line-clamp-2 min-h-[3rem]">
                                {item.name}
                            </h4>
                        </div>
                        
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${barColor}`} 
                                style={{ width: `${item.value}%` }}
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


// ==========================================
// SECTION 4: MAIN DASHBOARD
// ==========================================

export default function CompleteDashboard() {
  return (
    <div className="">
      <div className="mx-auto space-y-10">
        

        {/* 1. VISUAL OVERVIEW (Top Charts) */}
        <section>
          <ChartsSection />
        </section>

        {/* 2. DETAILED BREAKDOWN (Accordions) */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {accordionData.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        </section>

        {/* 3. NEW SECTION: ALL SUB-TOPICS CHART */}
        <section>
            <div className="flex items-center gap-3 mb-6 mt-8">
                <h2 className="text-2xl font-bold text-gray-800">Overall Topic Leaderboard</h2>
            </div>
            <TopicLeaderboard allData={accordionData} />
        </section>

      </div>
    </div>
  );
}