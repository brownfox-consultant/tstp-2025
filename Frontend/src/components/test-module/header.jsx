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
    <header className="w-full bg-neutral-100 border-b-2 border-dashed border-black">
      <div className="lg:hidden w-full px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <span className="text-lg font-semibold text-gray-800 me-2">{name}</span>
            {currentSection && (
              <span className="text-xs text-gray-800">
                {`Sub: ${subjectName}`} {sectionName && `| Sec: ${sectionName}`}
              </span>
            )}
          </div>
          <div className="flex-shrink-0">
            {timeLeft ? <TestTimer expiryTimestamp={time} /> : <TestStopwatch />}
          </div>
        </div>

        {/* Row 2: Directions and Action Buttons */}
        <div className="flex items-center justify-between">
          <DirectionsDropdown
            dropdownVisible={dropdownVisible}
            setDropdownVisible={setDropdownVisible}
          />

          <div className="flex items-center gap-1">
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
      </div>

      {/* Desktop Layout (>= lg) */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4 px-10 py-3">
        {/* Left Column: Test Name & Directions */}
        <div className="flex flex-row items-center gap-4">
          {/* Text Block */}
          <div className="flex flex-col justify-center">
            <span className="text-lg font-semibold leading-tight">
              {name}
            </span>

            {currentSection && (
              <div className="flex items-center text-xs md:text-sm text-gray-500 font-medium mt-0.5">
                <span className="whitespace-nowrap">
                  <span className="hidden sm:inline text-gray-400 font-normal">Sub: </span>
                  {subjectName}
                </span>

                {sectionName && (
                  <>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="whitespace-nowrap">
                      <span className="hidden sm:inline text-gray-400 font-normal">Sec: </span>
                      {sectionName}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Dropdown Button */}
          <div className="">
            <DirectionsDropdown
              dropdownVisible={dropdownVisible}
              setDropdownVisible={setDropdownVisible}
            />
          </div>
        </div>

        {/* Center Column: Timer */}
        <div className="flex items-center justify-center">
          {timeLeft ? <TestTimer expiryTimestamp={time} /> : <TestStopwatch />}
        </div>

        {/* Right Column: Action Buttons */}
        <div className="flex items-center justify-end gap-2">
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
