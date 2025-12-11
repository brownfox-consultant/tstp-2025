import React, { useEffect, useState } from "react";
import { getDashboardStats } from "@/app/services/authService";
import { Col, Row } from "antd";
import { usePathname, useRouter } from "next/navigation";

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
          title: "Full length tests",
          count: result.data.full_length_tests.count,
          result: result.data.full_length_tests.change_percentage,
        },
        {
          title: "Practice Questions",
          count: result.data.practice_tests.count,
          result: result.data.practice_tests.change_percentage,
        },
        {
          title: "Avg score of all the tests",
          count: result.data.overall_average_percentage.average_percentage,
          result: result.data.overall_average_percentage.change_percentage,
        },
      ];
      setStats(transformedStats);
    });
  }, [date]);

  const handleViewAllClick = (title) => {
    const basePath = pathname.split("/").slice(0, 3).join("/");
    console.log("title",title)
    if (title === "Full length tests") {
      router.push(`${basePath}/test?tab=full`);
    } else if (title === "Practice Questions") {
      router.push(`${basePath}/test?tab=self`);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={[16, 16]}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <div className="border border-gray-300 rounded-lg p-5">
              <div className="flex justify-between mb-8">
                <span className="text-base font-semibold">{stat.title}</span>
                {stat.title !== "Avg score of all the tests" && (
                  <a
                    onClick={() => handleViewAllClick(stat.title)}
                    className="text-orange-500 no-underline cursor-pointer"
                  >
                    View all
                  </a>
                )}
              </div>
              <div className="flex justify-between items-center text-2xl mb-2">
                <div className="text-left font-bold">
                  {stat.title === "Avg score of all the tests"
                    ? `${stat.count}%`
                    : stat.count}
                </div>
                <div className="text-gray-500 text-sm ml-auto font-semibold">
                  Result{" "}
                  <span
                    className={`px-2 py-1 rounded-l-full rounded-r-full font-bold ${
                      stat.result > 0
                        ? "text-green-500 bg-green-50"
                        : "text-red-400 bg-red-50"
                    }`}
                  >
                    {stat.result > 0 ? "↑" : "↓"} {stat.result}%
                  </span>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default DashBoardStatsComponent;
