import logging
from datetime import datetime, timedelta

from rest_framework import viewsets
from rest_framework.decorators import action, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from user_manager.models import User
from notification_manager.models import UserNotification
from notification_manager.serializers import UserNotificationSerializer
from notification_manager.utils import ROLE_CATEGORY_MAPPING
from sTest.utils import get_error_response
from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response

from system_manager.models import Doubt, Issue, Concern, Meeting, Suggestion


class UserNotificationViewSet(viewsets.ModelViewSet):
    queryset = UserNotification.objects.all()
    logger = logging.getLogger('Notification')

   

    @permission_classes([IsAuthenticated])
    def list(self, request):
        user = request.user
        notifications = UserNotification.objects.filter(user=user).order_by('-created_at')
        category_wise_notifications = {}

        for notification in notifications:
            category = notification.category
            if category not in category_wise_notifications:
                category_wise_notifications[category] = {
                    'notifications': [],
                    'unread_count': 0
                }
            category_wise_notifications[category]['notifications'].append(
                UserNotificationSerializer(notification).data
            )
            if notification.status == UserNotification.UNREAD:
                category_wise_notifications[category]['unread_count'] += 1

        return Response(category_wise_notifications)

    @action(detail=False, methods=['get'], url_path='unread')
    def unread_count_by_category(self, request):

        filter_param = request.query_params.get("filter")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        doubt_qs = Doubt.objects.filter(status=Doubt.RAISED)
        issue_qs = Issue.objects.filter(status=Issue.RAISED)
        concern_qs = Concern.objects.filter(status=Concern.RAISED)
        meeting_qs = Meeting.objects.filter(status=Meeting.SCHEDULED)
        suggestion_qs = Suggestion.objects.filter(status=Suggestion.IN_REVIEW)

        now = timezone.now()

        # -------- Filter Logic --------
        if filter_param == "today":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)

            doubt_qs = doubt_qs.filter(created_at__gte=start)
            issue_qs = issue_qs.filter(created_at__gte=start)
            concern_qs = concern_qs.filter(created_at__gte=start)
            meeting_qs = meeting_qs.filter(created_at__gte=start)
            suggestion_qs = suggestion_qs.filter(created_at__gte=start)

        elif filter_param == "last_week":
            start = now - timedelta(days=7)

            doubt_qs = doubt_qs.filter(created_at__gte=start)
            issue_qs = issue_qs.filter(created_at__gte=start)
            concern_qs = concern_qs.filter(created_at__gte=start)
            meeting_qs = meeting_qs.filter(created_at__gte=start)
            suggestion_qs = suggestion_qs.filter(created_at__gte=start)

        elif filter_param == "last_month":
            start = now - timedelta(days=30)

            doubt_qs = doubt_qs.filter(created_at__gte=start)
            issue_qs = issue_qs.filter(created_at__gte=start)
            concern_qs = concern_qs.filter(created_at__gte=start)
            meeting_qs = meeting_qs.filter(created_at__gte=start)
            suggestion_qs = suggestion_qs.filter(created_at__gte=start)

        elif start_date and end_date:
            try:
                start = datetime.strptime(start_date, "%Y-%m-%d")
                end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)

                doubt_qs = doubt_qs.filter(created_at__range=(start, end))
                issue_qs = issue_qs.filter(created_at__range=(start, end))
                concern_qs = concern_qs.filter(created_at__range=(start, end))
                meeting_qs = meeting_qs.filter(created_at__range=(start, end))
                suggestion_qs = suggestion_qs.filter(created_at__range=(start, end))

            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

        # -------- Response --------
        data = {
            "DOUBT": {"unread_count": doubt_qs.count()},
            "ISSUE": {"unread_count": issue_qs.count()},
            "CONCERN": {"unread_count": concern_qs.count()},
            "MEETING": {"unread_count": meeting_qs.count()},
            "SUGGESTION": {"unread_count": suggestion_qs.count()},
        }

        return Response(data)

    @action(detail=False, methods=['get'], url_path='category')
    def category_notifications(self, request):
        user = request.user
        category = request.query_params.get('category')
        if not category:
            return get_error_response('Category parameter is required.')

        notifications = UserNotification.objects.filter(
            user=user,
            category=category
        ).order_by('-created_at')
        serializer = UserNotificationSerializer(notifications, many=True)
        return Response(serializer.data)
