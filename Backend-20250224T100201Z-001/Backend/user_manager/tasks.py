from django.utils import timezone

from course_manager.models import CourseEnrollment
from sTest.celery import app
from test_manager.models import TestSubmission


from datetime import timedelta
import logging

from celery import shared_task
from django.utils import timezone
from django.core.cache import cache

from course_manager.models import CourseEnrollment
from notification_manager.utils import send_notification

logger = logging.getLogger("subscription_tasks")


@shared_task
def check_and_update_subscriptions():
    """
    Runs daily via Celery Beat.
    - Sends reminder 3 days before expiry
    - Expires PAID subscriptions
    - Sends email + in-app notification
    """

    today = timezone.now().date()

    # =====================================================
    # 1️⃣ REMINDER BEFORE EXPIRY (3 DAYS)
    # =====================================================
    reminder_date = today + timedelta(days=3)

    reminder_enrollments = CourseEnrollment.objects.filter(
        subscription_type=CourseEnrollment.PAID,
        subscription_end_date=reminder_date
    )

    for enrollment in reminder_enrollments:
        cache_key = f"subscription_reminder_sent_{enrollment.id}"

        if cache.get(cache_key):
            continue

        logger.info(f"Sending subscription reminder for enrollment {enrollment.id}")

        send_notification.delay(
            notification_name="SUBSCRIPTION_REMINDER_NOTIFICATION",
            params={
                "%USER_NAME%": enrollment.student.name,
                "%COURSE_NAME%": enrollment.course.name,
                "%EXPIRY_DATE%": enrollment.subscription_end_date,
                "%REFERENCE_ID%": enrollment.id,
            },
            user_id=enrollment.student.id
        )

        # prevent duplicate reminders for 7 days
        cache.set(cache_key, True, timeout=7 * 24 * 60 * 60)

    # =====================================================
    # 2️⃣ EXPIRE PAID → FREE
    # =====================================================
    expired_enrollments = CourseEnrollment.objects.filter(
        subscription_type=CourseEnrollment.PAID,
        subscription_end_date__lt=today
    )

    for enrollment in expired_enrollments:
        cache_key = f"subscription_expired_sent_{enrollment.id}"

        if cache.get(cache_key):
            continue

        logger.info(f"Expiring subscription for enrollment {enrollment.id}")

        # downgrade subscription
        enrollment.subscription_type = CourseEnrollment.FREE
        enrollment.save(update_fields=["subscription_type"])

        # send notification
        send_notification.delay(
            notification_name="SUBSCRIPTION_EXPIRED_NOTIFICATION",
            params={
                "%USER_NAME%": enrollment.student.name,
                "%COURSE_NAME%": enrollment.course.name,
                "%EXPIRY_DATE%": enrollment.subscription_end_date,
                "%REFERENCE_ID%": enrollment.id,
            },
            user_id=enrollment.student.id
        )

        # prevent duplicate expiry notifications (30 days)
        cache.set(cache_key, True, timeout=30 * 24 * 60 * 60)


@app.task
def update_expired_test_submissions():
    now = timezone.now()
    expired_submissions = TestSubmission.objects.filter(
        expiration_date__lt=now,
        status__in=[TestSubmission.YET_TO_START, TestSubmission.IN_PROGRESS]
    )

    for submission in expired_submissions:
        submission.status = TestSubmission.EXPIRED
        submission.save()
