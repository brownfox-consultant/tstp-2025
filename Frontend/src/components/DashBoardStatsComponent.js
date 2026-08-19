"use client";
import React, { useEffect, useState } from "react";
import { getDashboardStats } from "@/app/services/authService";
import { usePathname, useRouter } from "next/navigation";
import { TestIcon, StatsPracticeIcon as PracticeIcon, ChartIcon } from "@/components/icons/stats-icons";

function DashBoardStatsComponent({ date }) {
  const [stats, setStats] = useState([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const params = {
      date_range: date,
    };
    getDashboardStats(params).then((result) => {
      const transformedStats = [
        {
          title: "Full Length Tests",
          count: result.data.full_length_tests.count,
          result: result.data.full_length_tests.change_percentage,
          icon: <TestIcon />,
          gradientClass: "from-orange-500 to-amber-400",
          bgClass: "bg-orange-50",
          textClass: "text-orange-500",
          link: "/test?tab=full",
        },
        {
          title: "Practice Questions",
          count: result.data.practice_tests.count,
          result: result.data.practice_tests.change_percentage,
          icon: <PracticeIcon />,
          gradientClass: "from-blue-500 to-cyan-400",
          bgClass: "bg-blue-50",
          textClass: "text-blue-500",
          link: "/test?tab=self",
        },
        {
          title: "Average Score",
          count: result.data.overall_average_percentage.average_percentage,
          result: result.data.overall_average_percentage.change_percentage,
          icon: <ChartIcon />,
          gradientClass: "from-emerald-500 to-teal-400",
          bgClass: "bg-emerald-50",
          textClass: "text-emerald-500",
          isPercentage: true,
        },
      ];
      setStats(transformedStats);
    });
  }, [date]);

  const handleViewAllClick = (link) => {
    if (!link) return;
    const basePath = pathname.split("/").slice(0, 4).join("/");
    router.push(`${basePath}${link}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 ">
      {stats.map((stat, index) => (
        <div key={index} className="relative bg-white rounded-lg p-6 border-2 border-gray-50 shadow-md hover:shadow-lg overflow-hidden group">
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradientClass}`} />
          <div className="flex justify-between items-start mb-4 ">
            <p className="text-sm font-medium text-gray-500">{stat.title}</p>
            {stat.link && (
              <button
                onClick={() => handleViewAllClick(stat.link)}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors hover:underline bg-transparent"
              >
                View all →
              </button>
            )}
          </div>
          
          {/* Value and Change */}
          <div className="flex justify-between items-end">
            <div className={`text-4xl font-bold ${stat.textClass}`}>
              {stat.isPercentage ? `${stat.count}%` : stat.count}
            </div>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${stat.bgClass} ${stat.textClass}`}>
              <span>{stat.result > 0 ? "↑" : "↓"}</span>
              {Math.abs(stat.result)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DashBoardStatsComponent;
