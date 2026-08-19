from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import json

from user_manager.models import User
from notification_manager.models import UserNotification, Notification
from test_manager.models import QuestionAnswer
from test_manager.views import ResultViewSet
from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta

from system_manager.models import Doubt, Issue
from user_manager.models import User
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives

import json




@shared_task
def send_pending_queries_reminder():

    print("\n========== PENDING QUERY REMINDER ==========\n")

    one_week_ago = timezone.now() - timedelta(days=3)

    pending_doubts = Doubt.objects.filter(
        status=Doubt.RAISED,
        created_at__lte=one_week_ago
    )

    pending_issues = Issue.objects.filter(
        status=Issue.RAISED,
        created_at__lte=one_week_ago
    )

    if not pending_doubts.exists() and not pending_issues.exists():
        print("No pending doubts/issues older than 3 days.")
        return

    html_content = render_to_string(
        "emails/pending_queries_reminder.html",
        {
            "pending_doubts": pending_doubts,
            "pending_issues": pending_issues,
        },
    )

    # Send to all admins
    admin_emails = list(
        User.objects.filter(
            is_active=True,
            is_superuser=True
        ).exclude(
            email__isnull=True
        ).exclude(
            email=""
        ).values_list("email", flat=True)
    )

    if admin_emails:
        email = EmailMultiAlternatives(
        subject="Reminder: Pending Doubts & Issues Older Than 3 Days",
        body="Please view this email in HTML format.",
        from_email=settings.EMAIL_HOST_USER,
        to=admin_emails,
        bcc=["vijayaluguvelli@gmail.com"],
    )

    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)

    print(f"✅ Reminder email sent to {len(admin_emails)} admin(s)")

    print("\n========== REMINDER TASK COMPLETED ==========\n")



def map_section_name(section_name):
    """
    Convert:
    Section - 1 → Section A
    Section - 2 → Section B
    Section 1  → Section A
    Section 2  → Section B
    """

    if not section_name:
        return "N/A"

    if "1" in section_name:
        return "Section A"
    elif "2" in section_name:
        return "Section B"

    return section_name


@shared_task
def send_question_update_email(student_ids, question_ids):

    print("\n========== QUESTION UPDATE EMAIL TASK ==========\n")

    total_impacted_students = 0
    admin_students = []

    for student in User.objects.filter(id__in=student_ids):

        print("Processing Student:", student.name)

        answers = QuestionAnswer.objects.filter(
            question_id__in=question_ids,
            result__test_submission__student=student
        ).select_related(
            "result__test_submission__test"
        )

        if not answers.exists():
            continue

        submissions = {
            qa.result.test_submission
            for qa in answers
        }

        impacted_tests = []

        # ---------------------------------------------------
        # GET RESULT DETAILS
        # ---------------------------------------------------

        for submission in submissions:

            view = ResultViewSet()

            request = type(
                "obj",
                (object,),
                {
                    "GET": {
                        "test_submission_id": submission.id
                    },
                    "user": student
                }
            )

            response = view.get_details(request)

            detailed_view = json.loads(response.content)

            for subject in detailed_view.get("subjects", []):

                for section in subject.get("sections", []):

                    section_name = map_section_name(
                        section.get("name")
                    )

                    for question in section.get(
                        "questions_data",
                        []
                    ):

                        if question["question_id"] in question_ids:

                            impacted_tests.append({
                                "test_name": detailed_view[
                                    "testName"
                                ].replace("Test - ", ""),

                                "section_name": section_name,

                                "sr_no": question.get("sr_no"),

                                "subject": subject.get("name"),

                                "topic": question.get("topic"),

                                "difficulty": question.get(
                                    "difficulty"
                                ),
                            })

        if not impacted_tests:
            continue

        total_impacted_students += 1

        # ---------------------------------------------------
        # SUBJECT / TOPIC / DIFFICULTY
        # ---------------------------------------------------

        subject_name = impacted_tests[0]["subject"]
        topic_name = impacted_tests[0]["topic"]
        difficulty = impacted_tests[0]["difficulty"]

        # ===================================================
        # STUDENT NOTIFICATION
        # ===================================================

        student_email_context = {
            "student_name": student.name,
            "impacted_tests": impacted_tests,
            "subject_name": subject_name,
            "topic_name": topic_name,
            "difficulty": difficulty,
        }

        student_email_body = render_to_string(
            "emails/question_update.html",
            student_email_context
        )

        # ---------------------------------------------------
        # DATABASE NOTIFICATION
        # ---------------------------------------------------

        notification_description = f"""
A question correction has impacted your test performance.

Please log in to your dashboard to view your updated results.
"""

        UserNotification.objects.create(
            user=student,
            subject="Question Correction Update",
            description=notification_description,
            category=Notification.TEST,
            reference_id=impacted_tests[0]["sr_no"],
        )

        # ---------------------------------------------------
        # SEND STUDENT EMAIL
        # ---------------------------------------------------

        email = EmailMultiAlternatives(
            subject="Question Correction Update",
            body=notification_description,
            from_email=settings.EMAIL_HOST_USER,
            to=[student.email],
            bcc=["vijayaluguvelli@gmail.com"],
        )

        email.attach_alternative(
            student_email_body,
            "text/html"
        )

        email.send(fail_silently=False)

        print(
            "✅ Student email sent:",
            student.email
        )

        # ===================================================
        # COLLECT ADMIN DATA
        # ===================================================

        admin_students.append({
            "name": student.name,
            "email": student.email,
            "impacted_tests": impacted_tests,
        })

    # =======================================================
    # SINGLE ADMIN EMAIL
    # =======================================================

    if total_impacted_students > 0:

        updated_at = timezone.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

        admin_email_context = {
            "students": admin_students,
            "total_impacted_students": total_impacted_students,
            "updated_at": updated_at,
        }

        admin_email_body = render_to_string(
            "emails/question_update_admin.html",
            admin_email_context
        )

        admin_plain_text = f"""
Question Correction Impact Summary

Total Students Impacted : {total_impacted_students}
Updated At              : {updated_at}

The system has automatically recalculated
the affected test scores.
"""

        email = EmailMultiAlternatives(
            subject="Question Correction Impact Summary",
            body=admin_plain_text,
            from_email=settings.EMAIL_HOST_USER,
            to=[settings.EMAIL_HOST_USER],
            bcc=["vijayaluguvelli@gmail.com"],
        )

        email.attach_alternative(
            admin_email_body,
            "text/html"
        )

        email.send(fail_silently=False)

        print("✅ SINGLE ADMIN EMAIL SENT")

    print(
        "\n========== TASK COMPLETED ==========\n"
    )


@shared_task
def send_subscription_summary_email(students, report_type):

    generated_at = timezone.now().strftime("%Y-%m-%d %H:%M:%S")

    body = render_to_string(
        "emails/subscription_summary.html",
        {
            "students": students,
            "report_type": report_type,
            "generated_at": generated_at,
        }
    )

    admin_emails = list(
        User.objects.filter(
            is_superuser=True,
            is_active=True
        ).exclude(
            email=""
        ).values_list("email", flat=True)
    )

    if admin_emails:
        email = EmailMessage(
            subject=f"Subscription {report_type} Summary",
            body=body,
            from_email=settings.EMAIL_HOST_USER,
            to=admin_emails,
            bcc=["vijayaluguvelli@gmail.com"],
        )

        email.content_subtype = "html"
        email.send(fail_silently=False)