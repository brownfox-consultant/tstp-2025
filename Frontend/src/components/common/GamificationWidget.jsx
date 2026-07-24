"use client";
import React from "react";

export default function GamificationWidget({
  streakDays = 5,
  pendingReviews = 14,
  targetScore = 1400,
  currentScore = 1280,
  badges = [
    { id: 1, name: "Math Master", icon: "📐", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { id: 2, name: "Accuracy Ace", icon: "🎯", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { id: 3, name: "Streak Star", icon: "⚡", color: "bg-purple-100 text-purple-700 border-purple-200" },
  ],
  onReviewClick,
}) {
  const scoreProgress = Math.min(100, Math.round((currentScore / targetScore) * 100));

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700/60 mb-6">
      {/* Top Banner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Streak Counter */}
        <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20 animate-pulse">
            🔥
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-amber-400">{streakDays}</span>
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-300">Days Active</span>
            </div>
            <p className="text-xs text-slate-400">Keep practicing daily to build your streak!</p>
          </div>
        </div>

        {/* Pending Reviews & Urgency */}
        <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-bounce">
                Urgent Action
              </span>
              <span className="text-xs text-slate-400 font-medium">Review Backlog</span>
            </div>
            <p className="text-lg font-bold text-white mt-1">
              <span className="text-amber-400 font-extrabold">{pendingReviews}</span> Questions to Review
            </p>
          </div>

          {/* Reserved Orange Action Button */}
          <button
            onClick={onReviewClick}
            className="px-4 py-2 text-xs font-bold text-slate-900 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 rounded-lg shadow-md hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer uppercase tracking-wider"
          >
            Review Now
          </button>
        </div>

        {/* Target Score Progress */}
        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Target Score Progress</span>
            <span className="text-xs font-bold text-cyan-400">{currentScore} / {targetScore} ({scoreProgress}%)</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${scoreProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
            <span>Current: {currentScore}</span>
            <span>Target Goal: {targetScore}</span>
          </div>
        </div>
      </div>

      {/* Badges Strip */}
      <div className="mt-5 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Earned Badges:</span>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border shadow-sm transition-transform hover:scale-105 ${b.color}`}
              >
                <span>{b.icon}</span>
                <span>{b.name}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400 italic">
          Tip: Complete 3 more practice questions to unlock <span className="text-amber-400 font-semibold">"Speed Demon" ⚡</span> badge!
        </div>
      </div>
    </div>
  );
}
