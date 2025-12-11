  "use client";

  import React, { useEffect, useState } from "react";
  import { useParams, useRouter } from "next/navigation";
  import axios from "axios";
  import { BASE_URL } from "@/app/constants/apiConstants";

function StatCard({ title, value }) {
  const router = useRouter();
  const { id } = useParams();

  const handleViewAll = () => {
    const routeMap = {
      Suggestion: "suggestions",
      Questions: "questions",
    };

    const route = routeMap[title];
    if (route) {
      router.push(`/developer/${id}/${route}`);
    }
  };

  const isQuestions = title === "Questions" && typeof value === "object";

  return (
    <div className="rounded-xl border p-4 shadow-md bg-white">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <button
          onClick={handleViewAll}
          className="text-xs text-orange-500 font-medium"
        >
          View all
        </button>
      </div>

      {isQuestions ? (
        <div className="space-y-1 text-sm text-gray-700">
          <div><strong>Active:</strong> {value.active}</div>
          <div><strong>Inactive:</strong> {value.inactive}</div>
        </div>
      ) : (
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      )}
    </div>
  );
}


  export default function Dashboard() {
    const [notificationSummary, setNotificationSummary] = useState({
    Questions: 0,
    Suggestions: 0,
    Questions_Not_Active_total: 0,
  });

const activeQuestions = notificationSummary.Questions - notificationSummary.Questions_Not_Active_total;

const summaryData = [
  { title: "Suggestion", value: notificationSummary.Suggestions },
  {
    title: "Questions",
    value: {
      active: activeQuestions,
      inactive: notificationSummary.Questions_Not_Active_total,
    },
  },
];

    useEffect(() => {
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
      <div className="p-4 grid gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {summaryData.map((item, index) => (
            <StatCard key={index} title={item.title} value={item.value} />
          ))}
        </div>
      </div>
    );
  }
