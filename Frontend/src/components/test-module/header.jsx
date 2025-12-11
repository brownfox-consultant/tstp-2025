"use client";
import React, { useEffect, useState } from "react";
import DirectionsDropdown from "./DirectionsDropdown";
import ExitExamModal from "./exit-modal";
import { useSelector, useDispatch } from "react-redux";
import CalculatorComponent from "./calculator";
import { TestTimer } from "./test-timer";
import TestStopwatch from "./test-stopwatch";
import { useParams, useRouter } from "next/navigation";
import ReferenceSheet from "./reference-sheet";
import { useHotkeys } from "react-hotkeys-hook";
import { toggleShowTime } from "@/lib/features/test/testSlice";
import ShortcutsReference from "./shortcuts-reference";

function TestHeader() {
  const router = useRouter();
  const dispatch = useDispatch();

  const showTime = useSelector((state) => state.test.showTime);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isExamExitModalVisble, setIsExamExitModalVisble] = useState(false);
  const [isCalculatorVisible, setIsCalculatorVisible] = useState(false);
  const [isReferenceSheetVisible, setIsReferenceSheetVisible] = useState(false);
  const [areShortcutsVisible, setAreShortcutsVisible] = useState(false);

  const { id, testType, testId } = useParams();

  const name = useSelector((state) => state.test.name);
  const currentQuestionIndex = useSelector(
    (state) => state.test.currentQuestionIndex
  );
  const questions = useSelector((state) => state.test.questions);
  const isSectionCompleted = useSelector(
    (state) => state.test.isSectionCompleted
  );
  const timeLeft = useSelector((state) => state.test.timeLeft);

  const sectionOrderItems = useSelector((state) => state.test.sectionOrderItems);
  const currentArraySectionIndex = useSelector(
    (state) => state.test.currentArraySectionIndex
  );

  // ✅ current section info
  const currentSection =
    sectionOrderItems?.[currentArraySectionIndex] || null;

  const subjectName = currentSection?.title?.split(" - ")[0] || "";
  const sectionName = currentSection?.section_name || "";

  const time = new Date();
  time.setSeconds(time.getSeconds() + (timeLeft || 0));

  const isCalculatorAllowed =
    questions.length > 0 && questions[currentQuestionIndex]?.show_calculator;

  useEffect(() => {
    if (questions.length === 0 && !isSectionCompleted) {
      router.replace(
        testType === "practice"
          ? `/student/${id}/test/practice/create`
          : `/student/${id}/test/${testId}/begin`
      );
    }
  }, [questions, isSectionCompleted]);

  useHotkeys("alt+c", () => {
    if (isCalculatorAllowed) {
      setIsCalculatorVisible((prev) => !prev);
    }
  });
  useHotkeys("alt+r", () => {
    if (isCalculatorAllowed) {
      setIsReferenceSheetVisible((prev) => !prev);
    }
  });
  useHotkeys("alt+t", () => dispatch(toggleShowTime(!showTime)));
  useHotkeys("alt+d", () => setDropdownVisible((prev) => !prev));
  useHotkeys("alt+k", () => setAreShortcutsVisible((prev) => !prev));

  return (
    <header className="w-full min-h-16 bg-neutral-100 border-b-2 border-dashed border-black px-10 py-2 flex flex-row justify-between">
      <div className="w-full grid grid-cols-3">
        <div>
          <div className="section-name text-lg flex flex-col font-semibold">
            <span>{name}</span>
            {currentSection && (
              <span className="text-sm text-gray-600">
                {`Sub : ${subjectName}`}  {sectionName && `Sec : ${sectionName}`}
              </span>
              
            )}
          </div>
          <DirectionsDropdown
            dropdownVisible={dropdownVisible}
            setDropdownVisible={setDropdownVisible}
          />
        </div>

        <div className="text-center">
          {timeLeft ? <TestTimer expiryTimestamp={time} /> : <TestStopwatch />}
        </div>

        <div className="flex flex-row items-end justify-end">
          {isCalculatorAllowed && (
            <CalculatorComponent
              showCalculator={isCalculatorVisible}
              setShowCalculator={setIsCalculatorVisible}
            />
          )}
          {isCalculatorAllowed && (
            <ReferenceSheet
              isOpen={isReferenceSheetVisible}
              setIsOpen={setIsReferenceSheetVisible}
            />
          )}
          <ShortcutsReference
            isOpen={areShortcutsVisible}
            setIsOpen={setAreShortcutsVisible}
          />
          <ExitExamModal
            setOpenModal={setIsExamExitModalVisble}
            openModal={isExamExitModalVisble}
          />
        </div>
      </div>
    </header>
  );
}

export default TestHeader;
