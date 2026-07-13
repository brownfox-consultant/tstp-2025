import json
import logging

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django_ratelimit.decorators import ratelimit

frontend_logger = logging.getLogger("frontend_errors")


@csrf_exempt
@require_POST
@ratelimit(key="ip", rate="10/m", block=True)
def log_frontend_error(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    frontend_logger.error(json.dumps({
        "message": data.get("message"),
        "stack": data.get("stack"),
        "componentStack": data.get("componentStack"),
        "url": data.get("url"),
        "userAgent": data.get("userAgent"),
        "ip": request.META.get("REMOTE_ADDR"),
        "browser": request.META.get("HTTP_USER_AGENT"),
    }))

    return JsonResponse({"status": "logged"}, status=200)