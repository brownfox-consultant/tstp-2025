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

    Reminder:
    - Finds PAID subscriptions expiring 5 days from today.
    - If more than 2 students match, sends notification/email to ALL
      matching students and sends one admin summary email.
    - If 2 or fewer match, no reminder email/notification is sent.

    Expiry:
    - Finds PAID subscriptions already expired.
    - Always changes expired subscriptions from PAID -> FREE.
    - If more than 2 students are expired, sends notification/email to ALL
      expired students and sends one admin summary email.
    - If 2 or fewer are expired, no expiry email/notification is sent.
    """

    print("=" * 80)
    print("CHECK SUBSCRIPTIONS TASK STARTED")
    print("=" * 80)

    today = timezone.now().date()
    reminder_date = today + timedelta(days=5)

    reminder_admin_summary = []
    expired_admin_summary = []

    print("Today:", today)
    print("Reminder Date:", reminder_date)

    # =====================================================
    # 1️⃣ REMINDER BEFORE EXPIRY
    # =====================================================

    reminder_enrollments = CourseEnrollment.objects.filter(
        subscription_type=CourseEnrollment.PAID,
        subscription_end_date=reminder_date
    )

    reminder_count = reminder_enrollments.count()

    print("-" * 80)
    print("REMINDER CHECK")
    print("Reminder enrollments count:", reminder_count)
    print("Reminder threshold: > 2")

    if reminder_count > 2:

        print("Reminder count is greater than 2.")
        print("Sending reminder notifications/emails to ALL matching students.")

        for enrollment in reminder_enrollments:

            print("-" * 60)
            print("Reminder Enrollment ID:", enrollment.id)
            print(
                "Student:",
                enrollment.student.name,
                enrollment.student.id
            )
            print("Course:", enrollment.course.name)
            print(
                "Expiry:",
                enrollment.subscription_end_date.strftime("%d-%m-%Y")
            )

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
                    "%EXPIRY_DATE%": enrollment.subscription_end_date.strftime(
                        "%d-%m-%Y"
                    ),
                    "%REFERENCE_ID%": enrollment.id,
                },
                user_id=enrollment.student.id
            )

            reminder_admin_summary.append({
                "student": enrollment.student.name,
                "email": enrollment.student.email,
                "course": enrollment.course.name,
                "expiry": enrollment.subscription_end_date.strftime(
                    "%d-%m-%Y"
                ),
            })

            print("Reminder task queued successfully.")

            cache.set(
                cache_key,
                True,
                timeout=7 * 24 * 60 * 60
            )

        # =================================================
        # SEND ONE ADMIN SUMMARY EMAIL
        # =================================================

        if reminder_admin_summary:

            print("-" * 60)
            print("Sending Reminder Summary Email")
            print(
                "Summary students:",
                len(reminder_admin_summary)
            )

            send_subscription_summary_email.delay(
                reminder_admin_summary,
                "Reminder"
            )

            print("Reminder summary email queued successfully.")

    else:

        print(
            "Reminder count is 2 or less."
            " No reminder emails/notifications will be sent."
        )

    # =====================================================
    # 2️⃣ EXPIRE PAID → FREE
    # =====================================================

    expired_enrollments = CourseEnrollment.objects.filter(
        subscription_type=CourseEnrollment.PAID,
        subscription_end_date__lt=today
    )

    expired_count = expired_enrollments.count()

    print("-" * 80)
    print("EXPIRY CHECK")
    print("Expired enrollments count:", expired_count)
    print("Expiry email threshold: > 2")

    # =====================================================
    # IMPORTANT:
    # Expired subscriptions should ALWAYS become FREE.
    # Email/notification depends on count > 2.
    # =====================================================

    if expired_count > 2:

        print("Expired count is greater than 2.")
        print("Sending expiry notifications/emails to ALL expired students.")

        for enrollment in expired_enrollments:

            print("-" * 60)
            print("Expired Enrollment ID:", enrollment.id)
            print(
                "Student:",
                enrollment.student.name,
                enrollment.student.id
            )
            print("Course:", enrollment.course.name)
            print(
                "Expiry:",
                enrollment.subscription_end_date.strftime("%d-%m-%Y")
            )

            cache_key = f"subscription_expired_sent_{enrollment.id}"

            print("Cache Key:", cache_key)

            # -------------------------------------------------
            # Always change PAID → FREE
            # -------------------------------------------------

            print("Updating subscription to FREE")

            enrollment.subscription_type = CourseEnrollment.FREE
            enrollment.save(
                update_fields=["subscription_type"]
            )

            # -------------------------------------------------
            # Check whether notification was already sent
            # -------------------------------------------------

            if cache.get(cache_key):
                print(
                    "Expiry notification already sent. "
                    "Skipping notification."
                )
                continue

            print("Calling send_notification() for EXPIRED")

            send_notification.delay(
                notification_name="SUBSCRIPTION_EXPIRED_NOTIFICATION",
                params={
                    "%USER_NAME%": enrollment.student.name,
                    "%COURSE_NAME%": enrollment.course.name,
                    "%EXPIRY_DATE%": enrollment.subscription_end_date.strftime(
                        "%d-%m-%Y"
                    ),
                    "%REFERENCE_ID%": enrollment.id,
                },
                user_id=enrollment.student.id
            )

            expired_admin_summary.append({
                "student": enrollment.student.name,
                "email": enrollment.student.email,
                "course": enrollment.course.name,
                "expiry": enrollment.subscription_end_date.strftime(
                    "%d-%m-%Y"
                ),
            })

            print("Expired notification task queued successfully.")

            cache.set(
                cache_key,
                True,
                timeout=30 * 24 * 60 * 60
            )

        # =================================================
        # SEND ONE ADMIN SUMMARY EMAIL
        # =================================================

        if expired_admin_summary:

            print("-" * 60)
            print("Sending Expired Summary Email")
            print(
                "Summary students:",
                len(expired_admin_summary)
            )

            send_subscription_summary_email.delay(
                expired_admin_summary,
                "Expired"
            )

            print("Expired summary email queued successfully.")

    else:

        print(
            "Expired count is 2 or less."
            " No expiry emails/notifications will be sent."
        )

        # -------------------------------------------------
        # Still update expired subscriptions to FREE
        # -------------------------------------------------

        for enrollment in expired_enrollments:

            print("-" * 60)
            print(
                "Updating expired enrollment to FREE:",
                enrollment.id
            )

            enrollment.subscription_type = CourseEnrollment.FREE
            enrollment.save(
                update_fields=["subscription_type"]
            )

            print(
                "Enrollment",
                enrollment.id,
                "updated to FREE."
            )

    # =====================================================
    # FINISHED
    # =====================================================

    print("=" * 80)
    print("CHECK SUBSCRIPTIONS TASK FINISHED")
    print("=" * 80)

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
