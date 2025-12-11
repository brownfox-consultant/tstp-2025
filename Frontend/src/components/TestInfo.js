import { ExamContext } from "@/app/student/[id]/(base-layout)/test/full/[testId]/page";
import { Steps } from "antd";
import { useSelector } from "react-redux";
import { useContext } from "react";

function TestInfo({ currentSubjectIndex, currentSectionIndex }) {
  // const { testDetails, currentSection, sectionOrderItems } =
  //   useContext(ExamContext);

  const sectionOrderItems = useSelector(
    (state) => state.test.sectionOrderItems
  );
  const currentSection = useSelector(
    (state) => state.test.currentArraySectionIndex
  );
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
