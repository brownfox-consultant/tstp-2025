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
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags



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

    # Prepare data for template
    test_data = []
    total_scores = []

    for submission in tests:
        serializer = RecentFullLengthResultSerializer(submission)
        data = serializer.data
        score = data["total_score"]
        total_scores.append(score)
        
        test_data.append({
            'student_name': submission.student.name,
            'student_email': submission.student.email,
            'test_name': submission.test.name,
            'course_name': submission.test.course.name,
            'completion_date': timezone.localtime(submission.completion_date),
            'total_score': data['total_score'],
            'math_score': data['math_score'],
            'english_score': data['english_score'],
            'percentage': data['percentage'],
        })

    highest_score = max(total_scores) if total_scores else 0
    lowest_score = min(total_scores) if total_scores else 0
    average_score = round(sum(total_scores) / len(total_scores), 2) if total_scores else 0

    context = {
        'start_date': start_date,
        'end_date': end_date,
        'total_tests': total_tests,
        'unique_students': unique_students,
        'highest_score': highest_score,
        'lowest_score': lowest_score,
        'average_score': average_score,
        'test_data': test_data,
    }

    # Render HTML template
    html_content = render_to_string('emails/weekly_test_summary.html', context)
    text_content = strip_tags(html_content)  # Fallback plain text

    msg = EmailMultiAlternatives(
        subject=f"Weekly Test Summary ({start_date:%d %b} - {end_date:%d %b %Y})",
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=admin_emails,
        bcc=["vijayaluguvelli@gmail.com"],
    )
    msg.attach_alternative(html_content, "text/html")
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