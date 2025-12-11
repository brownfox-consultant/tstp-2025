"use client";

import {
  setTimeAsUp,
  toggleShowTime,
  setLastRecordedTime,
} from "@/lib/features/test/testSlice";
import { formatTimeToString } from "@/utils/utils";
import { ClockCircleOutlined } from "@ant-design/icons";
import { Button } from "antd";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTimer } from "react-timer-hook";

export function TestTimer({ expiryTimestamp }) {
  const showTime = useSelector((state) => state.test.showTime);
  const dispatch = useDispatch();
  function handleClick() {
    dispatch(toggleShowTime(!showTime));
  }
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
    onExpire: () => dispatch(setTimeAsUp()),
  });

  useEffect(() => {
    if (isRunning) {
      dispatch(setLastRecordedTime());
    }
  }, [isRunning]);

  return (
    <div style={{ textAlign: "center" }}>
      <div className="text-lg">
        {showTime ? (
          <div>
            {/* <span>{formatTimeToString(hours)}</span>: */}
            <span>{formatTimeToString(minutes)}</span>:
            <span>{formatTimeToString(seconds)}</span>
          </div>
        ) : (
          <ClockCircleOutlined />
        )}
      </div>
      <Button size="small" shape="round" onClick={handleClick}>
        {showTime ? "Hide" : "Show"}
      </Button>

      {/* <p>{isRunning ? "Running" : "Not running"}</p> */}
      {/* <div className="flex flex-row gap-2">
        <button onClick={start}>Start</button>
        <button onClick={pause}>Pause</button>
        <button onClick={resume}>Resume</button>
        <button
          onClick={() => {
            // Restarts to 20 minutes timer
            const time = new Date();
            time.setSeconds(time.getSeconds() + 10);
            restart(time);
          }}
        >
          Restart
        </button>
      </div> */}
    </div>
  );
}
