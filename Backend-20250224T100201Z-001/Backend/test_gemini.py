
import os
import json
import time
import urllib.request
import urllib.error

api_key = os.environ.get("GEMINI_API_KEY")

# Interaction ID from your successful HTTP 200 response
interaction_id = input("Paste your interaction ID: ").strip()

url = (
    "https://generativelanguage.googleapis.com/v1beta/interactions/"
    + interaction_id
)

headers = {
    "x-goog-api-key": api_key,
    "Api-Revision": "2026-05-20",
}

for attempt in range(24):
    request = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            result = json.loads(response.read().decode("utf-8"))

        status = result.get("status")
        print("Status:", status)

        if status == "completed":
            output_text = result.get("output_text")

            if output_text:
                print("Generated response:", output_text)
            else:
                for step in result.get("steps", []):
                    if step.get("type") == "model_output":
                        for part in step.get("content", []):
                            if part.get("type") == "text":
                                print(part.get("text", ""))

            break

        if status in ("failed", "cancelled", "incomplete"):
            print(json.dumps(result, indent=2)[:3000])
            break

        time.sleep(5)

    except urllib.error.HTTPError as exc:
        print("HTTP:", exc.code)
        print(exc.read().decode("utf-8")[:1500])
        break

    except Exception as exc:
        print("Request error:", repr(exc))
        break
else:
    print("Still running after 2 minutes. Try polling again later.")
