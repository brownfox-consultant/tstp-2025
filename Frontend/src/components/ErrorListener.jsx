"use client";

import { useEffect } from "react";
import { reportError } from "@/utils/errorReporter";

export default function ErrorListener() {
  useEffect(() => {
    const handleError = (e) => {
      reportError(e.error || new Error(e.message));
    };

    const handlePromise = (e) => {
      reportError(
        new Error(
          e.reason?.message || String(e.reason || "Unhandled Promise Rejection")
        )
      );
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handlePromise);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handlePromise);
    };
  }, []);

  return null;
}