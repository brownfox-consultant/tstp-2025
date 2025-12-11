import { formatTimeToString } from "@/utils/utils";
import React from "react";
import { useTimer } from "react-timer-hook";

function BreakTimer({ expiryTimestamp, onExpire }) {
  const {
    totalSeconds,
    seconds,
    minutes,
    hours,
    isRunning,
    start,
    pause,
    resume,
    restart,
  } = useTimer({
    expiryTimestamp,
    onExpire: () => onExpire(),
  });

  return (
    <div>
      The next section will automatically begin in{" "}
      <span className=" text-red-500">{formatTimeToString(minutes)}:</span>
      <span className=" text-red-500">{formatTimeToString(seconds)}</span>
    </div>
  );
}

export default BreakTimer;
