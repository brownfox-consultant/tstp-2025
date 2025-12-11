from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import TestViewSet, ResultViewSet, PracticeTestViewSet, TestFeedbackViewSet

router = DefaultRouter()
router.register(r'test', TestViewSet)
router.register(r'result', ResultViewSet)
router.register(r'practice', PracticeTestViewSet)
router.register(r'test-feedback', TestFeedbackViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
