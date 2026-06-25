import { ExamContext } from "@/app/student/[id]/(base-layout)/test/full/[testId]/page";
import { useSelector } from "react-redux";

import React, { useContext, useEffect } from "react";
import { Steps, Modal } from "antd";
import useFullScreen from "@/utils/useFullScreen";

function TestInfo({ currentSubjectIndex, currentSectionIndex }) {
  // const { testDetails, currentSection, sectionOrderItems } =
  //   useContext(ExamContext);

  const sectionOrderItems = useSelector(
    (state) => state.test.sectionOrderItems
  );
  const currentSection = useSelector(
    (state) => state.test.currentArraySectionIndex
  );
  const { goFullScreen } = useFullScreen();
  useEffect(() => {
  const handleKeyDown = (e) => {
    if (
      e.key === "F5" ||
      (e.ctrlKey && e.key.toLowerCase() === "r")
    ) {
      e.preventDefault();
      return false;
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      Modal.warning({
        title: "Fullscreen Required",
        content: "Please return to fullscreen mode.",
        onOk: () => goFullScreen(),
      });
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("contextmenu", handleContextMenu);
  document.addEventListener(
    "fullscreenchange",
    handleFullscreenChange
  );

  return () => {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("contextmenu", handleContextMenu);
    document.removeEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );
  };
}, []);
  return (
    <div className="my-10 space-y-3">
      <p className="text-2xl font-semibold border-b">
        Sections and Test Pattern
      </p>
      {sectionOrderItems.length > 0 && (
        <Steps
          direction="vertical"
          items={sectionOrderItems.map((sectionItem) => {
            return {
              ...sectionItem,
              description: (
                <>
                  <p>Duration: {sectionItem.duration} Minutes</p>
                  <p>Number of Questions: {sectionItem.no_of_questions}</p>
                </>
              ),
            };
          })}
          current={currentSection}
        />
      )}
    </div>
  );
}

export default TestInfo;
