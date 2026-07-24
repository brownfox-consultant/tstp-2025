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
from notification_manager.tasks import send_subscription_summary_email

logger = logging.getLogger("subscription_tasks")


@shared_task
def check_and_update_subscriptions():
    """
    Runs daily via Celery Beat.
    - Sends reminder 3 days before expiry
    - Expires PAID subscriptions
    - Sends email + in-app notification
    """

    print("=" * 80)
    print("CHECK SUBSCRIPTIONS TASK STARTED")
    print("=" * 80)

    today = timezone.now().date()
    reminder_date = today + timedelta(days=3)
    reminder_admin_summary = []
    expired_admin_summary = []

    print("Today:", today)
    print("Reminder Date:", reminder_date)

    # =====================================================
    # 1️⃣ REMINDER BEFORE EXPIRY (3 DAYS)
    # =====================================================
    reminder_enrollments = CourseEnrollment.objects.filter(
        subscription_type=CourseEnrollment.PAID,
        subscription_end_date=reminder_date
    )

    print("Reminder enrollments count:", reminder_enrollments.count())

    for enrollment in reminder_enrollments:
        print("-" * 60)
        print("Reminder Enrollment ID:", enrollment.id)
        print("Student:", enrollment.student.name, enrollment.student.id)
        print("Course:", enrollment.course.name)
        print("Expiry:", enrollment.subscription_end_date)

        cache_key = f"subscription_reminder_sent_{enrollment.id}"
        print("Cache Key:", cache_key)

        if cache.get(cache_key):
            print("Reminder already sent. Skipping.")
            continue

        print("Calling send_notification() for REMINDER")

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
        reminder_admin_summary.append({
            "student": enrollment.student.name,
            "email": enrollment.student.email,
            "course": enrollment.course.name,
            "expiry": enrollment.subscription_end_date,
        })

        print("Reminder task queued successfully.")

        cache.set(cache_key, True, timeout=7 * 24 * 60 * 60)

    # =====================================================
    # 2️⃣ EXPIRE PAID → FREE
    # =====================================================
    expired_enrollments = CourseEnrollment.objects.filter(
        subscription_type=CourseEnrollment.PAID,
        subscription_end_date__lt=today
    )

    print("Expired enrollments count:", expired_enrollments.count())

    for enrollment in expired_enrollments:
        print("-" * 60)
        print("Expired Enrollment ID:", enrollment.id)
        print("Student:", enrollment.student.name, enrollment.student.id)
        print("Course:", enrollment.course.name)
        print("Expiry:", enrollment.subscription_end_date)

        cache_key = f"subscription_expired_sent_{enrollment.id}"
        print("Cache Key:", cache_key)

        if cache.get(cache_key):
            print("Expiry notification already sent. Skipping.")
            continue

        print("Updating subscription to FREE")

        enrollment.subscription_type = CourseEnrollment.FREE
        enrollment.save(update_fields=["subscription_type"])

        print("Calling send_notification() for EXPIRED")

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
        expired_admin_summary.append({
            "student": enrollment.student.name,
            "email": enrollment.student.email,
            "course": enrollment.course.name,
            "expiry": enrollment.subscription_end_date,
        })

        print("Expired notification task queued successfully.")

        cache.set(cache_key, True, timeout=30 * 24 * 60 * 60)

    print("=" * 80)
    print("CHECK SUBSCRIPTIONS TASK FINISHED")
    print("=" * 80)
    if reminder_admin_summary:
        send_subscription_summary_email.delay(
            reminder_admin_summary,
            "Reminder"
        )

    if expired_admin_summary:
        send_subscription_summary_email.delay(
            expired_admin_summary,
            "Expired"
        )


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
