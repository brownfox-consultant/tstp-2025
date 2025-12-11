from django.urls import include, path
from rest_framework.routers import DefaultRouter

from system_manager.views import DoubtViewSet, IssueViewSet, ConcernViewSet, MeetingViewSet, SuggestionViewSet, \
    StudentFeedbackViewSet

router = DefaultRouter()
router.register(r'doubt', DoubtViewSet)
router.register(r'issue', IssueViewSet)
router.register(r'concern', ConcernViewSet)
router.register(r'meeting', MeetingViewSet)
router.register(r'suggestion', SuggestionViewSet)
router.register(r'feedback', StudentFeedbackViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
