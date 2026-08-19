"use client";

import React, { useEffect, useRef, useState } from "react";
import { CalculatorOutlined, CloseOutlined } from "@ant-design/icons";
import { Button } from "antd";
import Draggable from "react-draggable";

import FullScreenExitIcon from "../icons/fullscreen-exit";
import FullScreenIcon from "../icons/fullscreen";
import DragIndicatorIcon from "../icons/drag-indicator";

function CalculatorComponent({ showCalculator, setShowCalculator }) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isWide, setIsWide] = useState(false);

  // "graphing" or "scientific"
  const [calculatorType, setCalculatorType] = useState("graphing");

  const calculatorRef = useRef(null);

  // --------------------------------------------------
  // Load Desmos API
  // --------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.Desmos) {
      setIsScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src*="desmos.com/api"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        setIsScriptLoaded(true);
      });

      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://www.desmos.com/api/v1.8/calculator.js?apiKey=d991d6335bc1419badc443d7c8f2537a";

    script.async = true;

    script.onload = () => {
      setIsScriptLoaded(true);
    };

    script.onerror = () => {
      console.error("Failed to load Desmos API");
      setIsScriptLoaded(false);
    };

    document.body.appendChild(script);
  }, []);

  // --------------------------------------------------
  // Create calculator
  // --------------------------------------------------
  useEffect(() => {
    if (
      !showCalculator ||
      !isScriptLoaded ||
      !window.Desmos
    ) {
      return;
    }

    const modalContent = document.getElementById(
      "calculator-modal-content"
    );

    if (!modalContent) return;

    // Destroy previous calculator
    if (calculatorRef.current) {
      try {
        calculatorRef.current.destroy();
      } catch (error) {
        console.warn("Calculator destroy failed:", error);
      }

      calculatorRef.current = null;
    }

    // Clear previous calculator
    modalContent.innerHTML = "";

    const container = document.createElement("div");

    container.style.width = "100%";
    container.style.height = "500px";

    modalContent.appendChild(container);

    let calculator;

    try {
      if (calculatorType === "scientific") {
        // --------------------------------------------
        // Scientific Calculator
        // --------------------------------------------
        calculator = window.Desmos.ScientificCalculator(
          container,
          {
            keypad: true,
            settingsMenu: false,
            border: true,
          }
        );
      } else {
        // --------------------------------------------
        // Graphing Calculator
        // --------------------------------------------
        calculator = window.Desmos.GraphingCalculator(
          container,
          {
            expressions: true,
            keypad: true,
            settingsMenu: false,
            zoomButtons: true,
            border: true,
          }
        );

        // Restore graphing state
        const savedGraphingState = localStorage.getItem(
          "desmosGraphingCalculatorState"
        );

        if (savedGraphingState) {
          try {
            calculator.setState(
              JSON.parse(savedGraphingState)
            );
          } catch (error) {
            console.error(
              "Failed to restore graphing calculator state:",
              error
            );
          }
        }
      }

      calculatorRef.current = calculator;
    } catch (error) {
      console.error(
        `Failed to initialize ${calculatorType} calculator:`,
        error
      );
    }

    return () => {
      if (calculatorRef.current) {
        try {
          // Save graphing state before destroying
          if (calculatorType === "graphing") {
            const state = calculatorRef.current.getState();

            localStorage.setItem(
              "desmosGraphingCalculatorState",
              JSON.stringify(state)
            );
          }
        } catch (error) {
          console.warn(
            "Failed to save calculator state:",
            error
          );
        }

        try {
          calculatorRef.current.destroy();
        } catch (error) {
          console.warn(
            "Calculator cleanup failed:",
            error
          );
        }

        calculatorRef.current = null;
      }
    };
  }, [
    showCalculator,
    isScriptLoaded,
    calculatorType,
  ]);

  // --------------------------------------------------
  // Open / Close
  // --------------------------------------------------
  const toggleModal = () => {
    if (calculatorRef.current) {
      try {
        if (calculatorType === "graphing") {
          const state =
            calculatorRef.current.getState();

          localStorage.setItem(
            "desmosGraphingCalculatorState",
            JSON.stringify(state)
          );
        } else {
          const state =
            calculatorRef.current.getState();

          localStorage.setItem(
            "desmosScientificCalculatorState",
            JSON.stringify(state)
          );
        }
      } catch (error) {
        console.warn(
          "Failed to save calculator state:",
          error
        );
      }
    }

    setShowCalculator((prev) => !prev);
  };

  // --------------------------------------------------
  // Change calculator
  // --------------------------------------------------
  const changeCalculator = (type) => {
    if (type === calculatorType) return;

    // Save current calculator state
    if (calculatorRef.current) {
      try {
        const state =
          calculatorRef.current.getState();

        if (calculatorType === "graphing") {
          localStorage.setItem(
            "desmosGraphingCalculatorState",
            JSON.stringify(state)
          );
        } else {
          localStorage.setItem(
            "desmosScientificCalculatorState",
            JSON.stringify(state)
          );
        }
      } catch (error) {
        console.warn(
          "Failed to save calculator state:",
          error
        );
      }
    }

    setCalculatorType(type);
  };

  // --------------------------------------------------
  // Width
  // --------------------------------------------------
  const toggleWidth = () => {
    setIsWide((prev) => !prev);
  };

  return (
    <div>
      {/* Trigger Button */}
      <div
        onClick={toggleModal}
        className="flex flex-col gap-2 justify-center text-sm items-center cursor-pointer p-2 rounded hover:bg-black/5"
      >
        <CalculatorOutlined />
        Calculator
      </div>

      {/* Calculator Modal */}
      {showCalculator && (
        <Draggable handle=".drag-handle">
          <div
            className="fixed z-50 bg-white rounded-lg shadow-2xl border-4 border-blue-600"
            style={{
              width: isWide ? "50rem" : "30rem",
              top: "10%",
              left: "20%",
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-2 bg-blue-50 border-b border-blue-200">
              
              {/* Full Width */}
              <Button
                icon={
                  isWide ? (
                    <FullScreenExitIcon />
                  ) : (
                    <FullScreenIcon />
                  )
                }
                onClick={toggleWidth}
              />

              {/* Drag Handle */}
              <div className="drag-handle cursor-move px-6 py-1 hover:bg-gray-100 rounded">
                <DragIndicatorIcon />
              </div>

              {/* Close */}
              <Button
                icon={<CloseOutlined />}
                onClick={toggleModal}
              />
            </div>

            {/* Calculator Type Switch */}
            <div className="flex justify-center gap-2 py-3 border-b bg-white">
              <Button
                type={
                  calculatorType === "graphing"
                    ? "primary"
                    : "default"
                }
                onClick={() =>
                  changeCalculator("graphing")
                }
              >
                Graphing Calculator
              </Button>

              <Button
                type={
                  calculatorType === "scientific"
                    ? "primary"
                    : "default"
                }
                onClick={() =>
                  changeCalculator("scientific")
                }
              >
                Scientific Calculator
              </Button>
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-center py-2">
              {calculatorType === "graphing"
                ? "Graphing Calculator"
                : "Scientific Calculator"}
            </h1>

            {/* Calculator */}
            <div
              id="calculator-modal-content"
              style={{
                width: "100%",
                minHeight: "500px",
              }}
            />

            {/* Loading */}
            {!isScriptLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <span className="text-gray-500">
                  Loading calculator...
                </span>
              </div>
            )}
          </div>
        </Draggable>
      )}
    </div>
  );
}

export default CalculatorComponent;