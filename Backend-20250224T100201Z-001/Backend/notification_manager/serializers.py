from rest_framework import serializers
from .models import UserNotification


class UserNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotification
        fields = ['id', 'subject', 'description', 'category', 'status', 'reference_id', 'created_at']
