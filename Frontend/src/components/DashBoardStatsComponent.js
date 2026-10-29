"use client";
import React, { useEffect, useState } from "react";
import { getDashboardStats } from "@/app/services/authService";
import { usePathname, useRouter } from "next/navigation";
import {
  TestIcon,
  StatsPracticeIcon as PracticeIcon,
} from "@/components/icons/stats-icons";

function DashBoardStatsComponent({ date }) {
  const [stats, setStats] = useState([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    getDashboardStats({ date_range: date })
      .then((result) => {
        const data = result.data;
        setStats([
          {
            title: "Full Length Tests",
            count: data.full_length_tests.count,
            icon: <TestIcon />,
            gradientClass: "from-orange-500 to-amber-400",
            textClass: "text-orange-600",
            link: "/test?tab=full",
          },
          {
            title: "Practice Questions",
            count: data.practice_tests.count,
            icon: <PracticeIcon />,
            gradientClass: "from-blue-500 to-cyan-400",
            textClass: "text-blue-600",
            link: "/test?tab=self",
          },
          {
            title: "Highest Score",
            fullLengthScore: data.full_length_tests.highest_score,
            practiceScore: data.practice_tests.highest_score,
            gradientClass: "from-emerald-500 to-teal-400",
            textClass: "text-emerald-600",
          },
          {
            title: "Lowest Score",
            fullLengthScore: data.full_length_tests.lowest_score,
            practiceScore: data.practice_tests.lowest_score,
            gradientClass: "from-purple-500 to-violet-400",
            textClass: "text-purple-600",
          },
        ]);
      })
      .catch((error) => console.error("Failed to load dashboard stats:", error));
  }, [date]);

  const handleViewAllClick = (link) => {
    if (!link) return;
    const basePath = pathname.split("/").slice(0, 4).join("/");
    router.push(`${basePath}${link}`);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.09)]"
        >
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradientClass}`} />

          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradientClass} text-white shadow-sm [&>svg]:h-5 [&>svg]:w-5`}>
                {stat.icon || (
                  <span className="text-lg font-semibold" aria-hidden="true">
                    {stat.title === "Highest Score" ? "↑" : "↓"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-5 text-slate-700">{stat.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {stat.link ? "Your activity" : "Across completed tests"}
                </p>
              </div>
            </div>

            {stat.link && (
              <button
                onClick={() => handleViewAllClick(stat.link)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                View all <span aria-hidden="true">→</span>
              </button>
            )}
          </div>

          {stat.fullLengthScore !== undefined ? (
            <div className="grid grid-cols-2 divide-x divide-slate-100 rounded-xl bg-slate-50/80 px-3 py-3">
              <div className="pr-3">
                <p className="text-xs font-medium text-slate-500">Full length</p>
                <p className={`mt-1 text-2xl font-bold tracking-tight ${stat.textClass}`}>
                  {stat.fullLengthScore ?? "--"}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Out of 1600</p>
              </div>
              <div className="pl-3">
                <p className="text-xs font-medium text-slate-500">Practice</p>
                <p className={`mt-1 text-2xl font-bold tracking-tight ${stat.textClass}`}>
                  {stat.practiceScore ?? "--"}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Correct answers</p>
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <p className={`text-4xl font-bold leading-none tracking-tight ${stat.textClass}`}>
                {stat.count}
              </p>
              <span className="pb-0.5 text-xs font-medium text-slate-400">completed</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default DashBoardStatsComponent;
