"use client";

import React from "react";

export default function Scoreboard() {
  // Data for Recent/Second Last tables (Chronology)
  const testData = [
    { name: "Recent", date: "%", totalScore: 200, engScore: 200, engAcc: "%", mathScore: 610, mathAcc: "%", dateTime: "%", correct: 200, wrong: 200, skip: "%", time: 610, avgTime: "%" },
    { name: "Second Last", date: "%", totalScore: 555, engScore: 430, engAcc: "%", mathScore: 610, mathAcc: "%", dateTime: "%", correct: 555, wrong: 430, skip: "%", time: 610, avgTime: "%" },
    { name: "Third Last", date: "%", totalScore: 780, engScore: 700, engAcc: "%", mathScore: 610, mathAcc: "%", dateTime: "%", correct: 780, wrong: 700, skip: "%", time: 610, avgTime: "%" },
    { name: "Fourth Last", date: "%", totalScore: 10, engScore: 710, engAcc: "%", mathScore: 610, mathAcc: "%", dateTime: "%", correct: 10, wrong: 710, skip: "%", time: 610, avgTime: "%" },
    { name: "Fifth Last", date: "%", totalScore: 1280, engScore: 680, engAcc: "%", mathScore: 610, mathAcc: "%", dateTime: "%", correct: 1280, wrong: 680, skip: "%", time: 610, avgTime: "%" },
  ];

  // Data for Subject name tables
  const subjectData = [
    { name: "English", date: "%", totalScore: 200, engScore: 200, engAcc: "%", mathScore: 610, mathAcc: "%", dateTime: "%", correct: 200, wrong: 200, skip: "%", time: 610, avgTime: "%" },
    { name: "Math", date: "%", totalScore: 555, engScore: 430, engAcc: "%", mathScore: 610, mathAcc: "%", dateTime: "%", correct: 555, wrong: 430, skip: "%", time: 610, avgTime: "%" },
  ];

  const TableOne = ({ data }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-gray-700 text-lg">
            <th className="p-2 text-left align-bottom pb-4"></th>
            <th className="p-2 text-center align-bottom pb-4">Test date</th>
            <th className="p-2 text-center align-bottom pb-4">Total<br />Score</th>
            <th className="p-2 text-center align-bottom pb-4">English<br />Score</th>
            <th className="p-2 text-center align-bottom pb-4">English<br />Accuracy</th>
            <th className="p-2 text-center align-bottom pb-4">Math<br />Score</th>
            <th className="p-2 text-center align-bottom pb-4">Math<br />Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="text-lg border-b border-gray-300">
              <td className="py-4 px-3 text-left font-medium text-black whitespace-nowrap">
                {row.name}
              </td>
              <td className="py-4 px-1">
                  <div className="bg-[#FFE5B4] text-[#333] py-2 px-4 rounded font-semibold text-center mx-auto w-24">
                      {row.date}
                  </div>
              </td>
              <td className="py-4 px-1">
                  <div className="bg-[#1F1F1F] text-white py-2 px-4 rounded font-bold text-center mx-auto w-24">
                      {row.totalScore}
                  </div>
              </td>
              <td className="py-4 px-1">
                  <div className="bg-[#F59403] text-white py-2 px-4 rounded font-bold text-center mx-auto w-24">
                      {row.engScore}
                  </div>
              </td>
              <td className="py-4 px-1">
                  <div className="bg-[#F59403] text-white py-2 px-4 rounded font-bold text-center mx-auto w-24">
                      {row.engAcc}
                  </div>
              </td>
              <td className="py-4 px-1">
                  <div className="bg-[#FFE5B4] text-[#333] py-2 px-4 rounded font-semibold text-center mx-auto w-24">
                      {row.mathScore}
                  </div>
              </td>
              <td className="py-4 px-1">
                  <div className="bg-[#FFE5B4] text-[#333] py-2 px-4 rounded font-semibold text-center mx-auto w-24">
                      {row.mathAcc}
                  </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const TableTwo = ({ data }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-gray-700 text-lg">
            <th className="p-2 text-left align-bottom pb-4"></th>
            <th className="p-2 text-center align-bottom pb-4">Test Date<br />and<br />Time</th>
            <th className="p-2 text-center align-bottom pb-4">Total<br />Correct</th>
            <th className="p-2 text-center align-bottom pb-4">Total<br />Wrong</th>
            <th className="p-2 text-center align-bottom pb-4">Total<br />Skip</th>
            <th className="p-2 text-center align-bottom pb-4">Total<br />Time</th>
            <th className="p-2 text-center align-bottom pb-4">Average<br />Time Per<br />Question</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="text-lg border-b border-gray-300">
              <td className="py-4 px-3 text-left font-medium text-black whitespace-nowrap">
                {row.name}
              </td>
              <td className="py-4 px-1">
                  <div className="bg-[#FFE5B4] text-[#333] py-2 px-4 rounded font-semibold text-center mx-auto w-24">
                      {row.dateTime}
                  </div>
              </td>
              <td className="py-4 px-1">
                  <div className="bg-[#1F1F1F] text-white py-2 px-4 rounded font-bold text-center mx-auto w-24">
                      {row.correct}
                  </div>
              </td>
              <td className="py-4 px-1">
                  <div className="bg-[#F59403] text-white py-2 px-4 rounded font-bold text-center mx-auto w-24">
                      {row.wrong}
                  </div>
              </td>
              <td className="py-4 px-1">
                  <div className="bg-[#F59403] text-white py-2 px-4 rounded font-bold text-center mx-auto w-24">
                      {row.skip}
                  </div>
              </td>
              <td className="py-4 px-1">
                  <div className="bg-[#FFE5B4] text-[#333] py-2 px-4 rounded font-semibold text-center mx-auto w-24">
                      {row.time}
                  </div>
              </td>
              <td className="py-4 px-1">
                  <div className="bg-[#FFE5B4] text-[#333] py-2 px-4 rounded font-semibold text-center mx-auto w-24">
                      {row.avgTime}
                  </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full space-y-16">
      
      {/* SECTION 1: Chronological History */}
      <div className="space-y-8">
        {/* <h3 className="text-2xl font-bold text-center text-gray-800 uppercase tracking-wider mb-4">Test History</h3> */}
        <TableOne data={testData} />
        {/* <TableTwo data={testData} /> */}
      </div>

      {/* SEPARATOR */}
      <hr className="border-gray-200" />

      {/* SECTION 2: Subject Performance */}
      <div className="space-y-8">
        {/* <h3 className="text-2xl font-bold text-center text-gray-800 uppercase tracking-wider mb-4">Subject-wise Analysis</h3> */}
        <TableOne data={subjectData} />
        {/* <TableTwo data={subjectData} /> */}
      </div>

      {/* FOOTER BUTTON */}
      <div className="flex justify-center mt-6">
        <button className="bg-[#41B6FF] hover:bg-[#339ddb] text-white font-bold py-3 px-8 rounded-full text-lg shadow-md transition-colors">
          Click Here to Know More
        </button>
      </div>

    </div>
  );
}
