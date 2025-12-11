import { Input } from "antd";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import debounce from "lodash/debounce";
import { saveValue } from "@/lib/features/test/testSlice";

function GridInInput({ questionId, questionType, questionSubtype }) {
  const dispatch = useDispatch();
  const ansValue = useSelector(
    (state) => state.test.answerMap[questionId].gridinAnswer
  );
  const handleKeyDownLengthCheck = (e) => {
    const { key, target } = e;
    const value = target.value;

    // Allow navigation and editing keys
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
    ];

    const maxLength = value.startsWith("-") ? 6 : 5;
    const extraChar = value.includes("/") || value.includes(".") ? 0 : 0;

    // Allow hyphen only at the beginning
    if (key === "-" && target.selectionStart === 0 && !value.includes("-")) {
      return;
    }

    // Allow forward slash only once, not at the beginning or end, and only if there's no decimal point
    if (
      key === "/" &&
      !value.includes("/") &&
      !value.includes(".") &&
      target.selectionStart !== 0 &&
      (target.selectionStart !== value.length || value.length < maxLength)
    ) {
      return;
    }

    // Allow decimal point only once and only if there's no forward slash
    if (key === "." && !value.includes(".") && !value.includes("/")) {
      return;
    }

    // Check the maxLength condition for all inputs

    // Prevent input if maxLength is reached
    if (value.length + extraChar >= maxLength && !allowedKeys.includes(key)) {
      e.preventDefault();
    }

    // Allow numbers
    if (/^[0-9]$/.test(key)) {
      return;
    }

    // Prevent default action for disallowed keys
    if (!allowedKeys.includes(key)) {
      e.preventDefault();
    }
  };

  // const debouncedDispatch = useCallback(
  //   debounce((value) => {
  //     dispatch(saveValue({ questionId, value: value ?? "" }));
  //   }, 300),
  //   [dispatch]
  // );
  const handleChange = (e) => {
    const value = e.target.value;
    dispatch(saveValue({ questionId, value: value ?? "" }));
  };

  return (
    <div className="">
      <div>Answer: </div>
      <Input
        // defaultValue={""}
        value={ansValue}
        className="w-1/6"
        onKeyDown={(e) => handleKeyDownLengthCheck(e)}
        onChange={handleChange}
      />
    </div>
  );
}

export default GridInInput;
