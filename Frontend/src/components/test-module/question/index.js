import React, { useState } from "react";
import QuestionComponent from "./QuestionComponent";
import SplitPane from "react-split-pane";
import MathContent from "@/components/MathContent";
import { ArrowsAltOutlined, FullscreenExitOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

function Question() {
  const questions = useSelector((state) => state.test.questions);
  const currentQuestionIndex = useSelector(
    (state) => state.test.currentQuestionIndex
  );
  const question = questions[currentQuestionIndex];
  const { question_type, question_subtype } = question;
  const [size, setSize] = useState(
    window.localStorage.getItem("splitPos") || "50%"
  );
  if (question_type == "MCQ" && question_subtype !== "READING_COMPREHENSION") {
    return (
      <div className=" mx-auto max-h-96 p-5 max-w-2xl">
        <QuestionComponent />
      </div>
    );
  } else if (
    question_type == "MCQ" &&
    question_subtype === "READING_COMPREHENSION"
  ) {
    return (
      <SplitPane
        className="relative"
        split="vertical"
        minSize={size}
        style={{ maxHeight: "80%" }}
        resizerClassName="cursor-col-resize"
        resizerStyle={{ width: "4px", border: "2px solid gray" }}
        // defaultSize={parseInt(window.localStorage.getItem("splitPos"), "50%")}
        // onChange={(size) => window.localStorage.setItem("splitPos", size)}
      >
        <div className="p-10 overflow-x-hidden max-h-full overflow-y-scroll max-w-2xl mx-auto">
          <div
            onClick={() => setSize(size == "66%" ? "50%" : "66%")}
            className="absolute right-2 top-2 cursor-pointer"
          >
            {size == "66%" ? (
              <FullscreenExitOutlined
                color="blue"
                className="border rounded-full p-1"
              />
            ) : (
              <ArrowsAltOutlined className="border rounded-full p-1" />
            )}
          </div>
          <MathContent
            cls={"p-4"}
            content={question?.reading_comprehension_passage}
          />
        </div>
        <div className="p-10 overflow-x-hidden max-h-full overflow-y-scroll max-w-2xl mx-auto">
          <div
            onClick={() => setSize(size == "33%" ? "50%" : "33%")}
            className="absolute left-2 top-2 cursor-pointer"
          >
            {size == "33%" ? (
              <FullscreenExitOutlined className="border rounded-full p-1" />
            ) : (
              <ArrowsAltOutlined
                className="border rounded-full p-1"
                rotate="90"
              />
            )}
          </div>
          <QuestionComponent />
        </div>
      </SplitPane>
    );
  } else if (question_type == "GRIDIN" && question.directions) {
    return (
      <SplitPane
        className="relative"
        split="vertical"
        minSize={size}
        style={{ maxHeight: "80%" }}
        resizerClassName="cursor-col-resize"
        resizerStyle={{ width: "4px", border: "2px solid gray" }}
        // defaultSize={parseInt(window.localStorage.getItem("splitPos"), "50%")}
        // onChange={(size) => window.localStorage.setItem("splitPos", size)}
      >
        <div className="p-10 overflow-x-hidden max-h-full overflow-y-scroll max-w-2xl mx-auto">
          <div
            onClick={() => setSize(size == "66%" ? "50%" : "66%")}
            className="absolute right-2 top-2 cursor-pointer"
          >
            {size == "66%" ? (
              <FullscreenExitOutlined
                color="blue"
                className="border rounded-full p-1"
              />
            ) : (
              <ArrowsAltOutlined className="border rounded-full p-1" />
            )}
          </div>
          <MathContent cls={"p-4"} content={question?.directions} />
        </div>

        <div className="p-10 overflow-x-hidden max-h-full overflow-y-scroll max-w-2xl mx-auto">
          <div
            onClick={() => setSize(size == "33%" ? "50%" : "33%")}
            className="absolute left-2 top-2 cursor-pointer"
          >
            {size == "33%" ? (
              <FullscreenExitOutlined className="border rounded-full p-1" />
            ) : (
              <ArrowsAltOutlined
                className="border rounded-full p-1"
                rotate="90"
              />
            )}
          </div>
          <QuestionComponent />
        </div>
      </SplitPane>
    );
  } else if (question_type == "GRIDIN") {
    return (
      <div className=" mx-auto max-h-96 p-5 max-w-2xl">
        <QuestionComponent />
      </div>
    );
  }
}

export default Question;
