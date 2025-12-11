from django.db import models

from user_manager.models import User


class Notification(models.Model):
    REGISTRATION_OTP_NOTIFICATION = "REGISTRATION_OTP_NOTIFICATION"
    REGISTRATION_NOTIFICATION = "REGISTRATION_NOTIFICATION"
    FORGOT_PASSWORD_NOTIFICATION = "FORGOT_PASSWORD_NOTIFICATION"
    NEW_USER_RESET_PASSWORD_NOTIFICATION = "NEW_USER_RESET_PASSWORD_NOTIFICATION"
    TEST_ASSIGNED_NOTIFICATION = "TEST_ASSIGNED_NOTIFICATION"
    CONCERN_RAISED_NOTIFICATION = "CONCERN_RAISED_NOTIFICATION"
    MEETING_SCHEDULED_NOTIFICATION = "MEETING_SCHEDULED_NOTIFICATION"
    ISSUE_RAISED_NOTIFICATION = "ISSUE_RAISED_NOTIFICATION"
    SUGGESTION_RAISED_NOTIFICATION = "SUGGESTION_RAISED_NOTIFICATION"
    FEEDBACK_PROVIDED_NOTIFICATION = "FEEDBACK_PROVIDED_NOTIFICATION"
    DOUBT_RAISED_NOTIFICATION = "DOUBT_RAISED_NOTIFICATION"
    NOTIFICATION_NAME = [
        (REGISTRATION_OTP_NOTIFICATION, 'Registration OTP Notification'),
        (REGISTRATION_NOTIFICATION, 'Registration Notification'),
        (FORGOT_PASSWORD_NOTIFICATION, 'Forgot Password Notification'),
        (NEW_USER_RESET_PASSWORD_NOTIFICATION, 'New User Reset Password Notification'),
        (CONCERN_RAISED_NOTIFICATION, 'Concern Raised Notification'),
        (MEETING_SCHEDULED_NOTIFICATION, 'Meeting Scheduled Notification'),
        (ISSUE_RAISED_NOTIFICATION, 'Issue Raised Notification'),
        (SUGGESTION_RAISED_NOTIFICATION, 'Suggestion Raised Notification'),
        (FEEDBACK_PROVIDED_NOTIFICATION, 'Feedback Provided Notification'),
        (DOUBT_RAISED_NOTIFICATION, 'Doubt Raised Notification'),
    ]
    name = models.CharField(max_length=50, null=False, choices=NOTIFICATION_NAME, unique=True)

    REGISTRATION = "REGISTRATION"
    TEST = "TEST"
    FORGOT_PASSWORD = "FORGOT_PASSWORD"
    CONCERN = "CONCERN"
    MEETING = "MEETING"
    ISSUE = "ISSUE"
    SUGGESTION = "SUGGESTION"
    FEEDBACK = "FEEDBACK"
    DOUBT = "DOUBT"
    ASSIGNMENT = "ASSIGNMENT"

    CATEGORY_CHOICES = [
        (REGISTRATION, 'Registration'),
        (CONCERN, 'Concern'),
        (MEETING, 'Meeting'),
        (ISSUE, 'Issue'),
        (SUGGESTION, 'Suggestion'),
        (DOUBT, 'Doubt'),
        (ASSIGNMENT, 'Assignment'),
        (FEEDBACK, 'Feedback'),
        (TEST, 'Test'),
        (FORGOT_PASSWORD, 'Forgot Password'),
    ]
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default=TEST)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class NotificationTemplate(models.Model):
    USER_NAME = '%USER_NAME%'
    OTP = '%OTP%'
    RESET_LINK = '%RESET_LINK%'
    SCHEDULED_MEETING_TIME = '%SCHEDULED_MEETING_TIME%'
    REFERENCE_ID = '%REFERENCE_ID%'
    TEST_NAME = '%TEST_NAME%'

    name = models.CharField(max_length=50, null=False, unique=True)
    wildcards = models.JSONField(default=list)
    subject = models.CharField(max_length=50, null=False)
    description = models.TextField(null=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class NotificationChannel(models.Model):
    EMAIL = "EMAIL"
    NOTIFICATION = "NOTIFICATION"
    CHANNEL_NAME_CHOICE = [
        (EMAIL, 'Email'),
        (NOTIFICATION, 'Notification'),
        
    ]
    channel_name = models.CharField(max_length=30, choices=CHANNEL_NAME_CHOICE, default=NOTIFICATION)
    template_name = models.CharField(max_length=50, null=False)
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['channel_name', 'template_name']

    def __str__(self):
        return self.channel_name + " " + self.template_name


class UserNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    READ = 'READ'
    UNREAD = 'UNREAD'
    STATUS_CHOICES = [
        (READ, 'Read'),
        (UNREAD, 'Unread')
    ]
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=UNREAD)
    subject = models.CharField(max_length=50, null=False)
    description = models.TextField(null=False)
    category = models.CharField(max_length=30, choices=Notification.CATEGORY_CHOICES, default=Notification.TEST)
    reference_id = models.BigIntegerField(null=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
