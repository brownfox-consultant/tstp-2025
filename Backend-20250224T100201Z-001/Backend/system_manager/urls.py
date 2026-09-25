from django.urls import include, path
from rest_framework.routers import DefaultRouter

from system_manager.views import DoubtCommentViewSet, DoubtViewSet, FacultyTimeSlotViewSet, IssueViewSet, ConcernViewSet, MeetingViewSet, SuggestionViewSet, \
    StudentFeedbackViewSet

router = DefaultRouter()
router.register(r'doubt', DoubtViewSet)
router.register(
    r'doubt-comments',
    DoubtCommentViewSet,
    basename='doubt-comments'
)
router.register(r'issue', IssueViewSet)
router.register(r'concern', ConcernViewSet)
router.register(r'meeting', MeetingViewSet)
router.register(r'suggestion', SuggestionViewSet)
router.register(r'feedback', StudentFeedbackViewSet)
router.register(r'faculty-slots', FacultyTimeSlotViewSet)
urlpatterns = [
    path('', include(router.urls)),
]
