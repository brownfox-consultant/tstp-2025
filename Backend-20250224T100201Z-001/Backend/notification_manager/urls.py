from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import UserNotificationViewSet

router = DefaultRouter()
router.register(r'notification', UserNotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
