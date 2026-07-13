from django.urls import path
from .views import log_frontend_error

urlpatterns = [
    path(
        "log-frontend-error/",
        log_frontend_error,
        name="log_frontend_error",
    ),
]