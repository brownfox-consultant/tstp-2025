"use client";

import { Button } from "antd";
import "mathlive";
import { useState, useRef, useEffect } from "react";
import { MathfieldElement } from "mathlive";

function MathliveComponent() {
  const [value, setValue] = useState("");
  const mf = useRef(null);
  const containerRef = useRef(null);
  // console.log("window.location.search", window.location.search);

  useEffect(() => {
    if (typeof window != "undefined")
      window.name = new URLSearchParams(window.location.search).get("editorId");
  }, []);

  useEffect(() => {
    const mathfield = new MathfieldElement({
      mathVirtualKeyboardPolicy: "sandboxed",
    });

    mathfield.addEventListener("focus", () => {
      mathfield.executeCommand("showVirtualKeyboard");
    });

    mathfield.className = "mathfield";

    mf.current = mathfield;
    containerRef.current.appendChild(mathfield);

    mathfield.smartFence = true;

    return () => {
      if (mf.current) {
        mf.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (mf.current) {
      mf.current.value = value;
    }
  }, [value]);

  // console.log("window.name", window.name);

  function handleSend() {
    const mathMLValue = mf.current.getValue("math-ml");
    if (window.parent) {
      window.parent.postMessage(
        { type: "math-ml", value: mathMLValue, editorId: window.name },
        window.location.origin
      );
    }
  }

  return (
    <>
      <div
        style={{ width: "25rem", backgroundColor: "whitesmoke" }}
        ref={containerRef}
      ></div>
      <Button onClick={handleSend}>Add Formula to Editor</Button>
    </>
  );
}

export default MathliveComponent;
