import {
  getQuestionDetails,
  takePracticeTest,
} from "@/app/services/authService";
import { Button, Col, Divider, Modal, Row, Skeleton } from "antd";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import PracticeTestOptionsComponent from "./PracticeTestOptions";
import dynamic from "next/dynamic";
import useFullScreen from "@/utils/useFullScreen";
import { useGlobalContext } from "@/context/store";
import MathContent from "./MathContent";

const NewStopwatch = dynamic(() => import("./NewStopwatch"), { ssr: false });

function PracticeTest() {
  const { id, practice_test_id } = useParams();
  const pathname = usePathname();
  const { isFullScreen, goFullScreen, exitFullScreen } = useFullScreen();
  const { setCollapsed } = useGlobalContext();

  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState({});
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [showAnswerFlag, setShowAnswerFlag] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  // const [startTime, setStartTime] = useState(false)
  // const [endTime, setEndTime] = useState(false)

  const [previousClickTime, setPreviousClickTime] = useState(
    new Date().getTime()
  );

  function handleShowAnswer() {
    setShowAnswerFlag(true);
    setSelectedOptions([]);
  }

  function onTestFinish() {
    window.sessionStorage.removeItem("time_taken");
    window.sessionStorage.removeItem("timer");
    setCollapsed(false);
  }

  console.log("isFullScreen", isFullScreen);

  useEffect(() => {
    setQuestions(JSON.parse(window.sessionStorage.getItem("questions")));
    setCollapsed(true);
  }, []);

  useEffect(() => {
    if (currentIndex == questions.length && questions.length != 0) {
      onTestFinish();
      Modal.success({
        title: "Test Completed",
        okText: "Go to Results",
        onOk: () => {
          // if (isFullScreen) {
          exitFullScreen();
          // }
          router.replace(
            `/student/${id}/test/practice/${practice_test_id}/result`
          );
        },
      });
    }
  }, [currentIndex]);

  useEffect(() => {
    if (
      questions.length > 0 &&
      currentIndex >= 0 &&
      currentIndex < questions.length
    ) {
      setLoadingQuestion(true);
      getQuestionDetails(questions[currentIndex])
        .then((res) => {
          setCurrentQuestion(res.data);
        })
        .finally(() => setLoadingQuestion(false));
    }
  }, [currentIndex, questions]);

  useEffect(() => {
    if (showCalculator) {
      // Ensure Desmos script is loaded
      loadDesmosScript(() => {
        // Once the script is loaded, create the calculator
        createCalculator();
      });
    }
  }, [showCalculator]);

  const loadDesmosScript = (callback) => {
    if (window.Desmos) {
      callback();
    } else {
      const script = document.createElement("script");
      script.src =
        "https://www.desmos.com/api/v1.8/calculator.js?apiKey=d991d6335bc1419badc443d7c8f2537a";
      script.async = true;
      script.onload = callback;
      document.body.appendChild(script);
    }
  };

  const createCalculator = () => {
    const modalContent = document.getElementById("calculator-modal-content");
    // Clear previous calculator, if any
    modalContent.innerHTML = "";

    // Create a new container for the Desmos calculator
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "500px";
    modalContent.appendChild(container);

    // Initialize the Desmos calculator in the new container
    const calculator = window.Desmos.GraphingCalculator(container);
  };

  const handleShowCalculator = () => {
    setShowCalculator(true);
  };

  const handleCloseCalculator = () => {
    setShowCalculator(false);
  };

  function onTimeUp() {
    const currentTime = new Date().getTime();
    setPreviousClickTime(currentTime);

    const timeBetweenClicks = currentTime - previousClickTime;

    let payload = {
      answer: {
        [currentQuestion.id]: -1,
      },
      time_taken: Number(timeBetweenClicks / 1000),
      is_skipped: true,
    };
    takePracticeTest(practice_test_id, payload).then((data) => {
      console.log("data", data);
      onTestFinish();
      return Modal.info({
        title: "Time's Up!",
        onOk: () => {
          // if (isFullScreen) {
          exitFullScreen();
          // }
          router.replace(
            `/student/${id}/test/practice/${practice_test_id}/result`
          );
        },
      });
    });
  }

  function handleFinishTest() {
    const currentTime = new Date().getTime();
    setPreviousClickTime(currentTime);

    const timeBetweenClicks = currentTime - previousClickTime;

    let payload = {
      answer: {
        [currentQuestion.id]: -1,
      },
      time_taken: Number(timeBetweenClicks / 1000),
      is_skipped: true,
    };
    takePracticeTest(practice_test_id, payload).then((data) => {
      console.log("data", data);
      onTestFinish();
      return Modal.info({
        title: "Test Finished",
        onOk: () => {
          // if (isFullScreen) {
          exitFullScreen();
          // }
          router.replace(
            `/student/${id}/test/practice/${practice_test_id}/result`
          );
        },
      });
    });
    // setCurrentIndex(questions.length);
  }

  const handleNextQuestion = (operation = "next") => {
    const currentTime = new Date().getTime();
    setPreviousClickTime(currentTime);

    const timeBetweenClicks = currentTime - previousClickTime;

    let payload = {
      answer: {
        [currentQuestion.id]: operation == "skip" ? [-1] : selectedOptions,
      },
      time_taken: Number(timeBetweenClicks / 1000),
      ...(operation == "skip" && { is_skipped: true }),
    };

    takePracticeTest(practice_test_id, payload)
      .then(({ data }) => {
        setCurrentIndex(Number(currentIndex) + 1);
        setSelectedOptions([]);
      })
      .finally(() => setShowAnswerFlag(false));
  };

  return (
    <>
      <div className="flex justify-end">
        <NewStopwatch onTimeUp={onTimeUp} />
      </div>
      <div className="flex justify-between w-full align-middle">
        <p className="mt-3 italic w-96">
          {currentQuestion?.question_type == "MULTI_CHOICE"
            ? "(One or more than one correct options)"
            : "(Single Correct Option)"}
        </p>
        <p className="text-xl font-bold w-full text-right">
          {Number(currentIndex) + 1} of {questions?.length}
        </p>
      </div>
      <Skeleton loading={loadingQuestion}>
        {currentQuestion?.question_type == "READING_COMPREHENSION" ? (
          <>
            <Row className="w-full" gutter={[16]}>
              <Col span={12} className="">
                {" "}
                <MathContent
                  cls={"p-4 reading-passage"}
                  content={currentQuestion?.reading_comprehension_passage}
                />
              </Col>
              <Divider
                type="vertical"
                style={{
                  height: "auto",
                  borderColor: "gray",
                  borderWidth: "2px",
                }}
              />

              <Col span={11}>
                {" "}
                <MathContent
                  cls={"p-2"}
                  content={currentQuestion?.description}
                />
                <div className="w-full">
                  {" "}
                  <PracticeTestOptionsComponent
                    currentQuestion={currentQuestion}
                    selectedOptions={selectedOptions}
                    setSelectedOptions={setSelectedOptions}
                    showAnswer={showAnswerFlag}
                  />
                </div>
                <Divider />
                <div className="flex justify-evenly mt-2">
                  <Button
                    disabled={showAnswerFlag || selectedOptions.length > 0}
                    onClick={handleShowAnswer}
                  >
                    Show Answer
                  </Button>
                  <Button
                    disabled={!showAnswerFlag && selectedOptions?.length == 0}
                    onClick={() =>
                      handleNextQuestion(showAnswerFlag ? "skip" : "next")
                    }
                    // loading={submitLoader}
                  >
                    {showAnswerFlag ? "Next" : "Submit & Next"}
                  </Button>

                  {/* <Button onClick={() => handleNextQuestion("skip")}>
              Skip this question
            </Button> */}

                  {currentQuestion?.show_calculator == true && (
                    <Button onClick={handleShowCalculator}>
                      Show Calculator
                    </Button>
                  )}

                  <Button onClick={handleFinishTest}>Finish Test</Button>
                </div>
              </Col>
            </Row>
          </>
        ) : (
          <div className="w-full">
            <div className="mt-10 mb-5 flex justify-between">
              <p className="">
                <MathContent content={currentQuestion?.description} />
              </p>
            </div>
            <PracticeTestOptionsComponent
              currentQuestion={currentQuestion}
              selectedOptions={selectedOptions}
              setSelectedOptions={setSelectedOptions}
              showAnswer={showAnswerFlag}
            />

            <Divider />
            <div className="flex justify-evenly">
              <Button
                disabled={showAnswerFlag || selectedOptions.length > 0}
                onClick={handleShowAnswer}
              >
                Show Answer
              </Button>
              <Button
                disabled={!showAnswerFlag && selectedOptions?.length == 0}
                onClick={() =>
                  handleNextQuestion(showAnswerFlag ? "skip" : "next")
                }
                // loading={submitLoader}
              >
                {showAnswerFlag ? "Next" : "Submit & Next"}
              </Button>

              {/* <Button onClick={() => handleNextQuestion("skip")}>
              Skip this question
            </Button> */}

              {currentQuestion?.show_calculator == true && (
                <Button onClick={handleShowCalculator}>Show Calculator</Button>
              )}

              <Button onClick={handleFinishTest}>Finish Test</Button>
            </div>
          </div>
        )}
      </Skeleton>

      <Modal
        title="Calculator"
        visible={showCalculator}
        onCancel={handleCloseCalculator}
        footer={null}
        width={800}
      >
        {/* This div acts as a placeholder for the calculator */}
        <div id="calculator-modal-content" />
      </Modal>
    </>
  );
}

export default PracticeTest;
