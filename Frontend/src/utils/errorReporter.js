import { BASE_URL } from "@/app/constants/apiConstants";

export async function reportError(error, info = {}) {
  try {
    await fetch(`${BASE_URL}/api/log-frontend-error/`, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: error?.message || "Unknown Error",
        stack: error?.stack || "",
        url:
          typeof window !== "undefined"
            ? window.location.href
            : "",
        userAgent:
          typeof navigator !== "undefined"
            ? navigator.userAgent
            : "",
        timestamp: new Date().toISOString(),
        ...info,
      }),
    });
  } catch (e) {
    console.error("Error reporting failed", e);
  }
}