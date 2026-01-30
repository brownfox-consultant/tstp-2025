
import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  LoginOutlined, 
  FileTextOutlined,
  CalendarOutlined,
  FireOutlined,
  PlayCircleOutlined,
  ReadOutlined,
  TeamOutlined,
  FilterOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  StarOutlined,
  PieChartOutlined
} from "@ant-design/icons";

// --- Mock Data Section ---

// 1. Weekly Activity (For Tests Bar Chart)
const weeklyActivityData = [
  { day: 'Mon', tests: 1 },
  { day: 'Tue', tests: 0 },
  { day: 'Wed', tests: 2 },
  { day: 'Thu', tests: 1 },
  { day: 'Fri', tests: 3 },
  { day: 'Sat', tests: 0 },
  { day: 'Sun', tests: 4 },
];

// 2. Score Progression (New - Replaces Avg Time)
const scoreTrendData = [
    { test: 'Test 1', score: 1050, accuracy: 75 },
    { test: 'Test 2', score: 1120, accuracy: 78 },
    { test: 'Test 3', score: 1090, accuracy: 76 },
    { test: 'Test 4', score: 1250, accuracy: 82 },
    { test: 'Test 5', score: 1340, accuracy: 88 },
    { test: 'Test 6', score: 1450, accuracy: 92 },
];


// 3. Resource Mix
const resourceData = [
  { name: 'Practice Tests', value: 45, color: '#a855f7' },
  { name: 'Video Lessons', value: 30, color: '#ef4444' },
  { name: 'Reading Material', value: 25, color: '#14b8a6' },
];

// 4. Badges
const badges = [
  { id: 1, name: '7-Day Streak', icon: <FireOutlined className="text-orange-500 text-2xl" />, desc: 'Logged in for 7 days in a row' },
  { id: 2, name: 'Speedster', icon: <ThunderboltOutlined className="text-yellow-500 text-2xl" />, desc: 'Solved 10 questions < 30s' },
  { id: 3, name: 'Weekend Warrior', icon: <ReadOutlined className="text-blue-500 text-2xl" />, desc: ' studied 5+ hours on Sunday' },
  { id: 4, name: 'Algebra Ace', icon: <StarOutlined className="text-purple-500 text-2xl" />, desc: '90% Accuracy in Algebra' },
];

