from django.test import TestCase

# Create your tests here.
from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

from test_manager.models import TestSubmission
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from test_manager.models import TestSubmission
from user_manager.models import User
from test_manager.serializers import RecentFullLengthResultSerializer
from django.utils import timezone
from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from datetime import timedelta

from user_manager.models import User
from test_manager.models import TestSubmission
from test_manager.serializers import RecentFullLengthResultSerializer



@shared_task
def send_weekly_test_summary():

    end_date = timezone.now()
    start_date = end_date - timedelta(days=7)

    tests = (
        TestSubmission.objects.filter(
            status=TestSubmission.COMPLETED,
            completion_date__range=(start_date, end_date)
        )
        .select_related("student", "test", "result")
        .order_by("-completion_date")
    )

    total_tests = tests.count()
    unique_students = tests.values("student").distinct().count()

    admin_emails = list(
        User.objects.filter(
            role__name="admin",
            is_active=True
        ).values_list("email", flat=True)
    )

    if not admin_emails:
        return

    total_scores = []
    report = []

    for submission in tests:

        serializer = RecentFullLengthResultSerializer(submission)
        data = serializer.data

        score = data["total_score"]
        total_scores.append(score)

        report.append(
            f"""
==================================================
Student Name : {submission.student.name}
Email        : {submission.student.email}

Test Name    : {submission.test.name}
Course       : {submission.test.course.name}
Completed On : {timezone.localtime(submission.completion_date):%d-%m-%Y %I:%M %p}

Total Score  : {data['total_score']} / 1600
Math Score   : {data['math_score']}
English Score: {data['english_score']}
Percentage   : {data['percentage']} %

==================================================
"""
        )

    highest_score = max(total_scores) if total_scores else 0
    lowest_score = min(total_scores) if total_scores else 0
    average_score = round(sum(total_scores) / len(total_scores), 2) if total_scores else 0

    body = f"""
Hello Admin,

Weekly Test Report
==================================================

Report Period
{start_date:%d %b %Y} - {end_date:%d %b %Y}

Overall Summary
--------------------------------------------------

Total Tests Completed : {total_tests}
Students Attempted    : {unique_students}
Highest Score         : {highest_score} / 1600
Lowest Score          : {lowest_score} / 1600
Average Score         : {average_score} / 1600

==================================================
Student-wise Test Details
==================================================

{''.join(report)}

Regards,
TSTP System
"""

    msg = EmailMultiAlternatives(
        subject=f"Weekly Test Summary ({start_date:%d %b} - {end_date:%d %b %Y})",
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=admin_emails,
        bcc=["vijayaluguvelli@gmail.com"],
    )

    msg.send()

@shared_task
def send_test_completion_email(test_submission_id):
    try:
        
        submission = TestSubmission.objects.select_related(
            "student",
            "test",
            "result"
        ).get(id=test_submission_id)

        serializer = RecentFullLengthResultSerializer(submission)
        data = serializer.data
        completed_on = timezone.localtime(submission.completion_date)
        student = submission.student
        result = submission.result

        # Get all active admin emails
        admin_emails = list(
            User.objects.filter(
                role__name="admin",
                is_active=True
            ).values_list("email", flat=True)
        )

        if not admin_emails:
            return

        subject = f"Test Completed - {submission.test.name}"

        body = f"""
        Student has completed the test.

        Student Name : {student.name}
        Student Email: {student.email}

        Test Name    : {submission.test.name}
        Completed On : {completed_on:%d-%m-%Y %I:%M %p}

        ==============================
                SCORE SUMMARY
        ==============================

        Total Score     : {data['total_score']} / 1600
        Math Score      : {data['math_score']}
        English Score   : {data['english_score']}
        Percentage      : {data['percentage']}%
        """

        msg = EmailMultiAlternatives(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=admin_emails,
            bcc=["vijayaluguvelli@gmail.com"],
        )

        msg.send()

    except Exception as e:
        print(e)