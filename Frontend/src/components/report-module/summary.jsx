import React from "react";

function Summary({ data }) {
  const { total_score, subjects } = data || "";
  return (
    <div className="w-full border border-black my-4 mb-16 pb-8 flex flex-col gap-4 place-items-center relative">
      <div className=" font-medium text-6xl p-4">Score Summary</div>
      <div className="border-b border-black w-11/12"></div>
      <div className=" text-5xl font-extralight tracking-wide">
        Total Score is: <span className="font-medium">{total_score}</span>
      </div>
      <div className="w-full flex justify-center gap-32">
        {subjects.map((subject) => {
          let width = Math.round(
            ((subject.subject_score - subject.subject_min_score) /
              (subject.subject_max_score - subject.subject_min_score)) *
              100
          );

          return (
            <div
              key={subject.name}
              className=" basis-48 flex flex-col place-items-center gap-3"
            >
              <div className=" text-3xl  font-normal">{subject.name}</div>
              <div className="flex gap-3">
                <div className="text-5xl font-medium ">
                  {subject.subject_score}
                </div>
                <div className=" border border-black h-full"></div>
                <div className=" flex place-items-end font-semibold">
                  of {subject.subject_max_score}
                </div>
              </div>

              <div className="w-full bg-slate-200 border rounded-md">
                <div
                  className={`h-3 rounded-md ${
                    subject.subject_score < 0 ? "bg-red-500" : "bg-blue-600"
                  }`}
                  style={{
                    width: `${width}%`,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="arrow-down-outside absolute -bottom-10 left-1/2 -translate-x-1/2 "></div>
      <div className="arrow-down-inside absolute -bottom-10 left-1/2 -translate-x-1/2 "></div>
    </div>
  );
}

export default Summary;