const StudentActivityLog = () => {
    const [filter, setFilter] = useState('ALL');

    // Static Mock Stats
    const stats = {
      activeDays: 142,
      maxStreak: 12,
      totalTests: 45,
      avgScore: "88%",
      studyHours: "124h"
    };

    // Heatmap Generation
    const generateHeatmapData = () => {
      const data = [];
      const today = new Date();
      for (let i = 0; i < 364; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const intensity = Math.random() > 0.6 ? Math.floor(Math.random() * 4) : 0; 
          data.push({ date, intensity });
      }
      return data.reverse();
    };
    const heatmapData = generateHeatmapData();

    // Timeline Logs
    const allLogs = [
        { id: 1, type: "MILESTONE", title: "🎉 Accuracy Milestone!", description: "Your Math accuracy hit 95% this week. Keep it up!", timestamp: "Just Now", icon: <TrophyOutlined className="text-yellow-500" />, color: "border-yellow-400 bg-yellow-50", tag: "Achievement" },
        { id: 2, type: "TEST", title: "SAT Practice Test #8", description: "Scored 1450/1600 (92% Accuracy)", timestamp: "Today, 10:45 AM", icon: <CheckCircleOutlined className="text-green-500" />, color: "border-green-500", tag: "Test" },
        { id: 3, type: "LOGIN", title: "Logged In", description: "Session started from IP 192.168.1.105", timestamp: "Today, 09:00 AM", icon: <LoginOutlined className="text-blue-500" />, color: "border-blue-500", tag: "System" },
        { id: 4, type: "VIDEO", title: "Watched Video Lesson", description: "Algebra: Quadratic Functions (25 mins)", timestamp: "Today, 09:15 AM", icon: <PlayCircleOutlined className="text-red-500" />, color: "border-red-500", tag: "Learning" },
        { id: 6, type: "DOUBT", title: "Raised a Doubt", description: "Math > Algebra: 'How to solve quadratic equations efficiently?'", timestamp: "Yesterday, 04:30 PM", icon: <ClockCircleOutlined className="text-orange-500" />, color: "border-orange-500", tag: "Support" },
        { id: 7, type: "TEST", title: "Started SAT Mock Test #5", description: "Duration: 3h 15m planned", timestamp: "Yesterday, 02:00 PM", icon: <FileTextOutlined className="text-purple-500" />, color: "border-purple-500", tag: "Test" },
    ];

    const logs = filter === 'ALL' ? allLogs : allLogs.filter(l => l.tag === filter || l.type === filter);

    const getIntensityClass = (level) => {
        switch(level) {
            case 1: return "bg-green-200";
            case 2: return "bg-green-400";
            case 3: return "bg-green-600";
            default: return "bg-gray-100";
        }
    };

    const filters = [
        { key: 'ALL', label: 'All Activity' },
        { key: 'Achievement', label: 'Achievements' },
        { key: 'Test', label: 'Tests' },
        { key: 'Learning', label: 'Learning' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mx-auto">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-indigo-100 shadow-lg">
                        <CalendarOutlined className="text-white text-lg" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Student Activity Log</h3>
                        <p className="text-sm text-gray-500">Track logs, attempts, and daily engagement</p>
                    </div>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filter === f.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                    <div className="text-orange-600/70 text-[10px] font-bold uppercase tracking-wider mb-1">Active Days</div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-800">{stats.activeDays}</span>
                    </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <div className="text-blue-600/70 text-[10px] font-bold uppercase tracking-wider mb-1">Max Streak</div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-800">{stats.maxStreak}</span>
                        <FireOutlined className="text-orange-500 text-sm" />
                    </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                    <div className="text-purple-600/70 text-[10px] font-bold uppercase tracking-wider mb-1">Tests Taken</div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-800">{stats.totalTests}</span>
                    </div>
                </div>
                <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                    <div className="text-green-600/70 text-[10px] font-bold uppercase tracking-wider mb-1">Avg Score</div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-800">{stats.avgScore}</span>
                    </div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <div className="text-indigo-600/70 text-[10px] font-bold uppercase tracking-wider mb-1">Total Time</div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-800">{stats.studyHours}</span>
                    </div>
                </div>
            </div>

            {/* Badges */}
            <div className="mb-8 p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-xl">
                 <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <TrophyOutlined className="text-yellow-500" /> Recent Achievements
                 </h4>
                 <div className="flex gap-4 overflow-x-auto pb-2">
                    {badges.map(b => (
                        <div key={b.id} className="min-w-[160px] p-3 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                            <div className="mb-2 p-2 bg-gray-50 rounded-full">{b.icon}</div>
                            <h5 className="font-bold text-xs text-gray-800 mb-1">{b.name}</h5>
                            <p className="text-[10px] text-gray-500 leading-tight">{b.desc}</p>
                        </div>
                    ))}
                 </div>
            </div>

            {/* ANALYTICS GRID */}
            <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Performance Analytics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-10">
                
                {/* 1. Score Progression (REPLACED FROM TIME TREND) */}
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <h5 className="text-xs font-bold text-gray-700 mb-4 flex items-center gap-2">
                         <RiseOutlined className="text-green-500"/> Score Progression (Last 6 Tests)
                    </h5>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={scoreTrendData}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="test" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} domain={[800, 1600]} />
                                <Tooltip contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                 {/* 2. Resource Mix */}
                 <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative">
                    <h5 className="text-xs font-bold text-gray-700 mb-4 flex items-center gap-2">
                         <PieChartOutlined /> Resource Usage Breakdown
                    </h5>
                    <div className="h-48 flex items-center">
                        <ResponsiveContainer width="50%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={resourceData} 
                                    innerRadius={40} 
                                    outerRadius={60} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {resourceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="w-1/2 text-xs">
                             {resourceData.map(r => (
                                 <div key={r.name} className="flex items-center gap-2 mb-2">
                                     <div className="w-2 h-2 rounded-full" style={{backgroundColor: r.color}}></div>
                                     <span className="text-gray-600">{r.name} ({r.value}%)</span>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>

                {/* 3. Tests Per Day */}
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <h5 className="text-xs font-bold text-gray-700 mb-4">Tests Completed (Last 7 Days)</h5>
                    <div className="h-40">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyActivityData}>
                                <CartesianGrid vertical={false} opacity={0.2} />
                                <XAxis dataKey="day" tick={{fontSize: 10}} axisLine={false} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="tests" fill="#8884d8" radius={[4,4,0,0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                 {/* 4. Comparison Bar */}
                 <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col justify-center">
                    <h5 className="text-xs font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <RiseOutlined /> You vs Top 10% Students
                    </h5>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                                <span>Your Study Hours</span>
                                <span>24h/week</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{width: '65%'}}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                                <span>Top Students Avg</span>
                                <span>32h/week</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Heatmap */}
            <div className="mb-10">
                <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Yearly Consistency</h4>
                <div className="flex flex-wrap gap-1 md:gap-1.5 p-4 border border-gray-100 rounded-xl bg-white overflow-hidden justify-start">
                    {heatmapData.map((d, i) => (
                        <div 
                            key={i} 
                            title={`${d.date.toDateString()}: ${d.intensity > 0 ? 'Active' : 'No activity'}`}
                            className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm ${getIntensityClass(d.intensity)}`}
                        />
                    ))}
                </div>
            </div>

            {/* Advanced Timeline */}
            <div>
                <h4 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wide flex justify-between items-center">
                    <span>Detailed Timeline</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px]">Showing {logs.length} events</span>
                </h4>
                <div className="space-y-0 pl-2">
                    {logs.length > 0 ? logs.map((log) => (
                        <div key={log.id} className="relative flex gap-4 pb-6 group">
                            <div className="absolute top-2 bottom-0 left-[19px] w-0.5 bg-gray-100 -z-10 group-last:hidden"></div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 ${log.color} shrink-0 shadow-sm z-10 group-hover:scale-110 transition-transform ${log.type === 'MILESTONE' ? 'ring-4 ring-yellow-100' : ''}`}>
                                {log.icon}
                            </div>
                            <div className="flex-1 pt-1">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                    <h5 className="font-bold text-gray-800 text-sm">{log.title}</h5>
                                    <span className="text-xs text-gray-400 font-medium whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded-full">{log.timestamp}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-0.5 leading-snug">{log.description}</p>
                                <div className="mt-2 flex gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                        log.tag === 'Test' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                        log.tag === 'Achievement' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                        log.tag === 'Learning' ? 'bg-red-50 text-red-600 border-red-100' :
                                        log.tag === 'System' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}>
                                        {log.tag}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-gray-400 italic">No activity found for this filter.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentActivityLog;
