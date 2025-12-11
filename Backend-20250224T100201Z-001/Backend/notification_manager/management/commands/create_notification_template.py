from django.core.management.base import BaseCommand

from notification_manager.models import Notification, NotificationTemplate, NotificationChannel


class Command(BaseCommand):
    help = "Create default notification templates"

    def add_arguments(self, parser):
        pass

    def handle(self, *args, **options):
        # Registration OTP notification
        registration_otp_notification = Notification.objects.update_or_create(
            name=Notification.REGISTRATION_OTP_NOTIFICATION,
            category=Notification.REGISTRATION)

        registration_otp_email_wildcards = [NotificationTemplate.USER_NAME, NotificationTemplate.OTP]
        registration_otp_notification_template = NotificationTemplate.objects.update_or_create(
            name='REGISTRATION_OTP_EMAIL',
            wildcards=registration_otp_email_wildcards,
            subject='STest: Verification OTP',
            description=f'Hi {NotificationTemplate.USER_NAME}, please use the verification code {NotificationTemplate.OTP} on the STest website. If you didn\'t request this, you can ignore this email or let us know. Thanks! STest team.')

        registration_otp_notification_channel = NotificationChannel.objects.update_or_create(
            channel_name=NotificationChannel.EMAIL, template_name='REGISTRATION_OTP_EMAIL',
            notification=registration_otp_notification[0])

        # Registration notification
        registration_notification = Notification.objects.update_or_create(name=Notification.REGISTRATION_NOTIFICATION,
                                                                          category=Notification.REGISTRATION)

        registration_email_wildcards = [NotificationTemplate.USER_NAME]
        registration_notification_template = NotificationTemplate.objects.update_or_create(name='REGISTRATION_EMAIL',
                                                                                           wildcards=registration_email_wildcards,
                                                                                           subject='Welcome to STest',
                                                                                           description=f'Hi {NotificationTemplate.USER_NAME}, thank you for registering in STest.')

        registration_notification_channel = NotificationChannel.objects.update_or_create(
            channel_name=NotificationChannel.EMAIL, template_name='REGISTRATION_EMAIL',
            notification=registration_notification[0])

        # Forgot password notification
        forgot_password_notification = Notification.objects.update_or_create(
            name=Notification.FORGOT_PASSWORD_NOTIFICATION, category=Notification.FORGOT_PASSWORD)

        forgot_password_wildcard = [NotificationTemplate.RESET_LINK]

        forgot_password_notification_template = NotificationTemplate.objects.update_or_create(
            name='FORGOT_PASSWORD_EMAIL',
            wildcards=forgot_password_wildcard,
            subject='STest - Password Reset',
            description=f'Click the link to reset your password: {NotificationTemplate.RESET_LINK}')

        forgot_password_notification_channel = NotificationChannel.objects.update_or_create(
            channel_name=NotificationChannel.EMAIL, template_name='FORGOT_PASSWORD_EMAIL',
            notification=forgot_password_notification[0])

        # New user reset password notification
        new_user_reset_password_notification = Notification.objects.update_or_create(
            name=Notification.NEW_USER_RESET_PASSWORD_NOTIFICATION, category=Notification.FORGOT_PASSWORD)

        new_user_reset_password_wildcard = [NotificationTemplate.USER_NAME, NotificationTemplate.RESET_LINK]

        new_user_reset_password_notification_template = NotificationTemplate.objects.update_or_create(
            name='NEW_USER_RESET_PASSWORD_EMAIL',
            wildcards=new_user_reset_password_wildcard,
            subject='STest - User Created Successfully',
            description=f'Hi {NotificationTemplate.USER_NAME}, thank you for registering in STest. Click the link to reset your password: {NotificationTemplate.RESET_LINK}')

        new_user_reset_password_channel = NotificationChannel.objects.update_or_create(
            channel_name=NotificationChannel.EMAIL, template_name='NEW_USER_RESET_PASSWORD_EMAIL',
            notification=new_user_reset_password_notification[0])

        # Test assigned notification
        test_assigned_notification = Notification.objects.update_or_create(name=Notification.TEST_ASSIGNED_NOTIFICATION,
                                                                           category=Notification.TEST)

        test_assigned_wildcard = [NotificationTemplate.USER_NAME]

        test_assigned_notification_template = NotificationTemplate.objects.update_or_create(
            name='TEST_ASSIGNED_NOTIFICATION_CENTER',
            wildcards=test_assigned_wildcard,
            subject='A new test has been assigned to you.',
            description=f'Hi {NotificationTemplate.USER_NAME}, a new test has been assigned to you.')

        test_assigned_channel = NotificationChannel.objects.update_or_create(
            channel_name=NotificationChannel.NOTIFICATION, template_name='TEST_ASSIGNED_NOTIFICATION_CENTER',
            notification=test_assigned_notification[0])

        # Concern raised notification
        concern_raised_notification = Notification.objects.update_or_create(
            name=Notification.CONCERN_RAISED_NOTIFICATION,
            category=Notification.CONCERN)

        concern_raised_wildcard = [NotificationTemplate.USER_NAME]

        concern_raised_notification_template = NotificationTemplate.objects.update_or_create(
            name='CONCERN_RAISED_NOTIFICATION_CENTER',
            wildcards=concern_raised_wildcard,
            subject='A concern has been raised.',
            description=f'A new concern has been raised by {NotificationTemplate.USER_NAME}. Please address it.')

        concern_raised_channel = NotificationChannel.objects.update_or_create(
            channel_name=NotificationChannel.NOTIFICATION, template_name='CONCERN_RAISED_NOTIFICATION_CENTER',
            notification=concern_raised_notification[0])

        # Meeting scheduled notification
        meeting_scheduled_notification = Notification.objects.update_or_create(
            name=Notification.MEETING_SCHEDULED_NOTIFICATION,
            category=Notification.MEETING)

        meeting_scheduled_wildcard = [NotificationTemplate.USER_NAME]

        meeting_scheduled_notification_template = NotificationTemplate.objects.update_or_create(
            name='MEETING_SCHEDULED_NOTIFICATION_CENTER',
            wildcards=meeting_scheduled_wildcard,
            subject='A meeting has been scheduled.',
            description=f'A new meeting has been scheduled by {NotificationTemplate.USER_NAME} for {NotificationTemplate.SCHEDULED_MEETING_TIME}')

        meeting_scheduled_channel = NotificationChannel.objects.update_or_create(
            channel_name=NotificationChannel.NOTIFICATION, template_name='MEETING_SCHEDULED_NOTIFICATION_CENTER',
            notification=meeting_scheduled_notification[0])

        # Issue raised notification
        issue_raised_notification = Notification.objects.update_or_create(
            name=Notification.ISSUE_RAISED_NOTIFICATION,
            category=Notification.ISSUE)

        issue_raised_wildcard = [NotificationTemplate.USER_NAME]

        issue_raised_notification_template = NotificationTemplate.objects.update_or_create(
            name='ISSUE_RAISED_NOTIFICATION_CENTER',
            wildcards=issue_raised_wildcard,
            subject='An issue has been raised.',
            description=f'A new issue has been raised by {NotificationTemplate.USER_NAME}. Please address it.')

        issue_raised_channel = NotificationChannel.objects.update_or_create(
            channel_name=NotificationChannel.NOTIFICATION, template_name='ISSUE_RAISED_NOTIFICATION_CENTER',
            notification=issue_raised_notification[0])

        # Suggestion raised notification
        suggestion_raised_notification = Notification.objects.update_or_create(
            name=Notification.SUGGESTION_RAISED_NOTIFICATION,
            category=Notification.SUGGESTION)

        suggestion_raised_wildcard = [NotificationTemplate.USER_NAME]

        suggestion_raised_notification_template = NotificationTemplate.objects.update_or_create(
            name='SUGGESTION_RAISED_NOTIFICATION_CENTER',
            wildcards=suggestion_raised_wildcard,
            subject='A suggestion has been raised.',
            description=f'A new suggestion has been raised by {NotificationTemplate.USER_NAME}.')

        suggestion_raised_channel = NotificationChannel.objects.update_or_create(
            channel_name=NotificationChannel.NOTIFICATION, template_name='SUGGESTION_RAISED_NOTIFICATION_CENTER',
            notification=suggestion_raised_notification[0])

        # Feedback provided notification
        feedback_notification = Notification.objects.update_or_create(
            name=Notification.FEEDBACK_PROVIDED_NOTIFICATION,
            category=Notification.FEEDBACK)

        feedback_wildcard = [NotificationTemplate.USER_NAME]

        feedback_notification_template = NotificationTemplate.objects.update_or_create(
            name='FEEDBACK_PROVIDED_NOTIFICATION_CENTER',
            wildcards=feedback_wildcard,
            subject='A feedback has been provided.',
            description=f'A new feedback has been provided by {NotificationTemplate.USER_NAME}.')

        feedback_channel = NotificationChannel.objects.update_or_create(
            channel_name=NotificationChannel.NOTIFICATION, template_name='FEEDBACK_PROVIDED_NOTIFICATION_CENTER',
            notification=feedback_notification[0])

        # Doubt raised notification
        doubt_raised_notification = Notification.objects.update_or_create(
            name=Notification.DOUBT_RAISED_NOTIFICATION,
            category=Notification.DOUBT)

        doubt_raised_wildcard = [NotificationTemplate.USER_NAME]

        doubt_raised_notification_template = NotificationTemplate.objects.update_or_create(
            name='DOUBT_RAISED_NOTIFICATION_CENTER',
            wildcards=doubt_raised_wildcard,
            subject='A doubt has been raised.',
            description=f'A new doubt has been raised by {NotificationTemplate.USER_NAME}. Please resolve it.')

        doubt_raised_channel = NotificationChannel.objects.update_or_create(
            channel_name=NotificationChannel.NOTIFICATION, template_name='DOUBT_RAISED_NOTIFICATION_CENTER',
            notification=doubt_raised_notification[0])
