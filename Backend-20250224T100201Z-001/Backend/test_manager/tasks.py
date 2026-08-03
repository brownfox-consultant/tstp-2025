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
        subject=f"Weekly Test Summary ",
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
        submission = (
            TestSubmission.objects.select_related(
                "student",
                "test",
                "result"
            ).get(id=test_submission_id)
        )

        student = submission.student

        # Current Test
        serializer = RecentFullLengthResultSerializer(submission)
        current_data = serializer.data

        completed_on = timezone.localtime(submission.completion_date)
        current_percentage = current_data["percentage"]

        # Fetch 4 tests:
        # First 3 -> Display
        # 4th -> Used only for comparison
        all_previous_tests = list(
            TestSubmission.objects.filter(
                student=student,
                status=TestSubmission.COMPLETED
            )
            .exclude(id=submission.id)
            .select_related("result", "test")
            .order_by("-completion_date")[:4]
        )

        display_tests = all_previous_tests[:3]

        # ============================================================
        # Current Test Performance (Current vs Previous Test)
        # ============================================================

        latest_change = None
        latest_improved = None

        if all_previous_tests:
            previous_serializer = RecentFullLengthResultSerializer(all_previous_tests[0])
            previous_data = previous_serializer.data

            diff = round(
                current_percentage - previous_data["percentage"],
                2
            )

            latest_change = abs(diff)
            latest_improved = diff >= 0

        # ============================================================
        # Previous Test Comparison
        # n2 vs n1
        # n1 vs n3
        # n3 -> No Previous Test
        # ============================================================

        comparison_data = []

        for index, test in enumerate(display_tests):

            serializer = RecentFullLengthResultSerializer(test)
            result = serializer.data

            difference = None
            is_improved = None

            # Compare with the next older test
            if index + 1 < len(all_previous_tests):

                older_test = all_previous_tests[index + 1]

                older_serializer = RecentFullLengthResultSerializer(older_test)
                older_result = older_serializer.data

                diff = round(
                    result["percentage"] - older_result["percentage"],
                    2
                )

                difference = abs(diff)
                is_improved = diff >= 0

            comparison_data.append({
                "test_name": test.test.name,
                "date": timezone.localtime(
                    test.completion_date
                ).strftime("%d-%m-%Y"),

                "total_score": result["total_score"],
                "math_score": result["math_score"],
                "english_score": result["english_score"],
                "percentage": result["percentage"],

                "difference": difference,
                "is_improved": is_improved,
            })

        # ============================================================
        # Admin Emails
        # ============================================================

        admin_emails = list(
            User.objects.filter(
                role__name="admin",
                is_active=True
            ).values_list("email", flat=True)
        )

        # ============================================================
        # Email Context
        # ============================================================

        context = {
            "student_name": student.name,
            "student_email": student.email,
            "test_name": submission.test.name,
            "completed_on": completed_on.strftime("%d-%m-%Y %I:%M %p"),

            "total_score": current_data["total_score"],
            "math_score": current_data["math_score"],
            "english_score": current_data["english_score"],
            "percentage": current_data["percentage"],

            "latest_change": latest_change,
            "latest_improved": latest_improved,

            "comparison_data": comparison_data,
        }

        html_content = render_to_string(
            "emails/test_completion.html",
            context
        )

        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(
            subject=f"{student.name} Completed Test - {submission.test.name}",
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[student.email],
            cc=admin_emails,
            bcc=["vijayaluguvelli@gmail.com"],
        )

        msg.attach_alternative(html_content, "text/html")
        msg.send()

    except Exception as e:
        print(f"Error sending test completion email: {e}")