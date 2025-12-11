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
        user = request.user
        user_role = user.role.name
        filter_param = request.query_params.get('filter')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        relevant_categories = ROLE_CATEGORY_MAPPING.get(user_role, [])
        category_details = {
            category: {'unread_count': 0, 'latest_notifications': []}
            for category in relevant_categories
        }

        unread_notifications = UserNotification.objects.filter(
            user=user,
            status=UserNotification.UNREAD,
            category__in=relevant_categories
        )

        now = datetime.now()
        if filter_param == 'today':
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            unread_notifications = unread_notifications.filter(created_at__gte=start)
        elif filter_param == 'last_week':
            start = now - timedelta(days=7)
            unread_notifications = unread_notifications.filter(created_at__gte=start)
        elif filter_param == 'last_month':
            start = now - timedelta(days=30)
            unread_notifications = unread_notifications.filter(created_at__gte=start)
        elif start_date and end_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d')
                end = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
                unread_notifications = unread_notifications.filter(created_at__range=(start, end))
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

        unread_notifications = unread_notifications.order_by('-created_at')

        for notification in unread_notifications:
            category = notification.category
            category_details[category]['unread_count'] += 1
            if len(category_details[category]['latest_notifications']) < 3:
                category_details[category]['latest_notifications'].append(
                    UserNotificationSerializer(notification).data
                )

        return Response(category_details)

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
