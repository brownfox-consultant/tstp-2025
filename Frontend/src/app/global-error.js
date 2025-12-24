"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log error for debugging
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html>
      <body style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h2>Something went wrong!</h2>
        <p style={{ color: "red", marginBottom: "10px" }}>
          {error?.message || "Unknown error"}
        </p>
        <pre style={{ background: "#f0f0f0", padding: "10px", fontSize: "12px", overflow: "auto" }}>
          {error?.stack || "No stack trace available"}
        </pre>
        <button 
          onClick={() => reset()}
          style={{ marginTop: "10px", padding: "8px 16px", cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
