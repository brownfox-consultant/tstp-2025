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



@shared_task
def send_pending_queries_reminder():

    print("\n========== PENDING QUERY REMINDER ==========\n")

    one_week_ago = timezone.now() - timedelta(days=7)

    pending_doubts = Doubt.objects.filter(
        status=Doubt.RAISED,
        created_at__lte=one_week_ago
    )

    pending_issues = Issue.objects.filter(
        status=Issue.RAISED,
        created_at__lte=one_week_ago
    )

    if not pending_doubts.exists() and not pending_issues.exists():
        print("No pending doubts/issues older than 7 days.")
        return

    email_body = f"""
Admin Notification

The following queries have been pending for more than 7 days.

==================================================
PENDING DOUBTS ({pending_doubts.count()})
==================================================

"""

    for doubt in pending_doubts:
        email_body += f"""
    Reference ID : {doubt.id}
    Raised By    : {getattr(doubt.student, 'name', 'N/A')}
    Email        : {getattr(doubt.student, 'email', 'N/A')}
    Created On   : {doubt.created_at.strftime('%d-%m-%Y')}
    Status       : {doubt.status}

    ----------------------------------------
    """

    email_body += f"""

==================================================
PENDING ISSUES ({pending_issues.count()})
==================================================

"""

    for issue in pending_issues:
        email_body += f"""
    Reference ID : {issue.id}
    Raised By    : {getattr(issue.student, 'name', 'N/A')}
    Email        : {getattr(issue.student, 'email', 'N/A')}
    Created On   : {issue.created_at.strftime('%d-%m-%Y')}
    Status       : {issue.status}

    ----------------------------------------
    """

    email_body += f"""

Total Pending Doubts : {pending_doubts.count()}
Total Pending Issues : {pending_issues.count()}

Generated At : {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}

Please review and take necessary action.

– TSTP System
"""

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
        send_mail(
            subject="Reminder: Pending Doubts & Issues Older Than 7 Days",
            message=email_body,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=admin_emails,
            bcc=["vijayaluguvelli@gmail.com"],
            fail_silently=False,
        )

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

    all_admin_lines = ""
    total_impacted_students = 0

    for student in User.objects.filter(id__in=student_ids):

        print("Processing Student:", student.name)

        answers = QuestionAnswer.objects.filter(
            question_id__in=question_ids,
            result__test_submission__student=student
        ).select_related("result__test_submission__test")

        if not answers.exists():
            continue

        submissions = {qa.result.test_submission for qa in answers}
        impacted_tests = []

        # ---------------------------------------------------
        # Use your existing result/details API logic
        # ---------------------------------------------------
        for submission in submissions:

            view = ResultViewSet()

            request = type("obj", (object,), {
                "GET": {"test_submission_id": submission.id},
                "user": student
            })

            response = view.get_details(request)
            detailed_view = json.loads(response.content)

            for subject in detailed_view.get("subjects", []):
                for section in subject.get("sections", []):
                    section_name = map_section_name(section.get("name"))

                    for question in section.get("questions_data", []):
                        if question["question_id"] in question_ids:

                            impacted_tests.append({
                                "test_name": detailed_view["testName"].replace("Test - ", ""),
                                "section_name": section_name,
                                "sr_no": question.get("sr_no"),
                                "subject": subject.get("name"),
                                "topic": question.get("topic"),
                                "difficulty": question.get("difficulty"),
                            })

        if not impacted_tests:
            continue

        total_impacted_students += 1

        subject_name = impacted_tests[0]["subject"]
        topic_name = impacted_tests[0]["topic"]
        difficulty = impacted_tests[0]["difficulty"]

        # ---------------------------------------------------
        # STUDENT EMAIL
        # ---------------------------------------------------
        student_lines = ""

        for t in impacted_tests:
            student_lines += f"""
Test Name : {t['test_name']}
   • Section     : {t['section_name']}
   • Question No : {t['sr_no']}
"""

        student_email_body = f"""
Hi {student.name},

A question correction has impacted your performance.

────────────────────────────────────
IMPACTED TEST DETAILS
────────────────────────────────────
{student_lines}

Subject    : {subject_name}
Topic      : {topic_name}
Difficulty : {difficulty}

Your scores have been recalculated automatically.

Please log in to your dashboard to view updated results.

– TSTP Team
"""

        # Save notification in DB
        UserNotification.objects.create(
            user=student,
            subject="Question Correction Update",
            description=student_email_body,
            category=Notification.TEST,
            reference_id=impacted_tests[0]["sr_no"],
        )

        # Send student email
        send_mail(
            subject="Question Correction Update",
            message=student_email_body,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[student.email],
            bcc=["vijayaluguvelli@gmail.com"],
            fail_silently=False,
        )

        # ---------------------------------------------------
        # COLLECT ADMIN DATA (DON’T SEND YET)
        # ---------------------------------------------------
        admin_student_block = f"""
Student Name  : {student.name}
Student Email : {student.email}

"""

        for t in impacted_tests:
            admin_student_block += f"""
Test Name : {t['test_name']}
   • Section     : {t['section_name']}
   • Question No : {t['sr_no']}
"""

        admin_student_block += "\n--------------------------------------------\n"

        all_admin_lines += admin_student_block

    # ====================================================
    # SEND SINGLE ADMIN EMAIL
    # ====================================================
    if total_impacted_students > 0:

        admin_email_body = f"""
Admin Notification

A question correction has impacted students.

────────────────────────────────────
STUDENT IMPACT SUMMARY
────────────────────────────────────

{all_admin_lines}

Total Students Impacted : {total_impacted_students}
Updated At              : {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}

System has recalculated scores automatically.

– TSTP System
"""

        send_mail(
            subject="Question Correction Impact Summary",
            message=admin_email_body,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[settings.EMAIL_HOST_USER],
            bcc=["vijayaluguvelli@gmail.com"],
            fail_silently=False,
        )

        print("✅ SINGLE ADMIN EMAIL SENT")

    print("\n========== TASK COMPLETED ==========\n")
