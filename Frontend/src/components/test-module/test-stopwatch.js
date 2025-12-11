import { useStopwatch } from "react-timer-hook";
import {
  toggleShowTime,
} from "@/lib/features/test/testSlice";
import { ClockCircleOutlined } from "@ant-design/icons";
import { Button } from "antd";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { formatTimeToString } from "@/utils/utils";

export default function TestStopwatch() {
  const {
    seconds,
    minutes,
  } = useStopwatch({ autoStart: true });

  const showTime = useSelector((state) => state.test.showTime);
  const dispatch = useDispatch();

  function handleClick() {
    dispatch(toggleShowTime(!showTime));
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div className="text-lg">
        {showTime ? (
          <div>
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
    </div>
  );
}
