"use client";

import { goToQuestion, setIsReviewPage } from "@/lib/features/test/testSlice";
import {
  CloseOutlined,
  EnvironmentOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { Button, Dropdown } from "antd";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import BookmarkIcon from "./../../../public/bookmark2.svg";
import Image from "next/image";
import { useHotkeys } from "react-hotkeys-hook";

function SectionMapDropdown({ onChangeQuestion }) {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const currentQuestionIndex = useSelector(
    (state) => state.test.currentQuestionIndex
  );
  const dispatch = useDispatch();
  const questions = useSelector((state) => state.test.questions);
  const answerMap = useSelector((state) => state.test.answerMap);
  const name = useSelector((state) => state.test.name);

  const questionItems = questions.map((question) => {
    const { is_marked_for_review } = answerMap[question.id] || false;
    const { selected_options, gridinAnswer } = answerMap[question.id] || {};

    let isAnswered = false;
    if (question.question_type === "MCQ") {
  const hasSelected = Object.values(selected_options || {}).some(
    (val) => val === 1
  );
  isAnswered = hasSelected;
} else {
  isAnswered = Boolean(gridinAnswer);
}

    return {
      id: question.id,
      isAnswered,
      is_marked_for_review,
    };
  });

  function handleQuestionItemClick(index) {
    onChangeQuestion("", index);
    setDropdownVisible(false);
  }

  useHotkeys("alt+o", () => {
    setDropdownVisible((prev) => !prev);
  });

  return (
    <div className="text-sm font-medium">
      {dropdownVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setDropdownVisible(false)}
        ></div>
      )}
      <Dropdown
        open={dropdownVisible}
        onOpenChange={(visible) => setDropdownVisible(visible)}
        arrow="top"
        placement="top"
        overlayClassName="bg-white max-h-fit max-w-4xl"
        trigger={["click"]}
        dropdownRender={() => (
          <div className="px-10 py-2 h-full w-full text-center relative bg-white shadow-md rounded-md">
            <div className="font-bold text-lg">
              <div className="my-4">{name}</div>
              <CloseOutlined
                className="absolute top-7 right-5 cursor-pointer"
                onClick={() => setDropdownVisible(false)}
              />
            </div>
            <div className="py-2 border-t border-b flex justify-between items-center">
              <div>Section Map Guide</div>
              <div className="flex gap-2">
                <EnvironmentOutlined /> Current
                <span className="flex place-items-center">
                  <div className="h-5 w-5 aspect-square border-2 border-dashed mx-2 inline-block"></div>
                  Unanswered
                </span>
                <span className="flex gap-1 place-items-center">
                  <Image className="" src={BookmarkIcon} height={18} width={18} alt="Bookmark" />
                  For Review
                </span>
              </div>
            </div>
            <div className="section-map-content max-h-96 min-h-min grid grid-cols-12 gap-y-7 gap-x-2 flex-wrap w-full my-2 py-5 overflow-y-scroll">
              {questionItems.map((questionItem, index) => {
                const { is_marked_for_review, isAnswered } = questionItem;
                return (
                  <div
                    key={questionItem.id}
                    tabIndex={0}
                    onClick={() => handleQuestionItemClick(index)}
                    className={`relative w-10 h-10 leading-9 font-semibold text-lg text-center border border-dashed cursor-pointer 
                    ${isAnswered
                      ? "bg-blue-700 text-white hover:bg-blue-800"
                      : "hover:bg-neutral-100"
                    }`}
                  >
                    {currentQuestionIndex === index && (
                      <EnvironmentOutlined
                        style={{ color: "black" }}
                        className="text-black absolute -top-5 left-1/2 -translate-x-1/2"
                      />
                    )}
                    {is_marked_for_review && (
                      <Image
                        className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2"
                        src={BookmarkIcon}
                        height={15}
                        width={15}
                        alt="Marked for Review"
                      />
                    )}
                    <span>{index + 1}</span>
                  </div>
                );
              })}
            </div>
            <div className="w-full text-center">
              <Button
                className="my-5"
                type="default"
                shape="round"
                onClick={() => {
                  dispatch(setIsReviewPage(true));
                  setDropdownVisible(false);
                }}
              >
                Go to Review page
              </Button>
            </div>
          </div>
        )}
      >
        <span>
          <Button type="dashed" icon={<UpOutlined />}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Button>
        </span>
      </Dropdown>
    </div>
  );
}

export default SectionMapDropdown;
