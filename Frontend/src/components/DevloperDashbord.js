  "use client";

  import React, { useEffect, useState } from "react";
  import { useParams, useRouter } from "next/navigation";
  import axios from "axios";
  import { BASE_URL } from "@/app/constants/apiConstants";
import DashboardHeader from "@/components/DashboardHeader";
import {
  LightbulbIcon,
  QuestionIcon,
} from "@/components/icons/dashboard-icons";

function StatCard({ title, value, icon: Icon, gradientClass }) {
  const router = useRouter();
  const { id } = useParams();

  const handleViewAll = () => {
    const routeMap = {
      Suggestion: "suggestions",
      Questions: "questions",
    };

    const route = routeMap[title];
    if (route) {
      router.push(`/tstp/developer/${id}/${route}`);
    }
  };

  const isQuestions = title === "Questions" && typeof value === "object";

  return (
    <div
      className="group relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer bg-white shadow-lg m-0 border border-gray-100"
      onClick={handleViewAll}
    >
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientClass}`} />

      <div className="relative flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          {isQuestions ? (
            <div className="space-y-0.5 mt-1">
              <div className="text-sm text-emerald-600 font-semibold flex items-center gap-1.5 line-height-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active: <span className="text-lg">{value.active}</span>
              </div>
              <div className="text-sm text-rose-500 font-semibold flex items-center gap-1.5 line-height-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                Inactive: <span className="text-lg">{value.inactive}</span>
              </div>
            </div>
          ) : (
            <p className="text-4xl font-bold text-gray-900">{value}</p>
          )}
        </div>

        <div className="p-3 bg-gray-50 rounded-lg text-orange-500 group-hover:scale-110 transition-transform">
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>

      <button
        className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors hover:underline bg-transparent"
        onClick={(e) => {
          e.stopPropagation();
          handleViewAll();
        }}
      >
        View all →
      </button>
    </div>
  );
}


  export default function Dashboard() {
    const [name, setName] = useState("");
    const [notificationSummary, setNotificationSummary] = useState({
    Questions: 0,
    Suggestions: 0,
    Questions_Not_Active_total: 0,
  });

const activeQuestions = notificationSummary.Questions - notificationSummary.Questions_Not_Active_total;

const summaryData = [
  { 
    title: "Suggestion", 
    value: notificationSummary.Suggestions,
    icon: LightbulbIcon,
    gradient: "from-orange-500 to-amber-400"
  },
  {
    title: "Questions",
    value: {
      active: activeQuestions,
      inactive: notificationSummary.Questions_Not_Active_total,
    },
    icon: QuestionIcon,
    gradient: "from-blue-500 to-cyan-400"
  },
];

  const handleRefresh = () => {
    // Refresh logic here
    window.location.reload();
  };

  useEffect(() => {
    // Set user name
    if (typeof window !== "undefined") {
      setName(window.localStorage.getItem("name") || "Developer");
    }
    const fetchNotificationSummary = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/api/doubt/developer_unread_summary/`,
          { withCredentials: true }
        );
        setNotificationSummary({
          Suggestions: response.data.Suggestions,
          Questions: response.data.TotalQuestions,
          Questions_Not_Active_total: response.data.Questions_Not_Active_total,
        });
      } catch (error) {
        console.error("Failed to fetch developer summary:", error);
      }
    };

    fetchNotificationSummary();
  }, []);


    return (
      <div className="space-y-6">
        <DashboardHeader name={name}/>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryData.map((item, index) => (
            <StatCard 
              key={index} 
              title={item.title} 
              value={item.value} 
              icon={item.icon}
              gradientClass={item.gradient}
            />
          ))}
        </div>
      </div>
    );
  }
