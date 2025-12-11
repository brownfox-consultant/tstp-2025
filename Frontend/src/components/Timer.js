import React from "react";

function Timer({ timer }) {
  return (
    <div className="text-2xl ">
      Time Remaining:{" "}
      <span className="font-mono">
        {new Date(Number(timer) * 1000).toISOString().substring(11, 19)}
      </span>
    </div>
  );
}

export default Timer;
