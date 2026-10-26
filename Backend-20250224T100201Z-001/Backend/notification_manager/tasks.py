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
from course_manager.models import Question

import json
from test_manager.models import QuestionAnswer, PracticeQuestionAnswer




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
def send_question_update_email(
    student_ids,
    question_ids,
    question_changes=None,
):
    import json

    from django.conf import settings
    from django.template.loader import render_to_string
    from django.core.mail import EmailMultiAlternatives
    from django.utils import timezone

    question_changes = question_changes or []
    question_ids = {int(qid) for qid in question_ids}
    student_ids = list(set(student_ids))

    question_change_map = {
        int(item["question_id"]): item
        for item in question_changes
    }

    total_impacted_students = 0
    admin_students = []

    for student in User.objects.filter(id__in=student_ids):
        print("Processing Student:", student.name)

        impacted_tests = []

        # ===============================================
        # 1. FULL LENGTH TESTS
        # ===============================================
        answers = QuestionAnswer.objects.filter(
            question_id__in=question_ids,
            result__test_submission__student=student,
        ).select_related(
            "result__test_submission__test"
        )

        submissions = {
            answer.result.test_submission
            for answer in answers
        }

        for submission in submissions:
            try:
                view = ResultViewSet()

                request_obj = type(
                    "EmailRequest",
                    (object,),
                    {
                        "GET": {
                            "test_submission_id": submission.id
                        },
                        "user": student,
                    },
                )

                response = view.get_details(request_obj)

                if getattr(response, "status_code", 200) >= 400:
                    print(
                        "Could not load submission details:",
                        submission.id,
                    )
                    continue

                response_content = response.content

                if isinstance(response_content, bytes):
                    response_content = response_content.decode("utf-8")

                detailed_view = json.loads(response_content)

                test_name = detailed_view.get(
                    "testName",
                    "Full Length Test",
                ).replace("Test - ", "")

                for subject in detailed_view.get("subjects", []):
                    for section in subject.get("sections", []):
                        section_name = map_section_name(
                            section.get("name")
                        )

                        for question in section.get(
                            "questions_data", []
                        ):
                            question_id = question.get("question_id")

                            if question_id is None:
                                continue

                            question_id = int(question_id)

                            if question_id not in question_ids:
                                continue

                            impacted_tests.append({
                                "test_type": "Full Length Test",
                                "test_name": test_name,
                                "section_name": section_name,
                                "sr_no": Question.objects.filter(
                                    id=question_id
                                ).values_list("srno", flat=True).first(),
                                "subject": subject.get("name") or "-",
                                "topic": question.get("topic") or "-",
                                "difficulty": (
                                    question.get("difficulty") or "-"
                                ),
                                "question_id": question_id,
                                "question_change": (
                                    question_change_map.get(question_id)
                                ),
                            })

            except Exception:
                import logging
                logging.getLogger(__name__).exception(
                    "Error processing Full Length submission %s",
                    submission.id,
                )

        # ===============================================
        # 2. PRACTICE TESTS
        # ===============================================
        practice_answers = PracticeQuestionAnswer.objects.filter(
            question_id__in=question_ids,
            practice_test_result__practice_test__student=student,
        ).select_related(
            "question",
            "question__course_subject__subject",
            "question__topic",
            "practice_test_result__practice_test",
        )

        for answer in practice_answers:
            question = answer.question
            question_id = int(question.id)

            practice_result = answer.practice_test_result
            practice_test = practice_result.practice_test

            practice_test_name = (
                getattr(practice_test, "name", None)
                or str(practice_test)
            )

            impacted_tests.append({
                "test_type": "Practice Test",
                "test_name": practice_test_name,
                "section_name": "Practice Test",
                "sr_no": question.srno,
                "subject": (
                    question.course_subject.subject.name
                    if question.course_subject_id
                    else "-"
                ),
                "topic": (
                    question.topic.name if question.topic else "-"
                ),
                "difficulty": question.difficulty or "-",
                "question_id": question_id,
                "question_change": question_change_map.get(
                    question_id
                ),
            })

        # ===============================================
        # 3. REMOVE DUPLICATE TEST/QUESTION ENTRIES
        # ===============================================
        unique_tests = []
        seen = set()

        for item in impacted_tests:
            key = (
                item["test_type"],
                item["test_name"],
                item["question_id"],
                item["section_name"],
            )

            if key not in seen:
                seen.add(key)
                unique_tests.append(item)

        impacted_tests = unique_tests

        if not impacted_tests:
            continue

        total_impacted_students += 1

        impacted_question_ids = {
            item["question_id"] for item in impacted_tests
        }

        student_question_changes = [
            item
            for item in question_changes
            if int(item["question_id"]) in impacted_question_ids
        ]

        # ===============================================
        # 4. STUDENT EMAIL
        # ===============================================
        student_email_context = {
            "student_name": student.name,
            "impacted_tests": impacted_tests,
            "question_changes": student_question_changes,
        }

        student_email_body = render_to_string(
            "emails/question_update.html",
            student_email_context,
        )

        notification_description = (
            "A question correction has impacted your test performance. "
            "Your affected test results have been recalculated. "
            "Please log in to your dashboard to view your updated results."
        )

        # ===============================================
        # 5. DATABASE NOTIFICATION
        # ===============================================
        UserNotification.objects.create(
            user=student,
            subject="Question Correction Update",
            description=notification_description,
            category=Notification.TEST,
            reference_id=impacted_tests[0]["question_id"],
        )

        # ===============================================
        # 6. SEND STUDENT EMAIL
        # ===============================================
        if student.email:
            email = EmailMultiAlternatives(
                subject="Question Correction Update",
                body=notification_description,
                from_email=settings.EMAIL_HOST_USER,
                to=[student.email],
                bcc=["vijayaluguvelli@gmail.com"],
            )

            email.attach_alternative(
                student_email_body,
                "text/html",
            )

            email.send(fail_silently=False)
            print("Student email sent:", student.email)

        # ===============================================
        # 7. COLLECT ADMIN DATA
        # ===============================================
        admin_students.append({
            "name": student.name,
            "email": student.email,
            "impacted_tests": impacted_tests,
        })

    # ===============================================
    # 8. SEND ONE CONSOLIDATED ADMIN EMAIL
    # ===============================================
    if total_impacted_students > 0:
        updated_at = timezone.localtime().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

        admin_email_context = {
            "students": admin_students,
            "question_changes": question_changes,
            "total_impacted_students": total_impacted_students,
            "updated_at": updated_at,
        }

        admin_email_body = render_to_string(
            "emails/question_update_admin.html",
            admin_email_context,
        )

        admin_plain_text = (
            "Question Correction Impact Summary\n\n"
            f"Total Students Impacted: {total_impacted_students}\n"
            f"Updated At: {updated_at}\n\n"
            "The system has automatically recalculated "
            "the affected test scores."
        )

        email = EmailMultiAlternatives(
            subject="Question Correction Impact Summary",
            body=admin_plain_text,
            from_email=settings.EMAIL_HOST_USER,
            to=[settings.EMAIL_HOST_USER],
            bcc=["vijayaluguvelli@gmail.com"],
        )

        email.attach_alternative(
            admin_email_body,
            "text/html",
        )

        email.send(fail_silently=False)
        print("SINGLE ADMIN EMAIL SENT")

    print("QUESTION UPDATE TASK COMPLETED")

    return {
        "total_impacted_students": total_impacted_students,
        "question_ids": list(question_ids),
    }




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