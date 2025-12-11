"use client";

import React, { useEffect, useState } from "react";

function NewStopwatch({ onTimeUp }) {
  const [timeTaken, setTimeTaken] = useState(0);

  useEffect(() => {
    setTimeTaken(Number(window.sessionStorage.getItem("timeTaken")));
  }, []);

  useEffect(() => {
    let timeLimit = window.sessionStorage.getItem("timer");
    console.log("timeTaken tl", timeTaken, timeLimit);
    if (timeLimit == "null" || timeLimit == null) {
      let timer = setTimeout(() => {
        setTimeTaken(timeTaken + 1);
        window.sessionStorage.setItem("timeTaken", timeTaken + 1);
      }, [1000]);
      return () => clearTimeout(timer);
    } else {
      if (timeTaken < timeLimit) {
        let timer = setTimeout(() => {
          setTimeTaken(timeTaken + 1);
          window.sessionStorage.setItem("timeTaken", timeTaken + 1);
        }, [1000]);
        return () => clearTimeout(timer);
      } else {
        onTimeUp();
      }
    }
  }, [timeTaken]);

  return (
    <div className="text-2xl ">
      Time Taken:{" "}
      <span className="font-mono">
        {new Date(Number(timeTaken) * 1000).toISOString().substring(11, 19)}
      </span>
    </div>
  );
}

export default NewStopwatch;
