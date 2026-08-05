import { Input } from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveValue } from "@/lib/features/test/testSlice";

function GridInInput({ questionId }) {
  const dispatch = useDispatch();

  const ansValue = useSelector(
    (state) => state.test.answerMap[questionId]?.gridinAnswer || ""
  );

  const handleChange = (e) => {
    dispatch(
      saveValue({
        questionId,
        value: e.target.value,
      })
    );
  };

  return (
    <div>
      <div>Answer:</div>

      <Input
        value={ansValue}
        onChange={handleChange}
        className="w-full"
        placeholder="Enter your answer"
      />
    </div>
  );
}

export default GridInInput;