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
  const calculatorRef = useRef(null);

  // Load Desmos Script
  useEffect(() => {
    if (!window.Desmos) {
      const script = document.createElement("script");
      script.src =
        "https://www.desmos.com/api/v1.8/calculator.js?apiKey=d991d6335bc1419badc443d7c8f2537a";
      script.async = true;
      script.onload = () => setIsScriptLoaded(true);
      script.onerror = () => setIsScriptLoaded(false);
      document.body.appendChild(script);
    } else {
      setIsScriptLoaded(true);
    }
  }, []);

  // Create Calculator
  useEffect(() => {
    if (showCalculator && isScriptLoaded) {
      const modalContent = document.getElementById("calculator-modal-content");
      if (modalContent) {
        modalContent.innerHTML = "";
        const container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "500px";
        modalContent.appendChild(container);

        const calculator = window.Desmos.GraphingCalculator(container, {
          expressions: true,
          keypad: true, // ✅ enable scientific keypad
          settingsMenu: false,
          zoomButtons: true,
          border: true,
        });

        // Load saved state
        const savedState = localStorage.getItem("desmosCalculatorState");
        if (savedState) {
          try {
            calculator.setState(JSON.parse(savedState));
          } catch (error) {
            console.error("Failed to load calculator state:", error);
          }
        }

        calculatorRef.current = calculator;
      }
    }
  }, [showCalculator, isScriptLoaded]);

  // Save state on close
  const toggleModal = () => {
    if (calculatorRef.current) {
      const state = calculatorRef.current.getState();
      localStorage.setItem("desmosCalculatorState", JSON.stringify(state));
    }
    setShowCalculator(!showCalculator);
  };

  const toggleWidth = () => {
    setIsWide(!isWide);
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
              <Button
                icon={isWide ? <FullScreenExitIcon /> : <FullScreenIcon />}
                onClick={toggleWidth}
              />
              <div className="drag-handle cursor-move px-6 py-1 hover:bg-gray-100 rounded">
                <DragIndicatorIcon />
              </div>
              <Button icon={<CloseOutlined />} onClick={toggleModal} />
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-center mb-2">Calculator</h1>

            {/* Calculator Body */}
            <div id="calculator-modal-content" style={{ minHeight: "500px" }} />
          </div>
        </Draggable>
      )}
    </div>
  );
}

export default CalculatorComponent;
